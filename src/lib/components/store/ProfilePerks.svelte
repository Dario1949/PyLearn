<script>
  import { getThemeColor, setThemeColor, getBackgroundColor, setBackgroundColor, getCardColor, setCardColor } from '$lib/stores/theme.svelte.js';
  
  // ✅ ÚNICA llamada a $props()
  let { onUpdated = null } = $props(); // callback opcional desde el padre

  let me = $state({ points: 0, unlocked: [], catalog: [] });
  let loading = $state(false);
  let error = $state("");

  // Colores seleccionados por el usuario
  let selectedColor = $state(getThemeColor());
  let selectedBackground = $state(getBackgroundColor());
  let selectedCardColor = $state(getCardColor());

  // Colores predefinidos
  const colors = [
    { name: 'Naranja', value: '#d97706' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Púrpura', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Índigo', value: '#6366f1' }
  ];

  function setColor(color) {
    selectedColor = color;
    setThemeColor(color); // Actualizar el tema globalmente
  }
  
  function setBackground(color) {
    selectedBackground = color;
    setBackgroundColor(color); // Actualizar el fondo globalmente
  }
  
  function setCard(color) {
    selectedCardColor = color;
    setCardColor(color); // Actualizar el color de tarjetas globalmente
  }

  async function fetchMe() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/store/me");
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "No se pudo cargar la tienda");
      me = {
        points: Number(data.points || 0),
        unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
        catalog: Array.isArray(data.catalog) ? data.catalog : [],
      };
      console.log('Catálogo cargado:', me.catalog.length, 'items');
      console.log('Items del catálogo:', me.catalog.map(item => item.id));
    } catch (e) {
      error = e?.message || "Error al cargar tienda";
    } finally {
      loading = false;
    }
  }

  async function purchase(itemId) {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "No se pudo completar la compra");

      // Actualizar estado local con nueva info
      me.points = Number(data.points || 0);
      me.unlocked = Array.isArray(data.unlocked) ? data.unlocked : me.unlocked;

      // Avisar al padre (ej. para refrescar permisos/puntos)
      if (typeof onUpdated === "function") onUpdated();
    } catch (e) {
      error = e?.message || "Error al comprar";
    } finally {
      loading = false;
    }
  }

  // Cargar info de la tienda al montar
  $effect(() => {
    fetchMe();
  });

  // Actualizar tema cuando cambie el estado de desbloqueo
  $effect(() => {
    if (me.unlocked && typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          if (user?.id) {
            import('$lib/stores/theme.svelte.js').then(({ loadThemeForUser }) => {
              loadThemeForUser(
                user.id, 
                me.unlocked.includes('color_selector'),
                me.unlocked.includes('background_selector'),
                me.unlocked.includes('card_color_selector')
              );
            });
          }
        } catch (e) {
          console.warn('Error al cargar tema del usuario:', e);
        }
      }
    }
  });
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-card-foreground">
      Tienda de Personalización
    </h3>
    <span class="text-sm text-muted">
      Puntos: <span class="font-semibold">{me.points}</span>
    </span>
  </div>

  {#if error}
    <div class="mb-3 text-sm text-destructive">{error}</div>
  {/if}

  {#if loading && me.catalog.length === 0}
    <div class="text-sm text-muted">Cargando catálogo...</div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each me.catalog as item (item.id)}
        <div class="border border-border rounded-lg p-4 bg-background">
          <div class="font-semibold text-card-foreground mb-1">{item.name}</div>
          <div class="text-sm text-muted mb-3">{item.description}</div>

          {#if me?.unlocked?.includes(item.id)}
            <div
              class="text-xs px-2 py-1 rounded bg-primary/10 text-primary inline-block"
            >
              Desbloqueado
            </div>
          {:else}
            <button
              class="text-sm px-3 py-1 rounded-md border border-border hover:bg-primary/10 disabled:opacity-50"
              disabled={loading || me.points < (item.cost || 0)}
              on:click={() => purchase(item.id)}
            >
              Desbloquear ({item.cost} pts)
            </button>
            {#if me.points < (item.cost || 0)}
              <div class="mt-1 text-xs text-muted">
                Te faltan {(item.cost || 0) - me.points} pts
              </div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- ✅ Bloque seguro para el selector de color -->
  {#if me?.unlocked?.includes('color_selector')}
    <div class="border border-primary rounded-lg p-4 bg-background mt-4">
      <div class="font-semibold text-card-foreground mb-1">Selector de color</div>
      <div class="text-sm text-muted mb-3">
        Elige el color que más te guste para tu perfil.
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {#each colors as color}
          <button
            class="flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 {selectedColor === color.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
            on:click={() => setColor(color.value)}
          >
            <div 
              class="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
              style="background-color: {color.value}"
            ></div>
            <span class="text-sm font-medium text-card-foreground">{color.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Sección de Insignias -->
  {#if me?.unlocked?.includes('badges_pack')}
    <div class="border border-primary rounded-lg p-4 bg-background mt-4">
      <div class="font-semibold text-card-foreground mb-3">Mis Insignias</div>
      
      <!-- Insignias Desbloqueadas -->
      {#if me?.unlocked?.some(id => ['badge_bronze', 'badge_silver', 'badge_gold', 'badge_platinum'].includes(id))}
        <div class="mb-4">
          <h4 class="text-sm font-medium text-green-600 mb-2">✅ Desbloqueadas</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {#if me?.unlocked?.includes('badge_bronze')}
              <div class="flex items-center gap-2 p-2 rounded-lg border border-amber-600 bg-amber-50">
                <img src="/badges/bronze.png" alt="Insignia Bronce" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-medium text-amber-800">Bronce</span>
              </div>
            {/if}
            {#if me?.unlocked?.includes('badge_silver')}
              <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-500 bg-gray-100">
                <img src="/badges/silver.png" alt="Insignia Plata" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-medium text-gray-700">Plata</span>
              </div>
            {/if}
            {#if me?.unlocked?.includes('badge_gold')}
              <div class="flex items-center gap-2 p-2 rounded-lg border border-yellow-500 bg-yellow-50">
                <img src="/badges/gold.png" alt="Insignia Oro" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-medium text-yellow-700">Oro</span>
              </div>
            {/if}
            {#if me?.unlocked?.includes('badge_platinum')}
              <div class="flex items-center gap-2 p-2 rounded-lg border border-purple-500 bg-purple-50">
                <img src="/badges/platinum.jpg" alt="Insignia Platino" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-medium text-purple-700">Platino</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Insignias Bloqueadas -->
      <div>
        <h4 class="text-sm font-medium text-gray-500 mb-2">🔒 Por desbloquear</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {#if !me?.unlocked?.includes('badge_bronze')}
            <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 opacity-50">
              <img src="/badges/bronze.png" alt="Insignia Bronce" class="w-8 h-8 rounded-full grayscale" />
              <span class="text-sm font-medium text-gray-500">Bronce</span>
            </div>
          {/if}
          {#if !me?.unlocked?.includes('badge_silver')}
            <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 opacity-50">
              <img src="/badges/silver.png" alt="Insignia Plata" class="w-8 h-8 rounded-full grayscale" />
              <span class="text-sm font-medium text-gray-500">Plata</span>
            </div>
          {/if}
          {#if !me?.unlocked?.includes('badge_gold')}
            <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 opacity-50">
              <img src="/badges/gold.png" alt="Insignia Oro" class="w-8 h-8 rounded-full grayscale" />
              <span class="text-sm font-medium text-gray-500">Oro</span>
            </div>
          {/if}
          {#if !me?.unlocked?.includes('badge_platinum')}
            <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 opacity-50">
              <img src="/badges/platinum.jpg" alt="Insignia Platino" class="w-8 h-8 rounded-full grayscale" />
              <span class="text-sm font-medium text-gray-500">Platino</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Selector de Color de Tarjetas -->
  {#if me?.unlocked?.includes('card_color_selector')}
    <div class="border border-primary rounded-lg p-4 bg-background mt-4">
      <div class="font-semibold text-card-foreground mb-1">Selector de Color de Tarjetas</div>
      <div class="text-sm text-muted mb-3">
        Personaliza el color de los rectángulos y tarjetas.
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {#each [{ name: 'Gris Oscuro', value: '#2d3748' }, { name: 'Azul Oscuro', value: '#1e3a8a' }, { name: 'Verde Oscuro', value: '#166534' }, { name: 'Púrpura Oscuro', value: '#6b21a8' }, { name: 'Rojo Oscuro', value: '#991b1b' }, { name: 'Naranja Oscuro', value: '#c2410c' }] as cardColor}
          <button
            class="flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 {selectedCardColor === cardColor.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
            on:click={() => setCard(cardColor.value)}
          >
            <div 
              class="w-6 h-6 rounded border-2 border-white shadow-sm" 
              style="background-color: {cardColor.value}"
            ></div>
            <span class="text-sm font-medium text-card-foreground">{cardColor.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Selector de Fondo -->
  {#if me?.unlocked?.includes('background_selector')}
    <div class="border border-primary rounded-lg p-4 bg-background mt-4">
      <div class="font-semibold text-card-foreground mb-1">Selector de Fondo</div>
      <div class="text-sm text-muted mb-3">
        Personaliza el color de fondo de la aplicación.
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {#each [{ name: 'Azul Oscuro', value: '#1a202c' }, { name: 'Negro', value: '#000000' }, { name: 'Gris Oscuro', value: '#1f2937' }, { name: 'Púrpura Oscuro', value: '#1e1b4b' }, { name: 'Verde Oscuro', value: '#064e3b' }, { name: 'Marrón Oscuro', value: '#451a03' }] as bgColor}
          <button
            class="flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 {selectedBackground === bgColor.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
            on:click={() => setBackground(bgColor.value)}
          >
            <div 
              class="w-6 h-6 rounded border-2 border-white shadow-sm" 
              style="background-color: {bgColor.value}"
            ></div>
            <span class="text-sm font-medium text-card-foreground">{bgColor.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>