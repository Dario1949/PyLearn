<script>
  let { icon, title, description } = $props();
</script>

<div class="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-1">
  <div class="text-4xl mb-4">{icon}</div>
  <h3 class="text-xl font-semibold text-foreground mb-3" style="font-family: 'Montserrat', sans-serif;">
    {title}
  </h3>
  <p class="text-muted leading-relaxed">
    {description}
  </p>
</div>
