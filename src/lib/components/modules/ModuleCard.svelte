<script>
  import Button from "$lib/components/ui/Button.svelte";

  // Las props 'module' y 'user' vienen de la página principal /modules
  let { module, user } = $props();

  const difficultyColors = {
    Principiante: "bg-green-600 text-white",
    Intermedio: "bg-orange-600 text-white",
    Avanzado: "bg-red-600 text-white",
  };

  // --- Lógica derivada para manejar datos de forma segura ---
  const status = $derived(module?.status ?? "locked");
  const progress = $derived(module?.progress ?? 0);
  const difficulty = $derived(module?.difficulty ?? "Desconocida");
  const diffClass = $derived(
    difficultyColors[difficulty] ?? "bg-muted text-muted-foreground",
  );
  const lessonsCount = $derived(module?.lessons?.length ?? 0);
</script>

<a
  href={status !== "locked" ? `/modules/${module.id}` : "#"}
  class="bg-card rounded-xl border border-border overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300
    {status !== 'locked'
    ? 'hover:-translate-y-1'
    : 'opacity-60 cursor-not-allowed'}"
  aria-disabled={status === "locked"}
  title={status === "locked"
    ? "Completa el módulo anterior para desbloquear"
    : module.title}
>
  <div class="p-6 pb-4 flex-grow">
    <div class="flex items-center justify-between mb-4">
      <div class="text-4xl">{module?.icon ?? "📘"}</div>
      <span
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {diffClass}"
      >
        {difficulty}
      </span>
    </div>

    <h3
      class="text-xl font-bold text-card-foreground mb-2"
      style="font-family: 'Montserrat', sans-serif;"
    >
      {module?.title ?? "Módulo sin título"}
    </h3>

    <p class="text-muted text-sm mb-4 leading-relaxed">
      {module?.description ?? "Sin descripción."}
    </p>

    <div class="flex items-center space-x-4 text-sm text-muted">
      <div class="flex items-center space-x-1">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path></svg
        >
        <span>{module?.duration ?? "N/D"}</span>
      </div>
      <div class="flex items-center space-x-1">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          ></path></svg
        >
        <span>{lessonsCount} lecciones</span>
      </div>
    </div>
  </div>

  <div class="px-6 pb-6 pt-2">
    {#if status !== "locked"}
      <div class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span
            class="text-sm font-medium {status === 'completed'
              ? 'text-primary'
              : 'text-secondary'}"
          >
            {status === "completed" ? "Completado" : "En Progreso"}
          </span>
          <span class="text-sm font-medium text-card-foreground"
            >{progress}%</span
          >
        </div>
        <div class="w-full bg-muted/20 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-300 {status ===
            'completed'
              ? 'bg-primary'
              : 'bg-secondary'}"
            style="width: {progress}%"
          ></div>
        </div>
      </div>
    {:else}
      <div
        class="flex items-center justify-center text-center text-sm text-muted p-4 border-t"
      >
        <svg
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          ></path></svg
        >
        Bloqueado
      </div>
    {/if}
  </div>
</a>
