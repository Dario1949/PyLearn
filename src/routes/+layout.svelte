<script>
  import '../app.css';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { authStore } from '$lib/stores/auth.svelte.js';

  let { children } = $props();
  let currentUser = $state(null);
  
  // Cargar tema del usuario autenticado
  $effect(() => {
    const unsubscribe = authStore.state.subscribe(async (authState) => {
      if (authState.user && authState.user.id !== currentUser) {
        currentUser = authState.user.id;
        const { loadThemeForUser } = await import('$lib/stores/theme.svelte.js');
        loadThemeForUser(authState.user.id);
      } else if (!authState.user && currentUser) {
        // Usuario cerró sesión, resetear tema
        currentUser = null;
        const { resetToDefaultTheme } = await import('$lib/stores/theme.svelte.js');
        resetToDefaultTheme();
      }
    });
    
    return () => unsubscribe();
  });
</script>

<svelte:head>
  <title>PyLearn CESMAG - Aprende Python Jugando</title>
  <meta name="description" content="Plataforma gamificada de aprendizaje de Python para estudiantes de la Universidad CESMAG" />
</svelte:head>

<div class="min-h-screen flex flex-col">
  <!-- Cambiado $page.route.id por $page.url.pathname para evitar error de undefined -->
  {#if $page.url.pathname !== '/auth/login' && $page.url.pathname !== '/auth/register'}
    <Header />
  {/if}
  
  <main class="flex-1">
    {#if children}
      {@render children()}
    {/if}
  </main>
  
  <!-- Cambiado $page.route.id por $page.url.pathname para evitar error de undefined -->

  {#if $page.url.pathname !== '/auth/login' && $page.url.pathname !== '/auth/register'}
    <Footer />
  {/if}
  <!-- Toast global -->
  <Toast />
</div>
