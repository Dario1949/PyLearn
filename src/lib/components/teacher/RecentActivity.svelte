<script>
  let { students = [] } = $props();
  
  const activities = $derived(() => {
    const acts = [];
    
    students.forEach(student => {
      // Actividad de módulos completados
      if (student.completedModules > 0) {
        acts.push({
          type: 'completion',
          student: student.name,
          action: `completó ${student.completedModules} módulo${student.completedModules > 1 ? 's' : ''}`,
          time: student.lastActivity,
          icon: '✅'
        });
      }
      
      // Actividad de retos completados
      if (student.completedChallenges > 0) {
        acts.push({
          type: 'challenge',
          student: student.name,
          action: `resolvió ${student.completedChallenges} reto${student.completedChallenges > 1 ? 's' : ''}`,
          time: student.lastActivity,
          icon: '🎯'
        });
      }
      
      // Actividad de puntos obtenidos
      if (student.points > 0) {
        acts.push({
          type: 'points',
          student: student.name,
          action: `obtuvo ${student.points} puntos`,
          time: student.lastActivity,
          icon: '⭐'
        });
      }
    });
    
    // Ordenar por fecha más reciente y limitar a 5
    return acts.slice(0, 5);
  });
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <h3 class="text-lg font-semibold text-foreground mb-4">Actividad Reciente</h3>
  <div class="space-y-3">
    {#each activities as activity}
      <div class="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
        <div class="text-lg">{activity.icon}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-foreground">
            <span class="font-medium">{activity.student}</span>
            {activity.action}
          </p>
          <p class="text-xs text-muted mt-1">{activity.time}</p>
        </div>
      </div>
    {:else}
      <div class="text-center py-4">
        <p class="text-muted text-sm">No hay actividad reciente</p>
      </div>
    {/each}
  </div>
  <div class="mt-4 pt-4 border-t border-border">
    <button class="text-sm text-primary hover:text-primary/80 font-medium">
      Ver toda la actividad →
    </button>
  </div>
</div>
