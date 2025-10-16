<script>
  let { moduleId, lessons: propLessons = [] } = $props();
  
  let lessons = $state(propLessons || []);
  let isLoading = $state(false);

  // Actualizar lecciones cuando cambien las props
  $effect(() => {
    if (propLessons && propLessons.length > 0) {
      lessons = propLessons.map((lesson, index) => ({
        id: lesson.id || index,
        title: lesson.title,
        content: lesson.content
      }));
    }
  });
</script>

<div class="space-y-4 mb-12">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-semibold border-b pb-2">Lecciones</h2>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-muted">
        {lessons.length} lecciones
      </span>
    </div>
  </div>

  {#if lessons.length > 0}
    <div class="space-y-4">
      {#each lessons as lesson, index}
        <div class="bg-card p-5 border border-border rounded-lg">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <h3 class="text-lg font-bold text-primary flex-1">
              {lesson.title}
            </h3>
          </div>
          {#if lesson.content}
            <p class="mt-2 text-muted leading-relaxed">
              {lesson.content}
            </p>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-4 text-muted">
      <p>No hay lecciones en este módulo</p>
    </div>
  {/if}
</div>