<script>
  // El script ya es correcto y no necesita cambios.
  // Simplemente recibe la prop 'activities'.
  let { activities } = $props();
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <h2
    class="text-lg font-semibold text-card-foreground mb-4"
    style="font-family: 'Montserrat', sans-serif;"
  >
    Actividad Reciente
  </h2>

  <div class="space-y-4">
    {#each (activities || []).slice(0, 4) as activity}
      <div
        class="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div
          class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0"
        >
          {activity.icon ?? "🔔"}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-card-foreground">
            {activity.title ?? "Actividad Desconocida"}
          </p>
          <div class="flex items-center space-x-2 mt-1">
            <span class="text-xs text-secondary font-medium"
              >+{activity.points ?? 0} pts</span
            >
            <span class="text-xs text-muted"
              >hace {activity.time ?? "un momento"}</span
            >
          </div>
        </div>
        {#if activity.unread}
          <div class="text-right">
            <div class="w-2 h-2 rounded-full bg-primary"></div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-4">
        <p class="text-sm text-muted">
          No hay actividad reciente para mostrar.
        </p>
      </div>
    {/each}
  </div>

  <div class="mt-4 pt-4 border-t border-border">
    <button class="text-sm text-primary hover:text-primary/80 font-medium">
      Ver toda la actividad →
    </button>
  </div>
</div>
