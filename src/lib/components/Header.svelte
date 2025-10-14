<script>
  import { gamificationStore } from "$lib/stores/gamification.svelte.js";
  const gamState = gamificationStore.state;
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { authStore } from "$lib/stores/auth.svelte.js";
  
  // Función para calcular nivel basado en módulos completados
  function calculateLevel(user) {
    const completedModules = user?.completedModules?.length || 0;
    return Math.max(1, completedModules);
  }

  // 1. Obtenemos una referencia al store 'writable' interno.
  const authState = authStore.state;

  // 2. Creamos constantes reactivas usando '$derived' de Svelte 5.
  const isAuthenticated = $derived($authState.isAuthenticated);
  const user = $derived($authState.user);

  // Estado local para los menús desplegables
  let mobileMenuOpen = $state(false);
  let userMenuOpen = $state(false);

  function handleLogout() {
    userMenuOpen = false;
    mobileMenuOpen = false;
    authStore.logout();
    goto("/");
  }
</script>

<header
  class="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center space-x-2">
        <div
          class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
        >
          <span class="text-primary-foreground font-bold text-xl">Py</span>
        </div>
        <a href="/" class="flex flex-col">
          <span
            class="font-bold text-lg text-foreground"
            style="font-family: 'Montserrat', sans-serif;">PyLearn</span
          >
          <span class="text-xs text-muted uppercase tracking-wide">CESMAG</span>
        </a>
      </div>

      <nav class="hidden md:flex items-center space-x-8">
        <a href="/" class="text-foreground hover:text-primary transition-colors"
          >Inicio</a
        >
        {#if isAuthenticated}
          <a
            href="/dashboard"
            class="text-foreground hover:text-primary transition-colors"
            >Dashboard</a
          >
        {/if}
        <a
          href="/modules"
          class="text-foreground hover:text-primary transition-colors"
          >Módulos</a
        >
        {#if isAuthenticated}
          <a
            href="/challenges"
            class="text-foreground hover:text-primary transition-colors"
            >Retos</a
          >
          <a
            href="/tienda"
            class="text-foreground hover:text-primary transition-colors"
            >Tienda</a
          >
        {/if}
        <a
          href="/leaderboard"
          class="text-foreground hover:text-primary transition-colors"
          >Ranking</a
        >
        <a
          href="/forum"
          class="text-foreground hover:text-primary transition-colors"
          >Comunidad</a
        >
      </nav>

      <div class="hidden md:flex items-center space-x-4">
        {#if isAuthenticated && user}
          <div class="relative">
            <button
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
              on:click={() => (userMenuOpen = !userMenuOpen)}
              on:blur={() => setTimeout(() => (userMenuOpen = false), 200)}
            >
              <img
                src={user.avatar || "/placeholder.svg?height=32&width=32"}
                alt="Avatar"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div class="text-left">
                <div class="text-sm font-medium text-foreground">
                  {user.name}
                </div>
                {#if user.role === "student"}
                  <div class="text-xs text-muted">
                    Nivel {calculateLevel(user)} • {user.points || 0} pts
                  </div>
                {:else if user.role === "teacher"}
                  <div class="text-xs text-secondary">Docente</div>
                {:else if user.role === "admin"}
                  <div class="text-xs text-primary">Admin</div>
                {/if}
              </div>
              <svg
                class="w-4 h-4 text-muted transition-transform {userMenuOpen
                  ? 'rotate-180'
                  : ''}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            {#if userMenuOpen}
              <div
                class="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg py-1 z-50"
              >
                <div class="px-4 py-2 border-b border-border">
                  <p class="text-sm font-semibold">{user.name}</p>
                  <p class="text-xs text-muted">{user.email}</p>
                </div>
                <a
                  href="/profile"
                  class="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >Mi Perfil</a
                >
                <a
                  href="/personalizacion"
                  class="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >Personalización</a
                >
                <a
                  href="/settings"
                  class="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >Configuración</a
                >

                {#if user.role === "teacher"}
                  <a
                    href="/teacher"
                    class="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    >Panel Docente</a
                  >
                {/if}
                {#if user.role === "admin"}
                  <a
                    href="/admin"
                    class="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    >Panel de Administrador</a
                  >
                {/if}

                <hr class="my-1 border-border" />
                <button
                  on:click={handleLogout}
                  class="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  Cerrar Sesión
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <Button variant="ghost" href="/auth/login">Iniciar Sesión</Button>
          <Button href="/auth/register">Registrarse</Button>
        {/if}
      </div>

      <button
        class="md:hidden p-2 rounded-md text-foreground hover:bg-accent"
        on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
    </div>

    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t border-border">
        <div class="flex flex-col space-y-4">
          <a
            href="/"
            class="text-foreground hover:text-primary transition-colors"
            >Inicio</a
          >
          {#if isAuthenticated}
            <a
              href="/dashboard"
              class="text-foreground hover:text-primary transition-colors"
              >Dashboard</a
            >
          {/if}
          <a
            href="/modules"
            class="text-foreground hover:text-primary transition-colors"
            >Módulos</a
          >
          {#if isAuthenticated}
            <a
              href="/challenges"
              class="text-foreground hover:text-primary transition-colors"
              >Retos</a
            >
            <a
              href="/tienda"
              class="text-foreground hover:text-primary transition-colors"
              >Tienda</a
            >
          {/if}
          <a
            href="/leaderboard"
            class="text-foreground hover:text-primary transition-colors"
            >Ranking</a
          >
          <a
            href="/forum"
            class="text-foreground hover:text-primary transition-colors"
            >Comunidad</a
          >

          <div class="flex flex-col space-y-2 pt-4 border-t border-border">
            {#if isAuthenticated && user}
              <div class="flex items-center space-x-2 p-2">
                <img
                  src={user.avatar || "/placeholder.svg?height=32&width=32"}
                  alt="Avatar"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div class="text-sm font-medium text-foreground">
                    {user.name}
                  </div>
                  {#if user.role === "student"}
                    <div class="text-xs text-muted">
                      Nivel {calculateLevel(user)} • {user.points || 0} pts
                    </div>
                  {/if}
                </div>
              </div>
              <a
                href="/profile"
                class="text-foreground hover:text-primary transition-colors"
                >Mi Perfil</a
              >
              <a
                href="/personalizacion"
                class="text-foreground hover:text-primary transition-colors"
                >Personalización</a
              >
              <a
                href="/settings"
                class="text-foreground hover:text-primary transition-colors"
                >Configuración</a
              >
              {#if user.role === "teacher"}
                <a
                  href="/teacher"
                  class="text-foreground hover:text-primary transition-colors"
                  >Panel Docente</a
                >
              {/if}
              {#if user.role === "admin"}
                <a
                  href="/admin"
                  class="text-foreground hover:text-primary transition-colors"
                  >Panel de Administrador</a
                >
              {/if}
              <Button
                variant="ghost"
                on:click={handleLogout}
                class="justify-start">Cerrar Sesión</Button
              >
            {:else}
              <Button variant="ghost" href="/auth/login" class="justify-start"
                >Iniciar Sesión</Button
              >
              <Button href="/auth/register" class="justify-start"
                >Registrarse</Button
              >
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</header>
