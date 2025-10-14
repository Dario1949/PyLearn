<script>
  let me = $state({ points: 0, unlocked: [], catalog: [] });
  let loading = $state(false);
  let error = $state("");
  let selectedCategory = $state('todas');
  let showFilters = $state(false);
  let purchaseFilter = $state('todas'); // 'todas', 'compradas', 'no_compradas'
  let user = $state(null);
  
  const categories = [
    { id: 'todas', name: 'Todas las categorías', icon: '🛒' },
    { id: 'perfil', name: 'Personalización de Perfil', icon: '👤' },
    { id: 'colores', name: 'Personalización de Colores', icon: '🎨' },
    { id: 'insignias', name: 'Insignias y Logros', icon: '🏆' }
  ];
  
  const purchaseFilters = [
    { id: 'todas', name: 'Todas', icon: '📋' },
    { id: 'compradas', name: 'Compradas', icon: '✅' },
    { id: 'no_compradas', name: 'Disponibles', icon: '🛒' }
  ];
  
  const getCategoryTitle = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : '';
  };
  
  const getItemsByCategory = () => {
    const grouped = {};
    const filteredCatalog = filterByPurchaseStatus(me.catalog);
    filteredCatalog.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    return grouped;
  };
  
  const filterByPurchaseStatus = (items) => {
    if (purchaseFilter === 'compradas') {
      return items.filter(item => me.unlocked.includes(item.id));
    } else if (purchaseFilter === 'no_compradas') {
      return items.filter(item => !me.unlocked.includes(item.id));
    }
    return items;
  };

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
    } catch (e) {
      error = e?.message || "Error al cargar tienda";
    } finally {
      loading = false;
    }
  }

  async function resetRewards() {
    if (!confirm('¿Estás seguro de que quieres resetear todas las recompensas? Esta acción no se puede deshacer.')) {
      return;
    }
    
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/store/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "No se pudo resetear las recompensas");
      
      // Recargar datos después del reset
      await fetchMe();
    } catch (e) {
      error = e?.message || "Error al resetear recompensas";
    } finally {
      loading = false;
    }
  }

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data?.success) {
        user = data.user;
      }
    } catch (e) {
      console.warn('Error al cargar usuario:', e);
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

      me.points = Number(data.points || 0);
      me.unlocked = Array.isArray(data.unlocked) ? data.unlocked : me.unlocked;
    } catch (e) {
      error = e?.message || "Error al comprar";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    fetchMe();
    fetchUser();
  });
</script>

<svelte:head>
  <title>Tienda - Learn Python</title>
</svelte:head>

<div class="w-full px-6 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-card-foreground mb-2">🛒 Tienda de Recompensas</h1>
    <p class="text-muted">Usa tus puntos para desbloquear nuevas funcionalidades y personalizar tu experiencia</p>
  </div>

  <div class="bg-card rounded-xl p-6 border border-border mb-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-card-foreground">💰 Tus Puntos</h2>
      <div class="flex items-center gap-4">
        <span class="text-2xl font-bold text-primary">{me.points} pts</span>
        {#if user?.role === 'admin' || user?.role === 'teacher'}
          <button
            class="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            disabled={loading}
            on:click={resetRewards}
          >
            🔄 Reset
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if error}
    <div class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <p class="text-destructive">{error}</p>
    </div>
  {/if}

  <!-- Botón para mostrar filtros -->
  <div class="mb-6">
    <button
      class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      on:click={() => showFilters = !showFilters}
    >
      📊 {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
    </button>
  </div>

  <!-- Layout principal con sidebar -->
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Sidebar vertical -->
    {#if showFilters}
    <div class="w-full lg:w-64 lg:flex-shrink-0">
      <div class="bg-card rounded-xl p-6 border border-border lg:sticky lg:top-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-card-foreground mb-4">Estado</h3>
          <div class="flex flex-wrap gap-2 lg:flex-col lg:space-y-2">
            {#each purchaseFilters as filter}
              <button
                class="flex-1 lg:w-full px-3 py-2 rounded-lg transition-colors text-left {purchaseFilter === filter.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                on:click={() => purchaseFilter = filter.id}
              >
                <span class="mr-2">{filter.icon}</span>
                {filter.name}
              </button>
            {/each}
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-semibold text-card-foreground mb-4">Categorías</h3>
          <div class="flex flex-wrap gap-2 lg:flex-col lg:space-y-2">
            {#each categories as category}
              <button
                class="flex-1 lg:w-full px-3 py-2 rounded-lg transition-colors text-left {selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                on:click={() => selectedCategory = category.id}
              >
                <span class="mr-2">{category.icon}</span>
                {category.name}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
    {/if}

    <!-- Contenido principal -->
    <div class="flex-1">

  {#if loading && me.catalog.length === 0}
    <div class="text-center py-8">
      <p class="text-muted">Cargando catálogo...</p>
    </div>
  {:else if selectedCategory === 'todas'}
    <!-- Mostrar todas las categorías con títulos -->
    {@const groupedItems = getItemsByCategory()}
    {#each Object.entries(groupedItems) as [categoryId, items]}
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-card-foreground mb-4">
          {getCategoryTitle(categoryId)}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each items as item (item.id)}
            <div class="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div class="mb-4">
                <div class="flex items-center gap-3 mb-2">
                  {#if item.icon}
                    <span class="text-4xl">{item.icon}</span>
                  {/if}
                  <h3 class="text-lg font-semibold text-card-foreground">{item.name}</h3>
                </div>
                <p class="text-sm text-muted">{item.description}</p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-primary">{item.cost} pts</span>
                {#if me?.unlocked?.includes(item.id)}
                  <div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    ✅ Desbloqueado
                  </div>
                {:else}
                  <button
                    class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loading || me.points < (item.cost || 0)}
                    on:click={() => purchase(item.id)}
                  >
                    Comprar
                  </button>
                {/if}
              </div>
              {#if !me?.unlocked?.includes(item.id) && me.points < (item.cost || 0)}
                <div class="mt-2 text-xs text-muted">
                  Te faltan {(item.cost || 0) - me.points} puntos
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <!-- Mostrar categoría filtrada -->
    {@const filteredItems = filterByPurchaseStatus(me.catalog.filter(item => item.category === selectedCategory))}
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-card-foreground mb-4">
        {getCategoryTitle(selectedCategory)}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredItems as item (item.id)}
          <div class="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
            <div class="mb-4">
              <div class="flex items-center gap-3 mb-2">
                {#if item.icon}
                  <span class="text-4xl">{item.icon}</span>
                {/if}
                <h3 class="text-lg font-semibold text-card-foreground">{item.name}</h3>
              </div>
              <p class="text-sm text-muted">{item.description}</p>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-primary">{item.cost} pts</span>
              {#if me?.unlocked?.includes(item.id)}
                <div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  ✅ Desbloqueado
                </div>
              {:else}
                <button
                  class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={loading || me.points < (item.cost || 0)}
                  on:click={() => purchase(item.id)}
                >
                  Comprar
                </button>
              {/if}
            </div>
            {#if !me?.unlocked?.includes(item.id) && me.points < (item.cost || 0)}
              <div class="mt-2 text-xs text-muted">
                Te faltan {(item.cost || 0) - me.points} puntos
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
    </div>
  </div>
</div>