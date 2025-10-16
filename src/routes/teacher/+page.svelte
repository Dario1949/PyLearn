<script>
  import { goto, invalidateAll } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";
  import StatsCard from "$lib/components/teacher/StatsCard.svelte";
  import ModuleAnalytics from "$lib/components/teacher/ModuleAnalytics.svelte";
  import RecentActivity from "$lib/components/teacher/RecentActivity.svelte";
  import ModuleEditor from "$lib/components/teacher/ModuleEditor.svelte";
  import LessonProgress from "$lib/components/modules/LessonProgress.svelte";
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
  let modules = $state(data.modules || []);
  
  // Actualizar módulos cuando cambien los datos
  $effect(() => {
    if (data.modules) {
      modules = [...data.modules];
    }
  });

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
  let showAIModal = $state(false);
  let aiFormData = $state({ topic: '', numModules: 6 });
  let showExportModal = $state(false);
  let exportFormat = $state('csv');
  let selectedStudents = $state([]);
  let filterBy = $state('all');
  let showBulkMessageModal = $state(false);
  let bulkMessage = $state('');
  let showComparisonModal = $state(false);
  let showModuleDetailModal = $state(false);
  let selectedModule = $state(null);
  let editingLessons = $state(false);
  
  // Debug para ver qué está pasando
  $effect(() => {
    console.log('=== DEBUG ESTUDIANTES ===');
    console.log('data.students:', data.students);
    console.log('students:', students);
    console.log('searchTerm:', searchTerm);
    console.log('filteredStudents:', filteredStudents);
    console.log('========================');
  });

  const filteredStudents = $derived(() => {
    // Si no hay estudiantes, retornar array vacío
    if (!students || students.length === 0) {
      return [];
    }
    
    // Si no hay término de búsqueda, retornar todos los estudiantes
    if (!searchTerm || searchTerm.trim() === '') {
      return students;
    }
    
    // Filtrar por término de búsqueda
    const search = searchTerm.toLowerCase();
    return students.filter(student => 
      student?.name?.toLowerCase().includes(search) || 
      student?.email?.toLowerCase().includes(search)
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

  function openAIModal() {
    showAIModal = true;
  }

  function closeAIModal() {
    showAIModal = false;
    aiFormData = { topic: '', numModules: 6 };
  }

  async function generateStudyPlan() {
    if (!aiFormData.topic.trim()) {
      alert('Por favor ingresa un tema para generar los módulos');
      return;
    }

    isGenerating = true;
    try {
      const response = await fetch("/api/modules/generate-plan", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      alert(`¡Nueva ruta de aprendizaje generada con éxito!\n\nTema: ${aiFormData.topic}\nMódulos: ${aiFormData.numModules}`);
      closeAIModal();
      await invalidateAll();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      isGenerating = false;
    }
  }
  
  async function openModuleEditor(module = null) {
    if (module && module.id) {
      // Cargar datos completos del módulo incluyendo lecciones
      try {
        const response = await fetch(`/api/modules/${module.id}`);
        if (response.ok) {
          editingModule = await response.json();
        } else {
          editingModule = module;
        }
      } catch (error) {
        console.error('Error cargando módulo:', error);
        editingModule = module;
      }
    } else {
      editingModule = null;
    }
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

  async function moveModule(moduleId, direction) {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    
    const newModules = [...modules];
    [newModules[currentIndex], newModules[newIndex]] = [newModules[newIndex], newModules[currentIndex]];
    
    modules = newModules;
    
    // Guardar orden en base de datos
    try {
      await fetch('/api/modules/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: modules.map((m, i) => ({ id: m.id, order: i })) })
      });
    } catch (error) {
      console.error('Error guardando orden:', error);
    }
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
      totalEstudiantes: classStats().totalStudents,
      promedioProgreso: classStats().averageProgress,
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
    const body = `Resumen del curso:\n\nTotal estudiantes: ${classStats().totalStudents}\nProgreso promedio: ${classStats().averageProgress}%\nMódulos completados: ${classStats().completedModules}\nRetos resueltos: ${classStats().totalChallenges}`;
    
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

  function toggleStudentSelection(studentId) {
    if (selectedStudents.includes(studentId)) {
      selectedStudents = selectedStudents.filter(id => id !== studentId);
    } else {
      selectedStudents = [...selectedStudents, studentId];
    }
  }

  function selectAllStudents() {
    selectedStudents = students.map(s => s.id);
  }

  function clearStudentSelection() {
    selectedStudents = [];
  }

  function openExportModal() {
    showExportModal = true;
  }

  function closeExportModal() {
    showExportModal = false;
    selectedStudents = [];
  }

  async function exportStudentData() {
    const studentsToExport = selectedStudents.length > 0 
      ? students.filter(s => selectedStudents.includes(s.id))
      : students;

    if (studentsToExport.length === 0) {
      alert('No hay estudiantes seleccionados para exportar');
      return;
    }

    try {
      const response = await fetch('/api/teacher/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsToExport, format: exportFormat })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estudiantes_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`Archivo ${exportFormat.toUpperCase()} descargado correctamente`);
        closeExportModal();
      } else {
        alert('Error al exportar datos');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  function openBulkMessageModal() {
    if (selectedStudents.length === 0) {
      alert('Selecciona al menos un estudiante');
      return;
    }
    showBulkMessageModal = true;
  }

  function closeBulkMessageModal() {
    showBulkMessageModal = false;
    bulkMessage = '';
  }

  async function sendBulkMessage() {
    if (!bulkMessage.trim()) return;
    
    try {
      const promises = selectedStudents.map(studentId => 
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: studentId,
            message: bulkMessage,
            type: 'teacher_message',
            from: user.name
          })
        })
      );
      
      await Promise.all(promises);
      alert(`Mensaje enviado a ${selectedStudents.length} estudiantes`);
      closeBulkMessageModal();
      clearStudentSelection();
    } catch (error) {
      alert('Error al enviar mensajes');
    }
  }

  async function deleteModule(moduleId) {
    if (!confirm('¿Estás seguro de eliminar este módulo?')) return;
    
    try {
      const response = await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Módulo eliminado correctamente');
        await invalidateAll();
      } else {
        alert('Error al eliminar el módulo');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  }

  function openComparisonModal() {
    if (selectedStudents.length < 2) {
      alert('Selecciona al menos 2 estudiantes para comparar');
      return;
    }
    showComparisonModal = true;
  }

  function closeComparisonModal() {
    showComparisonModal = false;
  }

  async function openModuleDetail(module) {
    try {
      const response = await fetch(`/api/modules/${module.id}`);
      if (response.ok) {
        selectedModule = await response.json();
        showModuleDetailModal = true;
      }
    } catch (error) {
      alert('Error al cargar detalles del módulo');
    }
  }

  function closeModuleDetail() {
    showModuleDetailModal = false;
    selectedModule = null;
    editingLessons = false;
  }

  async function updateModuleLessons() {
    try {
      const response = await fetch(`/api/modules/${selectedModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: selectedModule.lessons })
      });
      
      if (response.ok) {
        alert('Lecciones actualizadas correctamente');
        editingLessons = false;
        await invalidateAll();
      }
    } catch (error) {
      alert('Error al actualizar lecciones');
    }
  }

  function addLesson() {
    selectedModule.lessons = [...selectedModule.lessons, {
      id: `lesson_${Date.now()}`,
      title: 'Nueva Lección',
      content: 'Contenido de la lección...'
    }];
  }

  function removeLesson(index) {
    selectedModule.lessons = selectedModule.lessons.filter((_, i) => i !== index);
  }

  const progressRanges = [
    { label: '0-25%', min: 0, max: 25, color: 'bg-red-500' },
    { label: '26-50%', min: 26, max: 50, color: 'bg-orange-500' },
    { label: '51-75%', min: 51, max: 75, color: 'bg-yellow-500' },
    { label: '76-100%', min: 76, max: 100, color: 'bg-green-500' }
  ];

  const comparisonData = $derived(() => {
    if (selectedStudents.length < 2) return null;
    
    const studentsToCompare = students.filter(s => selectedStudents.includes(s.id));
    return {
      students: studentsToCompare,
      avgProgress: Math.round(studentsToCompare.reduce((sum, s) => sum + s.progress, 0) / studentsToCompare.length),
      avgPoints: Math.round(studentsToCompare.reduce((sum, s) => sum + s.points, 0) / studentsToCompare.length),
      avgLevel: Math.round(studentsToCompare.reduce((sum, s) => sum + s.level, 0) / studentsToCompare.length),
      totalModules: studentsToCompare.reduce((sum, s) => sum + s.completedModules, 0),
      totalChallenges: studentsToCompare.reduce((sum, s) => sum + s.completedChallenges, 0)
    };
  });
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
            <Button on:click={openAIModal} disabled={isGenerating}>
              {isGenerating ? "Generando..." : "🤖 Generar con IA"}
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
            value={classStats().totalStudents}
            icon="👥"
          />
          <StatsCard
            title="Estudiantes Activos"
            value={classStats().activeStudents}
            subtitle="{classStats().totalStudents > 0
              ? Math.round(
                  (classStats().activeStudents / classStats().totalStudents) * 100,
                )
              : 0}% participación"
            icon="🟢"
          />
          <StatsCard
            title="Progreso Promedio"
            value="{classStats().averageProgress}%"
            icon="📈"
          />
          <StatsCard
            title="Módulos Completados"
            value={classStats().completedModules}
            icon="✅"
          />
          <StatsCard
            title="Retos Resueltos"
            value={classStats().totalChallenges}
            icon="🎯"
          />
          <StatsCard
            title="Puntuación Promedio"
            value="{classStats().averageScore}%"
            icon="⭐"
          />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Distribución de Progreso</h3>
            <div class="space-y-4">
              {#each progressRanges as range}
                {@const count = students.filter(s => s.progress >= range.min && s.progress <= range.max).length}
                {@const percentage = students.length > 0 ? (count / students.length) * 100 : 0}
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-foreground">{range.label}</span>
                    <span class="text-muted">{count} estudiantes</span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-2">
                    <div class="{range.color} h-2 rounded-full transition-all" style="width: {percentage}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Estudiantes que Necesitan Atención</h3>
            <div class="space-y-3">
              {#each studentsAtRisk as student (student.id)}
                <div class="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div>
                    <p class="font-medium text-foreground">{student.name}</p>
                    <p class="text-sm text-muted">Progreso: {student.progress}% • Última actividad: {student.lastActivity}</p>
                  </div>
                  <Button size="sm" variant="outline" on:click={() => openMessageModal(student)}>Contactar</Button>
                </div>
              {:else}
                <p class="text-sm text-muted text-center py-4">¡Ningún estudiante necesita atención!</p>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Top 5 Estudiantes</h3>
            <div class="space-y-3">
              {#each students.sort((a, b) => b.points - a.points).slice(0, 5) as student, index}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span class="text-foreground font-medium">{student.name}</span>
                  </div>
                  <span class="text-primary font-semibold">{student.points} pts</span>
                </div>
              {:else}
                <p class="text-muted text-sm">No hay estudiantes registrados</p>
              {/each}
            </div>
          </div>
          
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Actividad por Nivel</h3>
            <div class="space-y-3">
              {#each [1,2,3,4,5] as level}
                {@const studentsAtLevel = students.filter(s => s.level === level)}
                <div class="flex justify-between items-center">
                  <span class="text-foreground">Nivel {level}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted">{studentsAtLevel.length}</span>
                    <div class="w-16 bg-muted rounded-full h-2">
                      <div class="bg-primary h-2 rounded-full" style="width: {students.length > 0 ? (studentsAtLevel.length / students.length) * 100 : 0}%"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="bg-card rounded-xl p-6 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Estadísticas Rápidas</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Promedio de puntos:</span>
                <span class="text-foreground font-medium">{students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.points, 0) / students.length) : 0}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Estudiantes con racha:</span>
                <span class="text-foreground font-medium">{students.filter(s => s.streak > 0).length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Racha máxima:</span>
                <span class="text-foreground font-medium">{students.length > 0 ? Math.max(...students.map(s => s.streak || 0)) : 0} días</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Módulos totales completados:</span>
                <span class="text-foreground font-medium">{students.reduce((sum, s) => sum + s.completedModules, 0)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Retos totales resueltos:</span>
                <span class="text-foreground font-medium">{students.reduce((sum, s) => sum + s.completedChallenges, 0)}</span>
              </div>
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
                {#each modules?.slice(0, 3) || [] as module}
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
                {#each modules?.slice(3, 6) || [] as module}
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
              <Button variant="outline" on:click={openAIModal}>🤖 Generar con IA</Button>
              <Button variant="outline">📥 Importar Módulo</Button>
              <Button on:click={() => openModuleEditor()}>➕ Crear Módulo</Button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each modules as module, index (module.id)}
              <div class="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-foreground mb-2">{module.title}</h3>
                    <p class="text-sm text-muted line-clamp-2">{module.description}</p>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <div class="flex space-x-1">
                      <button 
                        on:click={() => moveModule(module.id, 'up')}
                        class="p-1 hover:bg-muted rounded"
                        title="Mover arriba"
                        disabled={index === 0}
                      >
                        <span class="text-sm {index === 0 ? 'opacity-30' : ''}">⬆️</span>
                      </button>
                      <button 
                        on:click={() => moveModule(module.id, 'down')}
                        class="p-1 hover:bg-muted rounded"
                        title="Mover abajo"
                        disabled={index === modules.length - 1}
                      >
                        <span class="text-sm {index === modules.length - 1 ? 'opacity-30' : ''}">⬇️</span>
                      </button>
                    </div>
                    <div class="flex space-x-1">
                      <button 
                        on:click={() => openModuleEditor(module)}
                        class="p-1 hover:bg-muted rounded"
                        title="Editar módulo"
                      >
                        <span class="text-sm">✏️</span>
                      </button>
                      <button 
                        on:click={() => deleteModule(module.id)}
                        class="p-1 hover:bg-muted rounded" 
                        title="Eliminar módulo"
                      >
                        <span class="text-sm">🗑️</span>
                      </button>
                    </div>
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
                  <Button size="sm" variant="outline" class="flex-1" on:click={() => openModuleDetail(module)}>Ver Progreso</Button>
                  <Button size="sm" class="flex-1" on:click={() => openModuleEditor(module)}>Editar</Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
      {:else if selectedView === "students"}
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-foreground">Lista de Estudiantes ({students.length})</h2>
            <div class="flex gap-3">
              <input
                bind:value={searchTerm}
                type="text"
                placeholder="Buscar por nombre o correo..."
                class="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <Button variant="outline" on:click={openComparisonModal} disabled={selectedStudents.length < 2}>📈 Mostrar Comparación</Button>
            </div>
          </div>
          
          <div class="flex gap-3 items-center">
            <Button variant="outline" on:click={selectAllStudents}>Seleccionar Todos</Button>
            <Button variant="outline" on:click={clearStudentSelection}>Limpiar Selección</Button>
            <Button variant="outline" on:click={openBulkMessageModal} disabled={selectedStudents.length === 0}>
              💬 Mensaje Masivo ({selectedStudents.length})
            </Button>
            <Button variant="outline" on:click={openExportModal}>📄 Exportar</Button>
          </div>
          

          
          {#if filteredStudents() && filteredStudents().length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each filteredStudents() as student (student.id)}
                <div class="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow {selectedStudents.includes(student.id) ? 'ring-2 ring-primary' : ''}">
                  <div class="flex items-center space-x-4 mb-4">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(student.id)}
                      on:change={() => toggleStudentSelection(student.id)}
                      class="w-4 h-4 text-primary"
                    />
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
              <p class="text-xs text-muted mt-2">Debug: students.length = {students?.length || 0}, filteredStudents().length = {filteredStudents()?.length || 0}</p>
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
                <div class="text-2xl font-bold text-primary mb-1">{classStats().averageProgress}%</div>
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

  {#if showAIModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">🤖 Generar Módulos con IA</h2>
          <button on:click={closeAIModal} class="text-muted hover:text-foreground text-xl">×</button>
        </div>
        
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
          <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
            <strong>🎆 Generación Inteligente:</strong> La IA creará módulos completos con lecciones, retos y casos de prueba.
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-300">
            💡 Especifica el tema y número de módulos para generar contenido educativo personalizado
          </p>
        </div>
        
        <form on:submit|preventDefault={generateStudyPlan} class="space-y-4">
          <div>
            <label for="topic" class="block text-sm font-medium text-foreground mb-2">Tema del Curso</label>
            <Input 
              id="topic" 
              bind:value={aiFormData.topic} 
              placeholder="Ej: Fundamentos de Python, Estructuras de Datos, etc." 
              required 
            />
          </div>
          
          <div>
            <label for="numModules" class="block text-sm font-medium text-foreground mb-2">Número de Módulos</label>
            <select bind:value={aiFormData.numModules} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value={4}>4 Módulos (Básico)</option>
              <option value={6}>6 Módulos (Intermedio)</option>
              <option value={8}>8 Módulos (Avanzado)</option>
              <option value={10}>10 Módulos (Completo)</option>
            </select>
          </div>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p class="text-sm text-green-800 dark:text-green-200">
              ✨ <strong>Información:</strong> Los nuevos módulos se agregarán al contenido existente sin reemplazar nada.
            </p>
          </div>
          
          <div class="flex gap-3 pt-2">
            <Button type="submit" disabled={isGenerating} class="flex-1">
              {isGenerating ? 'Generando con IA...' : '🤖 Generar Módulos'}
            </Button>
            <Button type="button" on:click={closeAIModal} variant="outline" class="flex-1">Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if showExportModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">📄 Exportar Estudiantes</h2>
          <button on:click={closeExportModal} class="text-muted hover:text-foreground text-xl">×</button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Formato de Exportación</label>
            <select bind:value={exportFormat} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="csv">CSV (Excel)</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              📆 <strong>Estudiantes a exportar:</strong> {selectedStudents.length > 0 ? `${selectedStudents.length} seleccionados` : `Todos (${students.length})`}
            </p>
          </div>
          
          <div class="flex gap-3 pt-2">
            <Button on:click={exportStudentData} class="flex-1">
              📄 Exportar {exportFormat.toUpperCase()}
            </Button>
            <Button on:click={closeExportModal} variant="outline" class="flex-1">Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showBulkMessageModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">💬 Mensaje Masivo</h2>
          <button on:click={closeBulkMessageModal} class="text-muted hover:text-foreground text-xl">×</button>
        </div>
        
        <div class="space-y-4">
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p class="text-sm text-green-800 dark:text-green-200">
              👥 <strong>Destinatarios:</strong> {selectedStudents.length} estudiantes seleccionados
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Mensaje</label>
            <textarea 
              bind:value={bulkMessage}
              class="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              rows="4"
              placeholder="Escribe tu mensaje para todos los estudiantes seleccionados..."
            ></textarea>
          </div>
          
          <div class="flex gap-3 pt-2">
            <Button on:click={sendBulkMessage} disabled={!bulkMessage.trim()} class="flex-1">
              📧 Enviar a {selectedStudents.length}
            </Button>
            <Button on:click={closeBulkMessageModal} variant="outline" class="flex-1">Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showComparisonModal && comparisonData()}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">📈 Comparación de Estudiantes</h2>
          <button on:click={closeComparisonModal} class="text-muted hover:text-foreground text-xl">×</button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-muted/30 rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">Estadísticas Generales</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Estudiantes comparados:</span>
                <span class="text-foreground font-medium">{comparisonData().students.length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Progreso promedio:</span>
                <span class="text-foreground font-medium">{comparisonData().avgProgress}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Puntos promedio:</span>
                <span class="text-foreground font-medium">{comparisonData().avgPoints}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Nivel promedio:</span>
                <span class="text-foreground font-medium">{comparisonData().avgLevel}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-muted/30 rounded-lg p-4">
            <h3 class="font-semibold text-foreground mb-3">Totales Combinados</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Módulos completados:</span>
                <span class="text-foreground font-medium">{comparisonData().totalModules}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Retos resueltos:</span>
                <span class="text-foreground font-medium">{comparisonData().totalChallenges}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Estudiantes activos:</span>
                <span class="text-foreground font-medium">{comparisonData().students.filter(s => s.status === 'active').length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Con racha activa:</span>
                <span class="text-foreground font-medium">{comparisonData().students.filter(s => s.streak > 0).length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-foreground">Comparación Detallada</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-muted/50">
                  <th class="text-left p-3 font-medium">Estudiante</th>
                  <th class="text-left p-3 font-medium">Progreso</th>
                  <th class="text-left p-3 font-medium">Nivel</th>
                  <th class="text-left p-3 font-medium">Puntos</th>
                  <th class="text-left p-3 font-medium">Módulos</th>
                  <th class="text-left p-3 font-medium">Retos</th>
                  <th class="text-left p-3 font-medium">Racha</th>
                  <th class="text-left p-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {#each comparisonData().students as student}
                  <tr class="border-b hover:bg-muted/30">
                    <td class="p-3 font-medium">{student.name}</td>
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        <div class="w-16 bg-muted rounded-full h-2">
                          <div class="bg-primary h-2 rounded-full" style="width: {student.progress}%"></div>
                        </div>
                        <span>{student.progress}%</span>
                      </div>
                    </td>
                    <td class="p-3">{student.level}</td>
                    <td class="p-3 font-medium text-primary">{student.points}</td>
                    <td class="p-3">{student.completedModules}</td>
                    <td class="p-3">{student.completedChallenges}</td>
                    <td class="p-3">{student.streak > 0 ? `🔥 ${student.streak}` : '-'}</td>
                    <td class="p-3">
                      <span class="px-2 py-1 rounded-full text-xs {student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        {student.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <Button on:click={closeComparisonModal}>Cerrar</Button>
        </div>
      </div>
    </div>
  {/if}

  {#if showModuleDetailModal && selectedModule}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-foreground">📚 Detalles del Módulo</h2>
          <button on:click={closeModuleDetail} class="text-muted hover:text-foreground text-xl">×</button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-3">{selectedModule.title}</h3>
            <p class="text-muted mb-4">{selectedModule.description}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Dificultad:</span>
                <span class="text-foreground font-medium capitalize">{selectedModule.difficulty}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Duración:</span>
                <span class="text-foreground font-medium">{selectedModule.duration}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Número de lecciones:</span>
                <span class="text-foreground font-medium">{selectedModule.lessons?.length || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-foreground mb-3">Reto Asociado</h4>
            {#if selectedModule.challenge}
              <div class="bg-muted/30 rounded-lg p-4">
                <h5 class="font-medium text-foreground mb-2">{selectedModule.challenge.title}</h5>
                <p class="text-sm text-muted mb-2">{selectedModule.challenge.description}</p>
                <div class="flex gap-4 text-xs">
                  <span class="text-muted">Puntos: <strong>{selectedModule.challenge.points}</strong></span>
                  <span class="text-muted">Dificultad: <strong class="capitalize">{selectedModule.challenge.difficulty}</strong></span>
                </div>
              </div>
            {:else}
              <p class="text-muted text-sm">No hay reto asociado</p>
            {/if}
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="bg-muted/20 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-foreground mb-4">Lecciones del Módulo</h4>
            <LessonProgress 
              moduleId={selectedModule.id}
              lessons={selectedModule.lessons || []}
            />
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-semibold text-foreground">Administrar Lecciones ({selectedModule.lessons?.length || 0})</h4>
              <div class="flex gap-2">
                {#if editingLessons}
                  <Button size="sm" on:click={addLesson}>➕ Agregar Lección</Button>
                  <Button size="sm" on:click={updateModuleLessons}>✓ Guardar</Button>
                  <Button size="sm" variant="outline" on:click={() => editingLessons = false}>Cancelar</Button>
                {:else}
                  <Button size="sm" variant="outline" on:click={() => editingLessons = true}>✏️ Editar Lecciones</Button>
                {/if}
              </div>
            </div>
            
            <div class="space-y-3">
              {#each selectedModule.lessons || [] as lesson, index}
                <div class="bg-muted/30 rounded-lg p-4">
                  {#if editingLessons}
                    <div class="space-y-3">
                      <div class="flex items-center gap-2">
                        <input bind:value={lesson.title} class="flex-1 p-2 border rounded" placeholder="Título de la lección" />
                        <button on:click={() => removeLesson(index)} class="text-red-600 hover:text-red-800 p-1">🗑️</button>
                      </div>
                      <textarea bind:value={lesson.content} class="w-full p-2 border rounded" rows="3" placeholder="Contenido de la lección..."></textarea>
                    </div>
                  {:else}
                    <h5 class="font-medium text-foreground mb-2">{lesson.title}</h5>
                    <p class="text-sm text-muted line-clamp-3">{lesson.content}</p>
                  {/if}
                </div>
              {:else}
                <p class="text-muted text-center py-8">No hay lecciones en este módulo</p>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <Button on:click={closeModuleDetail}>Cerrar</Button>
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
