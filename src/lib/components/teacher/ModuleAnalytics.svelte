<script>
  let { moduleAnalytics } = $props();
</script>

<div class="bg-card rounded-xl border border-border overflow-hidden">
  <div class="p-6 border-b border-border">
    <h2 class="text-xl font-semibold text-foreground">Análisis por Módulos</h2>
    <p class="text-muted mt-1">Rendimiento y estadísticas de cada módulo del curso</p>
  </div>
  
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-muted/50">
        <tr>
          <th class="text-left p-4 font-medium text-foreground">Módulo</th>
          <th class="text-left p-4 font-medium text-foreground">Completado</th>
          <th class="text-left p-4 font-medium text-foreground">Puntuación</th>
          <th class="text-left p-4 font-medium text-foreground">Dificultad</th>
          <th class="text-left p-4 font-medium text-foreground">Estudiantes</th>
          <th class="text-left p-4 font-medium text-foreground">Tiempo Promedio</th>
        </tr>
      </thead>
      <tbody>
        {#each moduleAnalytics as module}
          <tr class="border-b border-border hover:bg-muted/30">
            <td class="p-4">
              <p class="font-medium text-foreground">{module.name}</p>
            </td>
            <td class="p-4">
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-muted rounded-full h-2">
                  <div 
                    class="bg-primary h-2 rounded-full"
                    style="width: {module.completionRate}%"
                  ></div>
                </div>
                <span class="text-sm font-medium text-foreground">{module.completionRate}%</span>
              </div>
            </td>
            <td class="p-4">
              <span class="font-medium text-foreground">{module.averageScore}%</span>
            </td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                module.difficulty === 'Fácil' ? 'bg-green-100 text-green-800' :
                module.difficulty === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }">
                {module.difficulty}
              </span>
            </td>
            <td class="p-4">
              <span class="text-foreground">{module.studentsCompleted}/28</span>
            </td>
            <td class="p-4">
              <span class="text-muted">{module.averageTime}</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
