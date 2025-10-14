<script>
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { authStore } from '$lib/stores/auth.svelte.js';
  // Eliminamos 'get' porque no se usa y la reactividad con '$' es mejor.
  // import { get } from 'svelte/store';

  let email = '';
  let password = '';
  let error = '';
  let showPassword = false;

  // --- MEJORA: Reactividad automática y consistente ---
  // Igual que en las otras páginas, usamos '$' para una suscripción limpia.
  const authState = authStore.state;
  $: isLoading = $authState.isLoading;

  async function handleLogin() {
    // on:submit|preventDefault en el <form> ya hace el event.preventDefault()
    error = '';
    
    if (!email || !password) {
      error = 'Por favor completa todos los campos';
      return;
    }

    const result = await authStore.login(email, password);
    
    if (result.success) {
      goto('/dashboard');
    } else {
      error = result.error || 'Error al iniciar sesión';
    }
  }
</script>

<svelte:head>
  <title>Iniciar Sesión - PyLearn CESMAG</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-card to-background py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Logo and Header -->
    <div class="text-center">
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
          <span class="text-primary-foreground font-bold text-2xl">Py</span>
        </div>
      </div>
      <h2 class="text-3xl font-bold text-foreground" style="font-family: 'Montserrat', sans-serif;">
        Iniciar Sesión
      </h2>
      <p class="mt-2 text-muted">
        Accede a tu cuenta de PyLearn CESMAG
      </p>
    </div>

    <!-- Demo Credentials -->
    <div class="bg-card border border-border rounded-lg p-4">
      <h3 class="font-semibold text-card-foreground mb-2">Credenciales de Demo:</h3>
      <div class="text-sm text-muted space-y-1">
        <p><strong>Estudiante:</strong> student@cesmag.edu.co / password</p>
        <p><strong>Docente:</strong> teacher@cesmag.edu.co / password</p>
      </div>
    </div>

    <!-- Login Form -->
    <form class="space-y-6" on:submit|preventDefault={handleLogin}>
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-foreground mb-2">
            Correo Electrónico
          </label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            placeholder="tu-email@cesmag.edu.co"
            required
            class="w-full"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-foreground mb-2">
            Contraseña
          </label>
          <div class="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              placeholder="Tu contraseña"
              required
              class="w-full pr-10"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={() => showPassword = !showPassword}
              tabindex="-1"
            >
              <svg class="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if showPassword}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                {/if}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {#if error}
        <div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      {/if}

      <div>
        <Button 
          type="submit" 
          class="w-full" 
          size="lg"
          disabled={isLoading}
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Iniciando sesión...
          {:else}
            Iniciar Sesión
          {/if}
        </Button>
      </div>

      <div class="text-center">
        <p class="text-muted">
          ¿No tienes una cuenta?
          <a href="/auth/register" class="text-primary hover:text-primary/80 font-medium">
            Regístrate aquí
          </a>
        </p>
      </div>
    </form>
  </div>
</div>