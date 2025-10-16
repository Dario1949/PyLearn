<script>
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import { authStore } from "$lib/stores/auth.svelte.js";

  // 1. Recibimos los datos desde `+page.js` para saber si es la configuración inicial
  let { data } = $props();

  // 2. Estado del formulario y UI con Svelte 5 Runes
  let formData = $state({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    program: "",
    role: "student",
  });

  let error = $state("");
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);

  // 3. Reactividad para el estado de carga, adaptado a Runes
  const authState = authStore.state;
  const isLoading = $derived($authState.isLoading);

  const programs = [
    "Ingeniería de Sistemas",
    "Ingeniería de Software",
    "Tecnología en Sistemas",
    "Ingeniería Industrial",
    "Administración de Empresas",
  ];

  // 4. Lógica de registro unificada
  async function handleRegister() {
    error = "";

    // Validaciones
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      error = "Por favor completa todos los campos";
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      error = "Las contraseñas no coinciden";
      return;
    }
    if (formData.password.length < 6) {
      error = "La contraseña debe tener al menos 6 caracteres";
      return;
    }
    // La validación del correo institucional solo aplica si no es la configuración de admin
    if (!data.needsInitialSetup && !formData.email.includes("@unicesmag.edu.co")) {
      error = "Debes usar tu correo institucional de CESMAG";
      return;
    }
    if (
      !data.needsInitialSetup &&
      formData.role === "student" &&
      !formData.program
    ) {
      error = "Por favor selecciona tu programa académico";
      return;
    }

    // Preparamos los datos para enviar al store/API
    const { confirmPassword, ...userData } = formData;

    // El endpoint `/api/register` ya tiene la lógica para asignar 'admin' si es el primer usuario
    const result = await authStore.register(userData);

    if (result.success) {
      // Redirigir al panel de admin si se acaba de crear, si no, al dashboard de estudiante
      goto(data.needsInitialSetup ? "/admin" : "/dashboard");
    } else {
      error = result.error || "Error al crear la cuenta";
    }
  }
</script>

<svelte:head>
  <title
    >{data.needsInitialSetup ? "Crear Administrador" : "Registrarse"} - PyLearn CESMAG</title
  >
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center bg-gradient-to-br from-card to-background py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="flex justify-center mb-6">
        <div
          class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center"
        >
          <span class="text-primary-foreground font-bold text-2xl">Py</span>
        </div>
      </div>
      {#if data.needsInitialSetup}
        <h2
          class="text-3xl font-bold text-foreground"
          style="font-family: 'Montserrat', sans-serif;"
        >
          Crear Cuenta de Administrador
        </h2>
        <p class="mt-2 text-muted">
          ¡Bienvenido! Estás a punto de crear la primera cuenta para administrar
          PyLearn CESMAG.
        </p>
      {:else}
        <h2
          class="text-3xl font-bold text-foreground"
          style="font-family: 'Montserrat', sans-serif;"
        >
          Crear Cuenta
        </h2>
        <p class="mt-2 text-muted">Únete a la comunidad de PyLearn CESMAG</p>
      {/if}
    </div>

    <form class="space-y-6" on:submit|preventDefault={handleRegister}>
      <div class="space-y-4">
        {#if !data.needsInitialSetup}
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Tipo de Usuario
            </label>
            <div class="grid grid-cols-1 gap-3">
              <label
                class="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors {formData.role ===
                'student'
                  ? 'bg-primary/10 border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  bind:group={formData.role}
                  value="student"
                  class="sr-only"
                />
                <div class="flex items-center">
                  <div
                    class="w-4 h-4 rounded-full border-2 border-primary mr-2 flex items-center justify-center"
                  >
                    {#if formData.role === "student"}
                      <div class="w-2 h-2 rounded-full bg-primary"></div>
                    {/if}
                  </div>
                  <span class="text-sm font-medium">Estudiante</span>
                </div>
              </label>              
            </div>
          </div>
        {/if}

        <div>
          <label
            for="name"
            class="block text-sm font-medium text-foreground mb-2"
            >Nombre Completo</label
          >
          <Input
            id="name"
            type="text"
            bind:value={formData.name}
            placeholder="Tu nombre completo"
            required
            class="w-full"
          />
        </div>
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-foreground mb-2"
            >{data.needsInitialSetup
              ? "Correo del Administrador"
              : "Correo Institucional"}</label
          >
          <Input
            id="email"
            type="email"
            bind:value={formData.email}
            placeholder={data.needsInitialSetup
              ? "admin@ejemplo.com"
              : "tu-nombre@unicesmag.edu.co"}
            required
            class="w-full"
          />
        </div>

        {#if !data.needsInitialSetup && formData.role === "student"}
          <div>
            <label
              for="program"
              class="block text-sm font-medium text-foreground mb-2"
              >Programa Académico</label
            >
            <Select
              id="program"
              bind:value={formData.program}
              options={programs}
              placeholder="Selecciona tu programa"
              required
              class="w-full"
            />
          </div>
        {/if}

        <div>
          <label
            for="password"
            class="block text-sm font-medium text-foreground mb-2"
            >Contraseña</label
          >
          <div class="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={formData.password}
              placeholder="Mínimo 6 caracteres"
              required
              class="w-full pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={() => (showPassword = !showPassword)}
            >
              <svg
                class="h-5 w-5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {#if showPassword}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  ></path>
                {:else}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                {/if}
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-foreground mb-2"
            >Confirmar Contraseña</label
          >
          <div class="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              bind:value={formData.confirmPassword}
              placeholder="Confirma tu contraseña"
              required
              class="w-full pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={() => (showConfirmPassword = !showConfirmPassword)}
            >
              <svg
                class="h-5 w-5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
              </svg>
            </button>
          </div>
        </div>
      </div>

      {#if error}
        <div
          class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md"
        >
          {error}
        </div>
      {/if}

      <div>
        <Button type="submit" class="w-full" size="lg" disabled={isLoading}>
          {#if isLoading}
            <span>Creando cuenta...</span>
          {:else}
            {data.needsInitialSetup
              ? "Crear Administrador y Continuar"
              : "Crear Cuenta"}
          {/if}
        </Button>
      </div>

      {#if !data.needsInitialSetup}
        <div class="text-center">
          <p class="text-muted">
            ¿Ya tienes una cuenta? <a
              href="/auth/login"
              class="text-primary hover:text-primary/80 font-medium"
              >Inicia sesión aquí</a
            >
          </p>
        </div>
      {/if}
    </form>
  </div>
</div>
