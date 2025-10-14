<script>
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";
  import LeaderboardCard from "$lib/components/leaderboard/LeaderboardCard.svelte";
  import StatsCard from "$lib/components/leaderboard/StatsCard.svelte";

  // Datos del loader (+page.js)
  let { data } = $props();

  // --- Auth con runes ---
  const authState = authStore.state; // store
  const user = $derived(() => $authState?.user); // derived -> user()
  const isLoadingAuth = $derived(() => $authState?.isLoading);

  $effect(() => {
    if (!isLoadingAuth() && !user()) {
      goto("/auth/login");
    }
  });

  // --- Estado UI ---
  let selectedCategory = $state("points");

  // --- Normalización robusta del leaderboard base ---
  const baseLeaderboard = $derived(() => {
    const raw = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
    return raw.map((p) => {
      const pts = Number(p.points ?? 0) || 0;
      const computedLevel = Math.max(1, Math.floor(pts / 500) + 1);
      return {
        id: p.id,
        name: p.name ?? "Sin nombre",
        program: p.program ?? "",
        points: pts,
        level: Number(p.level ?? computedLevel),
        solvedPosts: Number(p.solvedPosts ?? 0) || 0,
        completedModules: Array.isArray(p.completedModules)
          ? p.completedModules
          : [],
        earnedBadges: Array.isArray(p.earnedBadges) ? p.earnedBadges : [],
        avatar: p.avatar ?? null,
      };
    });
  });

  // --- Orden y ranking (sort estable + desempate por nombre/ID) ---
  function stableCompare(a, b, getter) {
    const av = getter(a);
    const bv = getter(b);
    if (av === bv) {
      // desempate: nombre asc, luego id asc
      const an = (a.name || "").localeCompare(b.name || "");
      if (an !== 0) return an;
      return String(a.id || "").localeCompare(String(b.id || ""));
    }
    // descendente por métrica principal
    return bv - av;
  }

  const sortedLeaderboard = $derived(() => {
    const board = [...baseLeaderboard()];
    switch (selectedCategory) {
      case "modules":
        board.sort((a, b) =>
          stableCompare(a, b, (x) => x.completedModules.length || 0)
        );
        break;
      case "solvedPosts":
        board.sort((a, b) => stableCompare(a, b, (x) => x.solvedPosts || 0));
        break;
      case "points":
      default:
        board.sort((a, b) => stableCompare(a, b, (x) => x.points || 0));
        break;
    }
    // asignar rank 1..n
    return board.map((u, i) => ({ ...u, rank: i + 1 }));
  });

  // --- Datos del usuario actual en la tabla ---
  const currentUserData = $derived(() => {
    const u = user();
    if (!u?.id) return null;
    return sortedLeaderboard().find((p) => p.id === u.id) ?? null;
  });

  // --- Stats laterales del usuario ---
  const currentUserStats = $derived(() => {
    const me = currentUserData();
    if (!me) return [];
    return [
      { label: "Publicaciones resueltas", value: me.solvedPosts || 0, icon: "📝" },
      { label: "Módulos", value: me.completedModules?.length || 0, icon: "📚" },
    ];
  });

  const categories = [
    { value: "points", label: "Puntos", icon: "⭐" },
    { value: "modules", label: "Módulos", icon: "📚" },
    { value: "solvedPosts", label: "Publicaciones Resueltas", icon: "📝" },
  ];
</script>

<svelte:head>
  <title>Tabla de Clasificación - PyLearn CESMAG</title>
</svelte:head>

{#if user() && Array.isArray(data?.leaderboard)}
  <div class="min-h-screen bg-background">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1
              class="text-3xl font-bold text-foreground mb-2"
              style="font-family: 'Montserrat', sans-serif;"
            >
              🏆 Tabla de Clasificación
            </h1>
            <p class="text-muted">
              Compite con tus compañeros y ve tu progreso
            </p>
          </div>
          <Button href="/dashboard" variant="outline"
            >← Volver al Dashboard</Button
          >
        </div>

        <div class="flex flex-wrap gap-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-foreground"
              >Clasificar por:</span
            >
            <select
              bind:value={selectedCategory}
              class="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
              aria-label="Cambiar criterio de clasificación"
            >
              {#each categories as category}
                <option value={category.value}
                  >{category.icon} {category.label}</option
                >
              {/each}
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Lateral: posición y stats del usuario -->
        <div class="lg:col-span-1 space-y-6">
          {#if currentUserData()}
            <div class="bg-card rounded-xl p-6 border border-border">
              <h2 class="text-lg font-semibold text-card-foreground mb-4">
                Tu Posición
              </h2>
              <div class="text-center">
                <div
                  class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"
                >
                  <span class="text-2xl font-bold text-primary"
                    >#{currentUserData().rank}</span
                  >
                </div>
                <h3 class="font-semibold text-card-foreground">
                  {currentUserData().name}
                </h3>
                {#if currentUserData().program}
                  <p class="text-sm text-muted mb-3">
                    {currentUserData().program}
                  </p>
                {/if}
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div class="text-lg font-bold text-primary">
                      {currentUserData().points}
                    </div>
                    <div class="text-xs text-muted">Puntos</div>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-secondary">
                      {currentUserData().level}
                    </div>
                    <div class="text-xs text-muted">Nivel</div>
                  </div>
                </div>
              </div>
            </div>

            <StatsCard title="Mis Estadísticas" stats={currentUserStats()} />
          {:else}
            <div class="bg-card rounded-xl p-6 border border-border">
              <h2 class="text-lg font-semibold text-card-foreground mb-2">
                Tu Posición
              </h2>
              <p class="text-sm text-muted">
                Aún no apareces en la clasificación.
              </p>
            </div>
          {/if}
        </div>

        <!-- Lista principal -->
        <div class="lg:col-span-3">
          <div class="bg-card rounded-xl border border-border overflow-hidden">
            <div class="p-6 border-b border-border">
              <h2 class="text-xl font-semibold text-card-foreground">
                Clasificación General
              </h2>
            </div>

            {#if sortedLeaderboard().length === 0}
              <div class="p-6 text-sm text-muted">
                No hay participantes todavía.
              </div>
            {:else}
              <div class="divide-y divide-border">
                {#each sortedLeaderboard() as player (player.id)}
                  <LeaderboardCard
                    {player}
                    isCurrentUser={user() ? player.id === user().id : false}
                    category={selectedCategory}
                  />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted">Cargando clasificación...</p>
    </div>
  </div>
{/if}
