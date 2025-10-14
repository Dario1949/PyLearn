<script>
  // Sincronizar gamificationStore con backend al cargar el dashboard
  $effect(() => {
    const u = user();
    if (u?.id) {
      gamificationStore.syncWithBackend(u.id);
    }
  });
  
  // Cargar insignias de la tienda al inicializar
  $effect(() => {
    const u = user();
    if (u?.id) {
      fetch('/api/store/me')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            gamificationStore.state.update((s) => {
              const unlockedSet = new Set(data.unlocked || []);
              s.badges.forEach((b) => {
                if (unlockedSet.has(b.id)) {
                  b.earned = true;
                  b.earnedDate = b.earnedDate || new Date().toISOString().split('T')[0];
                }
              });
              return s;
            });
          }
        })
        .catch(e => console.warn('Error cargando insignias:', e));
    }
  });
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import { gamificationStore } from "$lib/stores/gamification.svelte.js";
  import ProfileCard from "$lib/components/dashboard/ProfileCard.svelte";
  import ProgressOverview from "$lib/components/dashboard/ProgressOverview.svelte";
  import NotificationsPanel from "$lib/components/dashboard/NotificationsPanel.svelte";
  import LeaderboardWidget from "$lib/components/dashboard/LeaderboardWidget.svelte";
  import QuickActions from "$lib/components/dashboard/QuickActions.svelte";

  // 1) Datos del loader (+page.js)
  let { data } = $props();

  // 2) Auth (runes)
  const authState = authStore.state; // store
  const user = $derived(() => $authState?.user); // derived (invoca con user())
  const isLoadingAuth = $derived(() => $authState?.isLoading);

  // Redirección si no hay sesión
  $effect(() => {
    if (!isLoadingAuth() && !user()) {
      goto("/auth/login");
    }
  });

  // 3) Progreso real del usuario
  let progress = $state(null);
  let progressLoading = $state(false);
  let progressError = $state("");

  async function fetchProgressForUser(userId) {
    progressLoading = true;
    progressError = "";
    try {
      const res = await fetch(`/api/progress/${userId}`, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        progress = null;
        progressError = json?.error || "No se pudo cargar el progreso";
      } else {
        progress = json.progress ?? null;
      }
    } catch (e) {
      console.error(e);
      progress = null;
      progressError = "Error de red al cargar el progreso";
    } finally {
      progressLoading = false;
    }
  }

  // Cargar progreso cuando haya user().id
  $effect(() => {
    const u = user();
    if (u?.id) fetchProgressForUser(u.id);
  });

  // 4) Derivados del progreso (prioriza progress > user)
  const points = $derived(() => 
    Number(progress?.points ?? user()?.points ?? 0)
  );

  const level = $derived(() => {
    const completedCount = completedModules().length;
    return Math.max(1, completedCount);
  });

  const streak = $derived(() =>
    Number(progress?.streak ?? user()?.streak ?? 0)
  );

  const averageScore = $derived(() =>
    Number(progress?.averageScore ?? user()?.averageScore ?? 0)
  );

  const completedModules = $derived(() =>
    Array.isArray(progress?.completedModules)
      ? progress.completedModules
      : (user()?.completedModules ?? [])
  );

  const completedChallenges = $derived(() =>
    Array.isArray(progress?.completedChallenges)
      ? progress.completedChallenges
      : (user()?.completedChallenges ?? [])
  );

  const earnedBadges = $derived(() =>
    Array.isArray(progress?.earnedBadges)
      ? progress.earnedBadges
      : (user()?.earnedBadges ?? [])
  );

  const lastActivityLabel = $derived(() => {
    if (progress?.lastActivity) {
      return new Date(progress.lastActivity).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    }
    return "Sin actividad reciente";
  });

  // 5) Módulos y progreso general (para ProgressOverview y LearningPath)
  const allModules = $derived(() =>
    Array.isArray(data?.allModules) ? data.allModules : []
  );
  const totalModules = $derived(() => allModules().length);
  const completedCount = $derived(() => completedModules().length);

  // Si progress.progress existe (0-100), úsalo. Si no, calcula por módulos.
  const progressPercent = $derived(() => {
    const val = Number(progress?.progress);
    if (Number.isFinite(val))
      return Math.max(0, Math.min(100, Math.round(val)));
    if (totalModules() > 0)
      return Math.round((completedCount() / totalModules()) * 100);
    return 0;
  });

  const nextModuleId = $derived(
    () =>
      allModules().find((m) => !completedModules().includes(m?.id))?.id ?? null
  );

  // 6) Datos para componentes
  const userWithBadges = $derived(() => ({
    ...(user() || {}),
    points: points(),
    level: level(),
    streak: streak(),
    earnedBadges: earnedBadges(),
  }));

  // Notificaciones reales del servidor
  let notifications = $state([]);
  
  // Cargar notificaciones cuando haya usuario
  $effect(() => {
    const u = user();
    if (u?.id) {
      fetch(`/api/notifications?userId=${u.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            notifications = data.notifications;
          }
        })
        .catch(e => console.warn('Error cargando notificaciones:', e));
    }
  });
</script>

<svelte:head>
  <title>Dashboard - PyLearn CESMAG</title>
</svelte:head>

<div class="min-h-screen bg-background">
  {#if user()}
    <div class="w-full px-6 py-8">
      <div class="mb-8">
        <h1
          class="text-3xl font-bold text-foreground mb-2"
          style="font-family: 'Montserrat', sans-serif;"
        >
          ¡Bienvenido de vuelta, {user().name?.split(" ")[0] ?? ""}!
        </h1>
        <p class="text-muted">Continúa tu aventura de aprendizaje en Python</p>
        {#if progressError}
          <p class="mt-1 text-xs text-destructive">{progressError}</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileCard user={userWithBadges()} />
            <QuickActions />
          </div>

          <!-- ¡Ahora sí: le pasamos el progreso real! -->
          <ProgressOverview
            modules={allModules()}
            streak={streak()}
            progressPercent={progressPercent()}
            completedModules={completedModules()}
            points={points()}
            level={level()}
          />


        </div>

        <div class="lg:col-span-4 space-y-6">
          <NotificationsPanel {notifications} />
          <LeaderboardWidget
            leaderboard={data.leaderboard}
            currentUser={user()}
          />
        </div>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted">Cargando datos del usuario...</p>
    </div>
  {/if}
</div>
