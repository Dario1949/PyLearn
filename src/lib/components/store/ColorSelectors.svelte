<script>
  import { getThemeColor, setThemeColor, getBackgroundColor, setBackgroundColor, getCardColor, setCardColor, getTextColor, setTextColor, resetToDefaultTheme, applyThemePreset } from '$lib/stores/theme.svelte.js';
  
  let me = $state({ unlocked: [] });
  let selectedColor = $state(getThemeColor());
  let selectedBackground = $state(getBackgroundColor());
  let selectedCardColor = $state(getCardColor());
  let selectedTextColor = $state(getTextColor());
  
  // Sincronizar valores cuando se carga el componente
  $effect(() => {
    selectedColor = getThemeColor();
    selectedBackground = getBackgroundColor();
    selectedCardColor = getCardColor();
    selectedTextColor = getTextColor();
  });

  const colors = [
    { name: 'Naranja', value: '#d97706' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Púrpura', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Índigo', value: '#6366f1' },
    { name: 'Cian', value: '#06b6d4' },
    { name: 'Lima', value: '#84cc16' },
    { name: 'Esmeralda', value: '#059669' },
    { name: 'Violeta', value: '#7c3aed' },
    { name: 'Fucsia', value: '#d946ef' },
    { name: 'Coral', value: '#f97316' },
    { name: 'Turquesa', value: '#14b8a6' },
    { name: 'Magenta', value: '#e11d48' }
  ];

  function setColor(color) {
    setThemeColor(color);
    selectedColor = getThemeColor();
  }
  
  function setBackground(color) {
    setBackgroundColor(color);
    selectedBackground = getBackgroundColor();
  }
  
  function setCard(color) {
    setCardColor(color);
    selectedCardColor = getCardColor();
  }
  
  function setText(color) {
    setTextColor(color);
    selectedTextColor = getTextColor();
  }

  function resetToDefaults() {
    resetToDefaultTheme();
    selectedColor = getThemeColor();
    selectedBackground = getBackgroundColor();
    selectedCardColor = getCardColor();
    selectedTextColor = getTextColor();
  }

  function applyTheme(colors) {
    applyThemePreset(colors);
    selectedColor = getThemeColor();
    selectedBackground = getBackgroundColor();
    selectedCardColor = getCardColor();
    selectedTextColor = getTextColor();
  }

  // Temas predeterminados disponibles
  const themePresets = [
    {
      id: 'theme_ocean',
      name: 'Tema Océano',
      icon: '🌊',
      colors: { theme: '#3b82f6', background: '#0c4a6e', card: '#1e3a8a', text: '#ffffff' }
    },
    {
      id: 'theme_forest',
      name: 'Tema Bosque',
      icon: '🌲',
      colors: { theme: '#10b981', background: '#064e3b', card: '#166534', text: '#ffffff' }
    },
    {
      id: 'theme_sunset',
      name: 'Tema Atardecer',
      icon: '🌅',
      colors: { theme: '#f97316', background: '#451a03', card: '#9a3412', text: '#ffffff' }
    },
    {
      id: 'theme_purple',
      name: 'Tema Púrpura',
      icon: '💜',
      colors: { theme: '#8b5cf6', background: '#4c1d95', card: '#6b21a8', text: '#ffffff' }
    },
    {
      id: 'theme_dark',
      name: 'Tema Oscuro',
      icon: '🖤',
      colors: { theme: '#6b7280', background: '#000000', card: '#1f2937', text: '#ffffff' }
    },
    {
      id: 'theme_rose',
      name: 'Tema Rosa',
      icon: '🌸',
      colors: { theme: '#ec4899', background: '#831843', card: '#be185d', text: '#ffffff' }
    }
  ];

  async function fetchUnlocked() {
    try {
      const res = await fetch("/api/store/me");
      const data = await res.json();
      if (data?.success) {
        me.unlocked = Array.isArray(data.unlocked) ? data.unlocked : [];
      }
    } catch (e) {
      console.warn('Error al cargar items desbloqueados:', e);
    }
  }

  $effect(() => {
    fetchUnlocked();
  });
  
  // Actualizar valores seleccionados cuando cambian en el store
  $effect(() => {
    if (me.unlocked.length > 0) {
      selectedColor = getThemeColor();
      selectedBackground = getBackgroundColor();
      selectedCardColor = getCardColor();
      selectedTextColor = getTextColor();
    }
  });
</script>

