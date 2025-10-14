<script>
  import { goto, invalidateAll } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";
  import StatsCard from "$lib/components/teacher/StatsCard.svelte";
  import ModuleAnalytics from "$lib/components/teacher/ModuleAnalytics.svelte";
  import RecentActivity from "$lib/components/teacher/RecentActivity.svelte";
  import ModuleEditor from "$lib/components/teacher/ModuleEditor.svelte";
  import Input from "$lib/components/ui/Input.svelte";

  // 1. Recibimos los datos cargados desde `+page.js`
  let { data } = $props();

  // 2. Manejo de sesión reactivo con Runes
  const authState = authStore.state;
  const user = $derived($authState.user);
  const isLoadingAuth = $derived($authState.isLoading);
  let isGenerating = $state(false);

  $effect(() => {
    // Si termina de cargar y el usuario no es un docente, lo redirige.
    if (!isLoadingAuth && user?.role !== "teacher") {
      goto("/auth/login");
    }
  });

  // 3. Los datos de los estudiantes ahora vienen de forma reactiva desde el cargador
  const students = $derived(data.students || []);

  // 4. Las estadísticas se calculan dinámicamente a partir de la lista real de estudiantes
  const classStats = $derived(() => {
    if (students.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageProgress: 0,
        completedModules: 0,
        averageScore: 0,
        totalChallenges: 0,
      };
    }
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === "active").length;
    const totalProgress = students.reduce((sum, s) => sum + (s.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / totalStudents);
    const completedModules = students.reduce((sum, s) => sum + (s.completedModules || 0), 0);
    const totalChallenges = students.reduce((sum, s) => sum + (s.completedChallenges || 0), 0);
    const totalScore = students.reduce((sum, s) => sum + (s.averageScore || 0), 0);
    const averageScore = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;
    
    return {
      totalStudents,
      activeStudents,
      averageProgress,
      completedModules,
      totalChallenges,
      averageScore,
    };
  });

  // 5. Lógica para la búsqueda y filtros
  let selectedView = $state("overview");
  let searchTerm = $state("");
  
  function resetSearch() {
    searchTerm = "";
  }
  let showModuleEditor = $state(false);
  let editingModule = $state(null);
  let showStudentDetail = $state(false);
  let selectedStudent = $state(null);
  let showMessageModal = $state(false);
  let messageText = $state("");
  
  // Mostrar estudiantes directamente para debug
  $effect(() => {
    console.log('Estudiantes cargados:', students);
  });

  const filteredStudents = $derived(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return students;
    }
    
    const search = searchTerm.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(search) || 
      student.email.toLowerCase().includes(search)
    );
  });

  const studentsAtRisk = $derived(
    students.filter(
      (s) => s.status === "inactive" || s.progress < 20,
    ),
  );

  // Datos para la navegación y otros componentes (pueden venir de una API en el futuro)
  const views = [
    { id: "overview", label: "Resumen General", icon: "📊" },
    { id: "students", label: "Estudiantes", icon: "👥" },
    { id: "activity", label: "Actividad", icon: "📋" },
    { id: "modules", label: "Gestión Módulos", icon: "📚" },
    { id: "reports", label: "Reportes", icon: "📈" },
  ];

  async function generateStudyPlan() {
    isGenerating = true;
    if (
      !confirm("¿Estás seguro? Esto reemplazará la ruta de aprendizaje actual.")
    ) {
      isGenerating = false;
      return;
    }
    try {
      const response = await fetch("/api/modules/generate-plan", {
        /* ... */
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      alert("¡Nueva ruta de aprendizaje generada con éxito!");
      await invalidateAll(); // Recarga los datos en toda la app
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      isGenerating = false;
    }
  }
  
  function openModuleEditor(module = null) {
    editingModule = module;
    showModuleEditor = true;
  }
  
  function closeModuleEditor() {
    showModuleEditor = false;
    editingModule = null;
  }
  
  async function handleModuleSave() {
    closeModuleEditor();
    await invalidateAll();
  }
  
  function exportProgress() {
    const csvData = students.map(s => 
      `${s.name},${s.email},${s.progress}%,${s.points},${s.completedModules},${s.completedChallenges}`
    ).join('\n');
    
    const header = 'Nombre,Email,Progreso,Puntos,Módulos,Retos\n';
    const blob = new Blob([header + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progreso_estudiantes.csv';
    a.click();
  }
  
  function generateDetailedReport() {
    const report = {
      fecha: new Date().toLocaleDateString('es-ES'),
      totalEstudiantes: classStats.totalStudents,
      promedioProgreso: classStats.averageProgress,
      estudiantes: students.map(s => ({
        nombre: s.name,
        progreso: s.progress,
        puntos: s.points,
        ultimaActividad: s.lastActivity
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_detallado.json';
    a.click();
  }
  
  function sendEmailSummary() {
    const subject = 'Resumen de Progreso - PyLearn CESMAG';
    const body = `Resumen del curso:\n\nTotal estudiantes: ${classStats.totalStudents}\nProgreso promedio: ${classStats.averageProgress}%\nMódulos completados: ${classStats.completedModules}\nRetos resueltos: ${classStats.totalChallenges}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }
  
  function viewStudentDetail(student) {
    selectedStudent = student;
    showStudentDetail = true;
  }
  
  function closeStudentDetail() {
    showStudentDetail = false;
    selectedStudent = null;
  }
  
  function openMessageModal(student) {
    selectedStudent = student;
    messageText = "";
    showMessageModal = true;
  }
  
  function closeMessageModal() {
    showMessageModal = false;
    selectedStudent = null;
    messageText = "";
  }
  
  async function sendMessage() {
    if (!messageText.trim() || !selectedStudent) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStudent.id,
          message: messageText,
          type: 'teacher_message',
          from: user.name
        })
      });
      
      if (response.ok) {
        alert('Mensaje enviado correctamente');
        closeMessageModal();
      } else {
        alert('Error al enviar el mensaje');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  }
</script>

<svelte:head>
  <title>Panel Docente - PyLearn CESMAG</title>
</svelte:head>

{#if user?.role === "teacher"}
  <div class="min-h-screen bg-background">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1
              class="text-3xl font-bold text-foreground mb-2"
              style="font-family: 'Montserrat', sans-serif;"
            >
              Panel Docente
            </h1>
            <p class="text-muted">
              Monitorea el progreso de tus estudiantes y gestiona el contenido
              del curso
            </p>
          </div>
          <div class="flex space-x-3">
            <Button variant="outline" on:click={() => goto("/dashboard")}
              >← Dashboard</Button
            >
            <Button on:click={generateStudyPlan} disabled={isGenerating}>
              {isGenerating ? "Generando..." : "✨ Generar Plan de Estudios"}
            </Button>
          </div>
        </div>

        <div class="flex space-x-1 bg-muted p-1 rounded-lg">
          {#each views as view}
            <button
              on:click={() => (selectedView = view.id)}
              class="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors {selectedView ===
              view.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'}"
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if selectedView === "overview"}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <StatsCard
            title="Total Estudiantes"
            value={classStats.totalStudents}
            icon="👥"
          />
          <StatsCard
            title="Estudiantes Activos"
            value={classStats.activeStudents}
            subtitle="{classStats.totalStudents > 0
              ? Math.round(
                  (classStats.activeStudents / classStats.totalStudents) * 100,
                )
              : 0}% participación"
            icon="🟢"
          />
          <StatsCard
            title="Progreso Promedio"
            value="{classStats.averageProgress}%"
            icon="📈"
          />
          <StatsCard
            title="Módulos Completados"
            value={classStats.completedModules}
            icon="✅"
          />
          <StatsCard
            title="Retos Resueltos"
            value={classStats.totalChallenges}
            icon="🎯"
          />
          <StatsCard
            title="Puntuación Promedio"
            value="{classStats.averageScore}%"
            icon="⭐"
          />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity students={students} />
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">
              Estudiantes que Necesitan Atención
            </h3>
            <div class="space-y-3">
              {#each studentsAtRisk as student (student.id)}
                <div
                  class="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <div>
                    <p class="font-medium text-foreground">{student.name}</p>
                    <p class="text-sm text-muted">
                      Progreso: {student.progress}% • Última actividad: {student.lastActivity}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">Contactar</Button>
                </div>
              {:else}
                <p class="text-sm text-muted text-center py-4">
                  ¡Ningún estudiante necesita atención!
                </p>
              {/each}
            </div>
          </div>
        </div>
      {:else if selectedView === "activity"}
        <div class="space-y-6">
          <div class="bg-card rounded-xl border border-border p-6">
            <h2 class="text-xl font-semibold text-foreground mb-4">Actividad Reciente de Estudiantes</h2>
            {#if students.length > 0}
              <div class="space-y-4">
                {#each students.slice(0, 10) as student (student.id)}
                  <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        {#if student.avatar}
                          <img src={student.avatar} alt={student.name} class="w-12 h-12 rounded-full object-cover" />
                        {:else}
                          <span class="text-primary font-semibold text-lg">{student.name.charAt(0).toUpperCase()}</span>
                        {/if}
                      </div>
                      <div>
                        <p class="font-medium text-foreground">{student.name}</p>
                        <p class="text-sm text-muted">{student.email}</p>
                        <p class="text-xs text-muted">Última actividad: {student.lastActivity}</p>
                      </div>
                    </div>
                    <div class="text-right space-y-1">
                      <div class="flex items-center space-x-2">
                        <div class="w-16 bg-muted rounded-full h-2">
                          <div class="bg-primary h-2 rounded-full" style="width: {student.progress}%"></div>
                        </div>
                        <span class="text-sm font-medium text-foreground">{student.progress}%</span>
                      </div>
                      <p class="text-xs text-muted">{student.points} puntos • Nivel {student.level}</p>
                      <p class="text-xs text-muted">{student.completedModules} módulos • {student.completedChallenges} retos</p>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8">
                <p class="text-muted">No hay estudiantes registrados</p>
              </div>
            {/if}
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-card rounded-xl border border-border p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Módulos Más Populares</h3>
              <div class="space-y-3">
                {#each data.modules?.slice(0, 3) || [] as module}
                  <div class="flex justify-between items-center">
                    <span class="text-foreground">{module.title}</span>
                    <span class="text-primary font-semibold">
                      {Math.floor(Math.random() * 40 + 60)}%
                    </span>
                  </div>
                {:else}
                  <p class="text-muted text-sm">No hay módulos disponibles</p>
                {/each}
              </div>
            </div>
            
            <div class="bg-card rounded-xl border border-border p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Progreso por Módulo</h3>
              <div class="space-y-3">
                {#each data.modules?.slice(3, 6) || [] as module}
                  {@const completionRate = Math.floor(Math.random() * 60 + 20)}
                  <div class="space-y-1">
                    <div class="flex justify-between items-center">
                      <span class="text-foreground text-sm">{module.title}</span>
                      <span class="text-sm font-medium {completionRate > 70 ? 'text-green-600' : completionRate > 40 ? 'text-orange-500' : 'text-red-600'}">
                        {completionRate}%
                      </span>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2">
                      <div class="h-2 rounded-full {completionRate > 70 ? 'bg-green-600' : completionRate > 40 ? 'bg-orange-500' : 'bg-red-600'}" style="width: {completionRate}%"></div>
                    </div>
                  </div>
                {:else}
                  <p class="text-muted text-sm">No hay datos de progreso</p>
                {/each}
              </div>
            </div>
          </div>
        </div>
        
      {:else if selectedView === "modules"}
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-foreground">Gestión de Módulos</h2>
            <div class="flex space-x-3">
              <Button variant="outline">📥 Importar Módulo</Button>
              <Button on:click={() => openModuleEditor()}>➕ Crear Módulo</Button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each data.modules || [] as module (module.id)}
              <div class="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-foreground mb-2">{module.title}</h3>
                    <p class="text-sm text-muted line-clamp-2">{module.description}</p>
                  </div>
                  <div class="flex space-x-1">
                    <button 
                      on:click={() => openModuleEditor(module)}
                      class="p-1 hover:bg-muted rounded"
                      title="Editar módulo"
                    >
                      <span class="text-sm">✏️</span>
                    </button>
                    <button class="p-1 hover:bg-muted rounded" title="Eliminar módulo">
                      <span class="text-sm">🗑️</span>
                    </button>
                  </div>
                </div>
                
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">Dificultad:</span>
                    <span class="font-medium text-foreground capitalize">{module.difficulty}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">Lecciones:</span>
                    <span class="font-medium text-foreground">{module.lessons?.length || 0}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">Completado por:</span>
                    <span class="font-medium text-foreground">{Math.floor(Math.random() * 50)}%</span>
                  </div>
                </div>
                
                <div class="flex space-x-2">
                  <Button size="sm" variant="outline" class="flex-1">Ver Detalles</Button>
                  <Button size="sm" class="flex-1" on:click={() => openModuleEditor(module)}>Editar</Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
      {:else if selectedView === "students"}
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-foreground">Lista de Estudiantes</h2>
            <input
              bind:value={searchTerm}
              type="text"
              placeholder="Buscar por nombre o correo..."
              class="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          

          
          {#if students.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each students as student (student.id)}
                <div class="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-center space-x-4 mb-4">
                    <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      {#if student.avatar}
                        <img src={student.avatar} alt={student.name} class="w-12 h-12 rounded-full object-cover" />
                      {:else}
                        <span class="text-primary font-semibold text-lg">{student.name.charAt(0).toUpperCase()}</span>
                      {/if}
                    </div>
                    <div class="flex-1">
                      <h3 class="font-semibold text-foreground">{student.name}</h3>
                      <p class="text-sm text-muted">{student.email}</p>
                      {#if student.program}
                        <p class="text-xs text-muted">{student.program}</p>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-muted">Progreso</span>
                        <span class="text-sm font-medium text-foreground">{student.progress}%</span>
                      </div>
                      <div class="w-full bg-muted rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full" style="width: {student.progress}%"></div>
                      </div>
                      <p class="text-xs text-muted mt-1">{student.completedModules}/6 módulos completados</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-muted">Nivel:</span>
                        <span class="font-medium text-foreground ml-1">{student.level}</span>
                      </div>
                      <div>
                        <span class="text-muted">Puntos:</span>
                        <span class="font-medium text-foreground ml-1">{student.points}</span>
                      </div>
                      <div>
                        <span class="text-muted">Retos:</span>
                        <span class="font-medium text-foreground ml-1">{student.completedChallenges}</span>
                      </div>
                      <div>
                        <span class="text-muted">Estado:</span>
                        <span class="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {student.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}">
                          {student.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    
                    <div class="text-xs text-muted">
                      Última actividad: {student.lastActivity}
                      {#if student.streak > 0}
                        <span class="text-orange-500 ml-2">🔥 {student.streak} días</span>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" class="flex-1" on:click={() => viewStudentDetail(student)}>Ver Detalle</Button>
                    <Button size="sm" variant="outline" class="flex-1" on:click={() => openMessageModal(student)}>Mensaje</Button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="bg-card rounded-xl border border-border p-12 text-center">
              <p class="text-muted">
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
              </p>
            </div>
          {/if}
        </div>
        
      {:else if selectedView === "reports"}
        <div class="space-y-6">
          <div class="bg-card rounded-xl border border-border p-6">
            <h2 class="text-xl font-semibold text-foreground mb-6">Reportes y Análisis</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div class="bg-muted/30 rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-2">Progreso General</h3>
                <div class="text-2xl font-bold text-primary mb-1">{classStats.averageProgress}%</div>
                <p class="text-sm text-muted">Promedio de la clase</p>
              </div>
              
              <div class="bg-muted/30 rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-2">Tasa de Finalización</h3>
                <div class="text-2xl font-bold text-green-600 mb-1">78%</div>
                <p class="text-sm text-muted">Módulos completados</p>
              </div>
              
              <div class="bg-muted/30 rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-2">Tiempo Promedio</h3>
                <div class="text-2xl font-bold text-orange-600 mb-1">2.5h</div>
                <p class="text-sm text-muted">Por módulo</p>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <Button variant="outline" on:click={exportProgress}>📊 Exportar Progreso</Button>
              <Button variant="outline" on:click={generateDetailedReport}>📈 Generar Reporte Detallado</Button>
              <Button variant="outline" on:click={sendEmailSummary}>📧 Enviar Resumen por Email</Button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  {#if showModuleEditor}
    <ModuleEditor 
      module={editingModule} 
      onSave={handleModuleSave} 
      onCancel={closeModuleEditor} 
    />
  {/if}
  
  {#if showStudentDetail && selectedStudent}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">Detalle del Estudiante</h2>
          <button on:click={closeStudentDetail} class="text-muted hover:text-foreground">✕</button>
        </div>
        
        <div class="space-y-6">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              {#if selectedStudent.avatar}
                <img src={selectedStudent.avatar} alt={selectedStudent.name} class="w-16 h-16 rounded-full object-cover" />
              {:else}
                <span class="text-primary font-semibold text-xl">{selectedStudent.name.charAt(0).toUpperCase()}</span>
              {/if}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-foreground">{selectedStudent.name}</h3>
              <p class="text-muted">{selectedStudent.email}</p>
              {#if selectedStudent.program}
                <p class="text-sm text-muted">{selectedStudent.program}</p>
              {/if}
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-foreground mb-2">Progreso General</h4>
                <div class="w-full bg-muted rounded-full h-3">
                  <div class="bg-primary h-3 rounded-full" style="width: {selectedStudent.progress}%"></div>
                </div>
                <p class="text-sm text-muted mt-1">{selectedStudent.progress}% completado</p>
              </div>
              
              <div>
                <h4 class="font-medium text-foreground mb-2">Estadísticas</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted">Nivel:</span>
                    <span class="text-foreground">{selectedStudent.level}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Puntos:</span>
                    <span class="text-foreground">{selectedStudent.points}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Módulos:</span>
                    <span class="text-foreground">{selectedStudent.completedModules}/6</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Retos:</span>
                    <span class="text-foreground">{selectedStudent.completedChallenges}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-foreground mb-2">Actividad</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted">Última actividad:</span>
                    <span class="text-foreground">{selectedStudent.lastActivity}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Estado:</span>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {selectedStudent.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}">
                      {selectedStudent.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {#if selectedStudent.streak > 0}
                    <div class="flex justify-between">
                      <span class="text-muted">Racha:</span>
                      <span class="text-orange-500">🔥 {selectedStudent.streak} días</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <Button variant="outline" on:click={() => openMessageModal(selectedStudent)}>Enviar Mensaje</Button>
          <Button variant="outline" on:click={closeStudentDetail}>Cerrar</Button>
        </div>
      </div>
    </div>
  {/if}
  
  {#if showMessageModal && selectedStudent}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-foreground">Enviar Mensaje</h2>
          <button on:click={closeMessageModal} class="text-muted hover:text-foreground">✕</button>
        </div>
        
        <div class="space-y-4">
          <div>
            <p class="text-sm text-muted mb-2">Para: {selectedStudent.name}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Mensaje</label>
            <textarea 
              bind:value={messageText}
              class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              rows="4"
              placeholder="Escribe tu mensaje aquí..."
            ></textarea>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <Button variant="outline" on:click={closeMessageModal}>Cancelar</Button>
          <Button on:click={sendMessage} disabled={!messageText.trim()}>Enviar</Button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted">Verificando credenciales...</p>
    </div>
  </div>
{/if}
