<script>
  let { title, stats } = $props();
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <h3 class="text-lg font-semibold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
    {title}
  </h3>
  <div class="space-y-3">
    {#each stats as stat}
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-lg">{stat.icon}</span>
          <span class="text-sm text-muted">{stat.label}</span>
        </div>
        <span class="text-sm font-semibold text-card-foreground">{stat.value}</span>
      </div>
    {/each}
  </div>
</div>
