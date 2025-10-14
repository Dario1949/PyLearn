<script>
  let { title, value, subtitle, icon, trend = 'stable' } = $props();
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <div class="flex items-center justify-between mb-4">
    <div class="text-2xl">{icon}</div>
    <div class="text-right">
      {#if trend === 'up'}
        <div class="text-green-500 text-sm">↗️</div>
      {:else if trend === 'down'}
        <div class="text-red-500 text-sm">↘️</div>
      {:else}
        <div class="text-muted text-sm">→</div>
      {/if}
    </div>
  </div>
  <div>
    <h3 class="text-sm font-medium text-muted mb-1">{title}</h3>
    <p class="text-2xl font-bold text-foreground mb-1">{value}</p>
    <p class="text-xs text-muted">{subtitle}</p>
  </div>
</div>
