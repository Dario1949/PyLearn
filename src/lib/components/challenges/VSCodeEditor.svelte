<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { tick } from 'svelte';

  export let code = '';
  export let language = 'python'; // asegúrate que sea un id válido: 'python','javascript','typescript','json','html',...
  export let theme = 'vs-dark';
  export let editorHeight = 'h-96';
  export let readOnly = false;

  let mounted = false;
  let MonacoEditor = null;
  let monaco = null; // referencia a la API de monaco-editor
  let editorInstance = null; // referencia al editor (si el wrapper la expone)

  const options = {
    automaticLayout: true,
    minimap: { enabled: false },
    scrollbar: { vertical: 'auto', horizontal: 'auto' },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    readOnly
    // NOTA: no todos los wrappers aceptan `language` en options; lo forzaremos abajo.
  };

  // función que fuerza el lenguaje en todos los modelos
  function forceLanguageToModels(lang) {
    if (!monaco) return;
    try {
      const models = monaco.editor.getModels();
      if (!models || models.length === 0) return;
      models.forEach((m) => {
        // solo cambiar si es distinto
        if (m.getModeId() !== lang) {
          monaco.editor.setModelLanguage(m, lang);
          console.log('[monaco] model language set to', lang, 'for model', m.uri?.toString?.());
        }
      });
    } catch (err) {
      console.warn('No se pudo forzar el language en Monaco:', err);
    }
  }

  // Carga dinámica y obtención de referencias
  onMount(async () => {
    if (!browser) return;

    // Cargamos el wrapper primero
    const mod = await import('svelte-monaco').catch((e) => {
      console.error('No se pudo importar svelte-monaco:', e);
      return null;
    });
    MonacoEditor = mod?.default ?? null;

    // También cargamos la API de monaco para poder manipular modelos
    // Nota: la ruta puede variar según la instalación; esta suele funcionar con monaco-editor moderno.
    monaco = (await import('monaco-editor/esm/vs/editor/editor.api')).default ?? (await import('monaco-editor')).default ?? null;

    // Dejar marcado como montado y esperar un tick para que el svelte:component renderice
    mounted = true;
    await tick();

    // Forzamos language por si el editor ya creó un modelo
    forceLanguageToModels(language);
  });

  // Si cambia `language` mientras ya está montado, forzamos de nuevo
  $: if (mounted && monaco && language) {
    // pequeña espera para asegurar que el modelo exista
    // no bloqueante: forzamos inmediatamente y también en próximo tick
    forceLanguageToModels(language);
    tick().then(() => forceLanguageToModels(language));
  }
</script>

<div class={`w-full ${editorHeight} border border-border rounded-lg overflow-hidden`}>
  {#if mounted && MonacoEditor}
    <!--
      - Bind al value para two-way binding
      - No todos los wrappers exponen editor instance; si el tuyo lo hace, puedes capturarla con on:mount-like event.
    -->
    <svelte:component
      this={MonacoEditor}
      bind:value={code}
      {theme}
      {options}
      on:editorDidMount={(e) => {
        // algunos wrappers emiten detalles al montar: e.detail.editor, e.detail.monaco
        editorInstance = e.detail?.editor ?? editorInstance;
        // si el wrapper también devuelve monaco, úsalo
        if (e.detail?.monaco) {
          monaco = e.detail.monaco;
        }
        // forzamos el lenguaje también aquí para mayor seguridad
        forceLanguageToModels(language);
      }}
    />
  {:else}
    <textarea
      class="w-full h-full p-2 bg-transparent outline-none resize-none font-mono"
      bind:value={code}
      aria-label="Editor de código (fallback)"
      {readOnly}
      readonly={readOnly}
    />
  {/if}
</div>
