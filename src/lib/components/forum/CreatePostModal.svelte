<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Select from "$lib/components/ui/Select.svelte";

  // Recibimos las funciones y datos necesarios como props
  let { categories, onClose, onSubmit } = $props();

  // Estado local para el formulario
  let formData = $state({
    title: "",
    content: "",
    category: "",
  });

  let error = $state("");
  const dispatch = createEventDispatcher();

  function handleSubmit() {
    // Validación simple en el frontend
    if (!formData.title || !formData.content || !formData.category) {
      error = "Por favor, completa todos los campos.";
      return;
    }
    error = "";

    console.log("ok");
    

    // Emitimos el evento 'submit' con los datos del formulario.
    // La página del foro escuchará este evento.
    dispatch("submit", formData);
  }
</script>

<div
  class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  role="dialog"
  aria-modal="true"
  on:keydown={(e) => e.key === "Escape" && onClose()}
>
  <div class="bg-card rounded-xl shadow-2xl max-w-2xl w-full" role="document">
    <div class="p-5 border-b border-border flex items-center justify-between">
      <h2 class="text-xl font-bold text-card-foreground">
        Crear Nueva Pregunta
      </h2>
      <button
        type="button"
        aria-label="Cerrar"
        on:click={onClose}
        class="p-2 -m-2 text-muted hover:text-foreground hover:bg-accent rounded-full"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg
        >
      </button>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
      <div>
        <label for="post-title" class="block text-sm font-medium mb-1"
          >Título</label
        >
        <Input
          id="post-title"
          bind:value={formData.title}
          placeholder="Escribe un título claro y conciso..."
          required
        />
      </div>
      <div>
        <label for="post-category" class="block text-sm font-medium mb-1"
          >Categoría</label
        >
        <Select
          id="post-category"
          bind:value={formData.category}
          options={categories.map((c) => c.name)}
          placeholder="Selecciona una categoría..."
          required
        />
      </div>
      <div>
        <label for="post-content" class="block text-sm font-medium mb-1"
          >Tu Pregunta</label
        >
        <Textarea
          id="post-content"
          bind:value={formData.content}
          placeholder="Describe tu problema o pregunta en detalle. Puedes incluir bloques de código."
          class="min-h-[200px]"
          required
        />
      </div>

      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}

      <div class="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" on:click={onClose}
          >Cancelar</Button
        >
        <Button type="submit">Publicar Pregunta</Button>
      </div>
    </form>
  </div>
</div>
