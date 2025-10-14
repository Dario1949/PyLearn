<script>
  let { name, program, quote, avatar } = $props();
</script>

<div class="bg-card rounded-xl p-6 shadow-sm border border-border">
  <div class="flex items-center mb-4">
    <img 
      src={avatar || "/placeholder.svg"} 
      alt={`Avatar de ${name}`}
      class="w-12 h-12 rounded-full mr-4"
    />
    <div>
      <h4 class="font-semibold text-card-foreground" style="font-family: 'Montserrat', sans-serif;">
        {name}
      </h4>
      <p class="text-sm text-muted">{program}</p>
    </div>
  </div>
  <blockquote class="text-card-foreground italic leading-relaxed">
    "{quote}"
  </blockquote>
</div>