<!-- Temas Predeterminados -->
{#if themePresets.some(preset => me?.unlocked?.includes(preset.id))}
  <div class="border border-primary rounded-lg p-4 bg-background mt-4">
    <div class="font-semibold text-card-foreground mb-1">Temas Predeterminados</div>
    <div class="text-sm text-muted mb-3">
      Aplica combinaciones de colores prediseñadas.
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each themePresets as preset}
        {#if me?.unlocked?.includes(preset.id)}
          <button
            class="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all hover:scale-105 bg-card/50"
            on:click={() => applyTheme(preset.colors)}
          >
            <span class="text-2xl">{preset.icon}</span>
            <div class="text-left">
              <div class="font-medium text-card-foreground text-sm">{preset.name}</div>
              <div class="flex gap-1 mt-1">
                <div class="w-3 h-3 rounded-full border border-white/20" style="background-color: {preset.colors.theme}"></div>
                <div class="w-3 h-3 rounded-full border border-white/20" style="background-color: {preset.colors.background}"></div>
                <div class="w-3 h-3 rounded-full border border-white/20" style="background-color: {preset.colors.card}"></div>
              </div>
            </div>
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<!-- Botón Predeterminado -->
{#if me?.unlocked?.includes('color_selector') || me?.unlocked?.includes('card_color_selector') || me?.unlocked?.includes('background_selector')}
  <div class="border border-primary rounded-lg p-4 bg-background mt-4">
    <div class="font-semibold text-card-foreground mb-1">Restaurar Predeterminado</div>
    <div class="text-sm text-muted mb-3">
      Vuelve a los colores originales de la aplicación.
    </div>
    <button
      class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      on:click={resetToDefaults}
    >
      🔄 Predeterminado
    </button>
  </div>
{/if}

<!-- Selector de Color Principal -->
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

<!-- Selector de Color de Tarjetas -->
{#if me?.unlocked?.includes('card_color_selector')}
  <div class="border border-primary rounded-lg p-4 bg-background mt-4">
    <div class="font-semibold text-card-foreground mb-1">Selector de Color de Tarjetas</div>
    <div class="text-sm text-muted mb-3">
      Personaliza el color de los rectángulos y tarjetas.
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {#each [{ name: 'Gris Oscuro', value: '#2d3748' }, { name: 'Azul Oscuro', value: '#1e3a8a' }, { name: 'Verde Oscuro', value: '#166534' }, { name: 'Púrpura Oscuro', value: '#6b21a8' }, { name: 'Rojo Oscuro', value: '#991b1b' }, { name: 'Naranja Oscuro', value: '#c2410c' }, { name: 'Cian Oscuro', value: '#164e63' }, { name: 'Rosa Oscuro', value: '#be185d' }, { name: 'Índigo Oscuro', value: '#3730a3' }, { name: 'Esmeralda Oscuro', value: '#064e3b' }, { name: 'Violeta Oscuro', value: '#581c87' }, { name: 'Coral Oscuro', value: '#9a3412' }] as cardColor}
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

<!-- Selector de Color de Texto -->
{#if me?.unlocked?.includes('text_color_selector')}
  <div class="border border-primary rounded-lg p-4 bg-background mt-4">
    <div class="font-semibold text-card-foreground mb-1">Selector de Color de Texto</div>
    <div class="text-sm text-muted mb-3">
      Personaliza el color de la fuente de texto.
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {#each [{ name: 'Blanco', value: '#ffffff' }, { name: 'Negro', value: '#000000' }, { name: 'Gris Claro', value: '#d1d5db' }, { name: 'Gris Oscuro', value: '#374151' }, { name: 'Azul', value: '#3b82f6' }, { name: 'Verde', value: '#10b981' }, { name: 'Rojo', value: '#ef4444' }, { name: 'Amarillo', value: '#f59e0b' }] as textColor}
        <button
          class="flex items-center gap-2 p-2 rounded-lg border transition-all hover:scale-105 {selectedTextColor === textColor.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
          on:click={() => setText(textColor.value)}
        >
          <div 
            class="w-6 h-6 rounded border-2 border-white shadow-sm" 
            style="background-color: {textColor.value}"
          ></div>
          <span class="text-sm font-medium text-card-foreground">{textColor.name}</span>
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
      {#each [{ name: 'Azul Oscuro', value: '#1a202c' }, { name: 'Negro', value: '#000000' }, { name: 'Gris Oscuro', value: '#1f2937' }, { name: 'Púrpura Oscuro', value: '#1e1b4b' }, { name: 'Verde Oscuro', value: '#064e3b' }, { name: 'Marrón Oscuro', value: '#451a03' }, { name: 'Azul Marino', value: '#0c4a6e' }, { name: 'Violeta Profundo', value: '#4c1d95' }, { name: 'Rojo Oscuro', value: '#7f1d1d' }, { name: 'Esmeralda Profundo', value: '#022c22' }, { name: 'Índigo Profundo', value: '#1e1b4b' }, { name: 'Carbón', value: '#18181b' }] as bgColor}
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