<script>
  let { student } = $props();
</script>

<div class="bg-card rounded-lg p-4 border border-border">
  <div class="flex items-center justify-between mb-3">
    <div>
      <h4 class="font-medium text-foreground">{student.name}</h4>
      <p class="text-sm text-muted">{student.email}</p>
    </div>
    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
      Nivel {student.level}
    </span>
  </div>
  
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span class="text-muted">Progreso</span>
      <span class="font-medium text-foreground">{student.progress}%</span>
    </div>
    <div class="w-full bg-muted rounded-full h-2">
      <div 
        class="bg-primary h-2 rounded-full transition-all duration-300"
        style="width: {student.progress}%"
      ></div>
    </div>
    
    <div class="flex justify-between text-sm pt-2">
      <span class="text-muted">Puntos: {student.points}</span>
      <span class="text-muted">Módulos: {student.completedModules}</span>
    </div>
  </div>
</div>
