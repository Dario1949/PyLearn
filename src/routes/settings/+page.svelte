<script>
  import { authStore } from '$lib/stores/auth.svelte.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  
  let settings = $state({
    notifications: {
      email: true,
      push: true,
      achievements: true,
      reminders: false,
      forum: true
    },
    privacy: {
      profileVisible: true,
      showProgress: true,
      showBadges: true,
      allowMessages: true
    },
    preferences: {
      theme: 'dark',
      language: 'es',
      difficulty: 'intermediate',
      autoSave: true,
      soundEffects: true
    },
    account: {
      email: authStore.user?.email || 'estudiante@cesmag.edu.co',
      phone: '+57 300 123 4567',
      program: authStore.user?.program || 'Ingeniería de Sistemas',
      semester: '1'
    }
  });

  function saveSettings() {
    console.log('[v0] Guardando configuración:', settings);
    // Aquí se guardarían las configuraciones
  }

  function resetSettings() {
    // Resetear a valores por defecto
    console.log('[v0] Reseteando configuración');
  }
</script>

<div class="min-h-screen bg-background">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2" style="font-family: 'Montserrat', sans-serif;">
        Configuración
      </h1>
      <p class="text-muted">Personaliza tu experiencia de aprendizaje</p>
    </div>

    <div class="space-y-8">
      <!-- Información de la Cuenta -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h2 class="text-xl font-bold text-card-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
          Información de la Cuenta
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="email">Email</label>
            <Input bind:value={settings.account.email} type="email" id="email" />
          </div>
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="phone">Teléfono</label>
            <Input bind:value={settings.account.phone} type="tel" id="phone" />
          </div>
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="program">Programa</label>
            <Select bind:value={settings.account.program} id="program">
              <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
              <option value="Ingeniería Industrial">Ingeniería Industrial</option>
              <option value="Administración">Administración</option>
              <option value="Contaduría">Contaduría</option>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="semester">Semestre</label>
            <Select bind:value={settings.account.semester} id="semester">
              <option value="1">Primer Semestre</option>
              <option value="2">Segundo Semestre</option>
              <option value="3">Tercer Semestre</option>
              <option value="4">Cuarto Semestre</option>
            </Select>
          </div>
        </div>
      </div>

      <!-- Notificaciones -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h2 class="text-xl font-bold text-card-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
          Notificaciones
        </h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Notificaciones por Email</div>
              <div class="text-sm text-muted">Recibe actualizaciones importantes por correo</div>
            </div>
            <input type="checkbox" bind:checked={settings.notifications.email} class="toggle" id="emailNotifications" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Notificaciones Push</div>
              <div class="text-sm text-muted">Alertas en tiempo real en tu dispositivo</div>
            </div>
            <input type="checkbox" bind:checked={settings.notifications.push} class="toggle" id="pushNotifications" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Logros y Insignias</div>
              <div class="text-sm text-muted">Notificaciones cuando obtengas nuevos logros</div>
            </div>
            <input type="checkbox" bind:checked={settings.notifications.achievements} class="toggle" id="achievementsNotifications" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Recordatorios de Estudio</div>
              <div class="text-sm text-muted">Recordatorios diarios para mantener tu racha</div>
            </div>
            <input type="checkbox" bind:checked={settings.notifications.reminders} class="toggle" id="remindersNotifications" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Actividad del Foro</div>
              <div class="text-sm text-muted">Notificaciones de respuestas y menciones</div>
            </div>
            <input type="checkbox" bind:checked={settings.notifications.forum} class="toggle" id="forumNotifications" />
          </div>
        </div>
      </div>

      <!-- Privacidad -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h2 class="text-xl font-bold text-card-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
          Privacidad
        </h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Perfil Público</div>
              <div class="text-sm text-muted">Permite que otros estudiantes vean tu perfil</div>
            </div>
            <input type="checkbox" bind:checked={settings.privacy.profileVisible} class="toggle" id="profileVisible" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Mostrar Progreso</div>
              <div class="text-sm text-muted">Visible en el ranking y estadísticas</div>
            </div>
            <input type="checkbox" bind:checked={settings.privacy.showProgress} class="toggle" id="showProgress" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Mostrar Insignias</div>
              <div class="text-sm text-muted">Tus logros serán visibles para otros</div>
            </div>
            <input type="checkbox" bind:checked={settings.privacy.showBadges} class="toggle" id="showBadges" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-card-foreground">Permitir Mensajes</div>
              <div class="text-sm text-muted">Otros estudiantes pueden enviarte mensajes</div>
            </div>
            <input type="checkbox" bind:checked={settings.privacy.allowMessages} class="toggle" id="allowMessages" />
          </div>
        </div>
      </div>

      <!-- Preferencias -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h2 class="text-xl font-bold text-card-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
          Preferencias
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="theme">Tema</label>
            <Select bind:value={settings.preferences.theme} id="theme">
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="auto">Automático</option>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="language">Idioma</label>
            <Select bind:value={settings.preferences.language} id="language">
              <option value="es">Español</option>
              <option value="en">English</option>
            </Select>
          </div>
          <div>
            <label class="block text-sm font-medium text-card-foreground mb-2" for="difficulty">Nivel de Dificultad</label>
            <Select bind:value={settings.preferences.difficulty} id="difficulty">
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </Select>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <input type="checkbox" bind:checked={settings.preferences.autoSave} id="autoSave" />
              <label for="autoSave" class="text-sm text-card-foreground">Guardado Automático</label>
            </div>
            <div class="flex items-center space-x-2">
              <input type="checkbox" bind:checked={settings.preferences.soundEffects} id="soundEffects" />
              <label for="soundEffects" class="text-sm text-card-foreground">Efectos de Sonido</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex justify-between items-center pt-6">
        <Button variant="outline" onclick={resetSettings}>
          Restablecer Configuración
        </Button>
        <div class="space-x-4">
          <Button variant="ghost" href="/dashboard">
            Cancelar
          </Button>
          <Button onclick={saveSettings}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>