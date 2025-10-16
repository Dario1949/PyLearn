<script>
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  
  let { module = null, onSave = () => {}, onCancel = () => {} } = $props();
  
  let formData = $state({
    title: module?.title || '',
    description: module?.description || '',
    difficulty: module?.difficulty || 'beginner',
    estimatedTime: parseInt(module?.duration?.replace(/\D/g, '')) || 30,
    prerequisites: module?.prerequisites || [],
    learningObjectives: module?.learningObjectives || [],
    lessons: module?.lessons || []
  });

  // Actualizar formData cuando cambie el módulo
  $effect(() => {
    if (module) {
      formData.title = module.title || '';
      formData.description = module.description || '';
      formData.difficulty = module.difficulty || 'beginner';
      formData.estimatedTime = parseInt(module.duration?.replace(/\D/g, '')) || 30;
      formData.prerequisites = module.prerequisites || [];
      formData.learningObjectives = module.learningObjectives || [];
      formData.lessons = module.lessons || [];
    }
  });
  
  let isSaving = $state(false);
  
  function addLesson() {
    formData.lessons = [...formData.lessons, {
      id: `lesson_${Date.now()}`,
      title: 'Nueva Lección',
      content: ''
    }];
  }

  function removeLesson(index) {
    formData.lessons = formData.lessons.filter((_, i) => i !== index);
  }

  async function handleSave() {
    isSaving = true;
    try {
      const response = await fetch(`/api/modules/${module?.id || 'new'}`, {
        method: module?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const savedModule = await response.json();
        onSave(savedModule);
      } else {
        alert('Error al guardar el módulo');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-card rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-foreground">
        {module?.id ? 'Editar' : 'Crear'} Módulo
      </h2>
      <button on:click={onCancel} class="text-muted hover:text-foreground">✕</button>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">Título</label>
        <Input bind:value={formData.title} placeholder="Nombre del módulo" />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">Descripción</label>
        <textarea 
          bind:value={formData.description}
          class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
          rows="3"
          placeholder="Descripción del módulo"
        ></textarea>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Dificultad</label>
          <select 
            bind:value={formData.difficulty}
            class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Tiempo Estimado (min)</label>
          <Input 
            bind:value={formData.estimatedTime} 
            type="number" 
            min="5" 
            max="300"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">Objetivos de Aprendizaje</label>
        <textarea 
          bind:value={formData.learningObjectives}
          class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
          rows="3"
          placeholder="Objetivos separados por líneas"
        ></textarea>
      </div>
      
      <div>
        <div class="flex items-center justify-between mb-4">
          <label class="block text-sm font-medium text-foreground">Lecciones ({formData.lessons.length})</label>
          <Button size="sm" on:click={addLesson}>➕ Agregar Lección</Button>
        </div>
        
        <div class="space-y-4 max-h-60 overflow-y-auto">
          {#each formData.lessons as lesson, index}
            <div class="border border-border rounded-lg p-4 bg-muted/20">
              <div class="flex items-center gap-2 mb-3">
                <Input 
                  bind:value={lesson.title} 
                  placeholder="Título de la lección" 
                  class="flex-1"
                />
                <button 
                  on:click={() => removeLesson(index)} 
                  class="text-red-600 hover:text-red-800 p-1"
                  title="Eliminar lección"
                >
                  🗑️
                </button>
              </div>
              <textarea 
                bind:value={lesson.content}
                class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                rows="3"
                placeholder="Contenido de la lección (Markdown soportado)..."
              ></textarea>
            </div>
          {:else}
            <div class="text-center py-8 text-muted border border-dashed border-border rounded-lg">
              <p class="mb-2">📚 No hay lecciones aún</p>
              <p class="text-sm">Haz clic en "Agregar Lección" para comenzar</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <div class="flex justify-end space-x-3 mt-6">
      <Button variant="outline" on:click={onCancel}>Cancelar</Button>
      <Button on:click={handleSave} disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  </div>
</div>