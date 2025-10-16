<script>
  // Sincronizar gamificationStore con backend al cargar el perfil
  $effect(() => {
    const u = user();
    if (u?.id) {
      gamificationStore.syncWithBackend(u.id);
    }
  });
  import { authStore } from "$lib/stores/auth.svelte.js";
  import { gamificationStore } from "$lib/stores/gamification.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import { onMount } from "svelte";

  const {data} = $props();

  // -------- Helpers --------
  function toNum(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  // -------- STORES --------
  const authState = authStore.state; // writable
  const user = $derived(() => $authState?.user); // derived -> invocar con user()

  const gamState = gamificationStore.state;
  const gam = $derived(() => $gamState);

  // -------- UI local --------
  let editMode = $state(false);
  let tempName = $state("");
  let tempBio = $state("");
  let tempAvatar = $state(""); // dataURL preview
  let avatarFile = $state(null);
  let error = $state("");

  // Avatar mostrado + fallback
  let imgError = $state(false);
  const displayedAvatar = $derived(() =>
    editMode ? tempAvatar || "" : user()?.avatar || ""
  );
  $effect(() => {
    displayedAvatar();
    imgError = false;
  });

  // -------- ENTITLEMENTS (tienda) --------
  let entitlements = $state({ points: 0, unlocked: [] });

  async function refreshEntitlements() {
    try {
      const res = await fetch("/api/store/me");
      const data = await res.json();
      if (res.ok && data?.success) {
        entitlements.points = toNum(data.points, 0);
        entitlements.unlocked = Array.isArray(data.unlocked)
          ? data.unlocked
          : [];
      }
    } catch {
      /* silencioso */
    }
  }

  const canEditAvatar = $derived(() =>
    entitlements.unlocked.includes("profile_avatar")
  );
  const canEditInfo = $derived(() =>
    entitlements.unlocked.includes("profile_info")
  );

  // -------- PROGRESO --------
  let progress = $state(null);
  let progressLoading = $state(false);
  let progressError = $state("");

  async function fetchProgressForUser(id) {
    progressLoading = true;
    progressError = "";
    try {
      const res = await fetch(`/api/progress/${id}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        progress = null;
        progressError = data?.error || "No se pudo cargar el progreso";
      } else {
        progress = data.progress ?? null;

        // Sincroniza puntos/nivel/badges/retos al gamificationStore (mínimo necesario)
        if (progress) {
          const pts = toNum(progress.points, 0);
          const computedLevel = Math.max(1, Math.floor(pts / 500) + 1);
          const lvl = toNum(progress.level ?? computedLevel, 1);

          gamificationStore.state.update((s) => {
            s.points = pts;
            s.level = lvl;
            if (Number.isFinite(progress.streak))
              s.streak = toNum(progress.streak, 0);

            // Sincronizar insignias obtenidas desde el progreso Y desde la tienda
            if (Array.isArray(s.badges)) {
              const earnedFromProgress = new Set(progress.earnedBadges || []);
              const unlockedFromStore = new Set(entitlements.unlocked || []);
              
              s.badges.forEach((b) => {
                if (earnedFromProgress.has(b.id) || unlockedFromStore.has(b.id)) {
                  b.earned = true;
                  b.earnedDate = b.earnedDate || new Date().toISOString().split("T")[0];
                } else {
                  // Mantener el estado actual si ya estaba earned
                  // No resetear a false automáticamente
                }
              });
            }

            if (
              Array.isArray(progress.completedChallenges) &&
              Array.isArray(s.challenges)
            ) {
              const done = new Set(progress.completedChallenges);
              s.challenges.forEach((c) => {
                if (done.has(c.id)) c.completed = true;
              });
            }

            return s;
          });
        }
      }
    } catch (e) {
      console.error(e);
      progress = null;
      progressError = "Error de red al cargar el progreso";
    } finally {
      progressLoading = false;
    }
  }

  // Estado para el ranking del usuario y publicaciones
  let userRanking = $state(null);
  let forumPosts = $state({ total: 0, solved: 0 });

  // Función para obtener el ranking del usuario
  async function fetchUserRanking(userId) {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        const userRank = data.leaderboard.find(u => u.id === userId);
        userRanking = userRank?.rank || null;
      }
    } catch (error) {
      console.warn('Error cargando ranking:', error);
    }
  }

  // Función para obtener las publicaciones del usuario
  async function fetchUserForumPosts(userId) {
    try {
      const res = await fetch('/api/forum/questions');
      const data = await res.json();
      if (data.posts) {
        const userPosts = data.posts.filter(p => p.authorId === userId);
        const solvedPosts = userPosts.filter(p => p.solved);
        forumPosts = {
          total: userPosts.length,
          solved: solvedPosts.length
        };
      }
    } catch (error) {
      console.warn('Error cargando publicaciones:', error);
    }
  }

  // Cargar entitlements, progreso, ranking y publicaciones cuando tengamos el usuario
  $effect(() => {
    const u = user();
    if (u?.id) {
      refreshEntitlements();
      fetchProgressForUser(u.id);
      fetchUserRanking(u.id);
      fetchUserForumPosts(u.id);
    }
  });
  
  // Sincronizar insignias cuando cambien los entitlements
  $effect(() => {
    if (entitlements.unlocked.length > 0) {
      gamificationStore.state.update((s) => {
        const unlockedFromStore = new Set(entitlements.unlocked);
        s.badges.forEach((b) => {
          if (unlockedFromStore.has(b.id)) {
            b.earned = true;
            b.earnedDate = b.earnedDate || new Date().toISOString().split("T")[0];
          }
        });
        return s;
      });
    }
  });

  // -------- DERIVADOS DEL PERFIL (prioriza progress) --------
  // Usar los puntos del authStore
  const points = $derived(() => 
    Number(progress?.points ?? user()?.points ?? 0)
  );

  const level = $derived(() => {
    const completedCount = completedModules().length;
    return Math.max(1, completedCount);
  });

  const streak = $derived(() =>
    toNum(progress?.streak ?? user()?.streak ?? 0, 0)
  );
  const averageScore = $derived(() =>
    toNum(progress?.averageScore ?? user()?.averageScore ?? 0, 0)
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
    const d = progress?.lastActivity;
    if (d) {
      try {
        return new Date(d).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        });
      } catch {}
    }
    return "Sin actividad reciente";
  });

  const joinDateLabel = $derived(() => {
    const jd = user()?.createdAt;
    if (jd) {
      try {
        return new Date(jd).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      } catch {}
    }
    return "Sin fecha";
  });

  const userStats = $derived(() => ({
    totalModulesCompleted: completedModules().length,
    totalChallengesCompleted: completedChallenges().length,
    totalTimeSpent: user()?.totalTimeSpent ?? "0h 0m",
    averageScore: averageScore(),
    streak: streak(),
    joinDate: joinDateLabel(),
    favoriteTopics: user()?.favoriteTopics ?? [],
    recentAchievements: user()?.recentAchievements ?? [],
    skillProgress: user()?.skillProgress ?? [],
  }));

  // -------- Edición del perfil --------
  function toggleEditMode() {
    if (!editMode && user()) {
      tempName = user().name || "";
      tempBio = user().bio || "";
      tempAvatar = user().avatar || "";
      avatarFile = null;
      error = "";
    }
    editMode = !editMode;
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      avatarFile = file;
      imgError = false;
      const reader = new FileReader();
      reader.onload = (e) => {
        tempAvatar = e.target.result; // dataURL preview
      };
      reader.readAsDataURL(file);
    }
  }

  async function saveProfile() {
    if (!user()) return;
    error = "";

    try {
      let avatarUrl = user().avatar; // Mantener avatar actual por defecto

      // Si hay un nuevo archivo de avatar, subirlo primero
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadRes = await fetch('/api/profile/upload-avatar', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        
        if (uploadRes.ok && uploadData.success) {
          avatarUrl = uploadData.avatarUrl;
        } else {
          error = uploadData.error || 'Error al subir el avatar';
          return;
        }
      }

      // Actualizar información del perfil
      const updatedData = {
        email: user().email,
        name: tempName,
        bio: tempBio,
        avatar: avatarUrl
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        // Actualiza auth global
        authStore.loadUserProgress(user().id);
        authStore.state.update((current) => ({
          ...current,
          user: data.user,
        }));
        editMode = false;
        avatarFile = null;
        refreshEntitlements();
      } else {
        if (res.status === 403 && data?.required) {
          error = `${data.error} (Requiere: ${data.required}, ${data.cost} pts)`;
        } else {
          error = data?.error || "No se pudo guardar el perfil";
        }
      }
    } catch (e) {
      console.error(e);
      error = "Error de red al intentar guardar el perfil.";
    }
  }

  async function getProgress() {
		if (user) {
			await authStore.loadUserProgress(user.id);

			console.log(user());
			
		}
	}

	onMount(() => {
		getProgress();

	});

</script>

<div class="min-h-screen bg-background">
  <div class="w-full px-6 py-8">
    <!-- Header -->
    <div
      class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 mb-8"
    >
      <div
        class="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6"
      >
        <!-- Avatar con fallback -->
        <div class="relative">
          {#if displayedAvatar() && !imgError}
            <img
              src={displayedAvatar()}
              alt="Avatar"
              class="w-28 h-28 rounded-full border-4 border-primary object-cover"
              onerror={() => (imgError = true)}
            />
          {:else}
            <div
              class="w-28 h-28 rounded-full border-4 border-primary bg-muted flex items-center justify-center"
            >
              <svg
                class="w-14 h-14 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 5.25a3 3 0 100 6 3 3 0 000-6zm-6.75 9.27a7.5 7.5 0 0113.5 0A8.977 8.977 0 0112 21.75a8.977 8.977 0 01-6.75-5.98z"
                />
              </svg>
              <span class="sr-only">Avatar por defecto</span>
            </div>
          {/if}

          {#if editMode}
            {#if canEditAvatar()}
              <label
                class="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="Editar avatar"
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  class="hidden"
                  onchange={handleAvatarChange}
                />
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </label>
            {:else}
              <div
                class="absolute -bottom-2 right-0 text-xs bg-muted px-2 py-1 rounded"
              >
                Desbloquea “Avatar” en la tienda
              </div>
            {/if}
          {:else}
            <button
              class="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              aria-label="Editar avatar"
              disabled={!canEditAvatar()}
              onclick={() => {
                if (canEditInfo()) toggleEditMode();
              }}
              title={canEditAvatar()
                ? "Editar avatar"
                : "Bloqueado: compra en la tienda"}
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          {/if}
        </div>

        <!-- Información -->
        <div class="flex-1 text-center md:text-left">
          {#if editMode}
            <Input
              bind:value={tempName}
              placeholder="Tu nombre"
              class="text-2xl font-bold mb-2"
              disabled={!canEditInfo()}
            />
            <textarea
              bind:value={tempBio}
              placeholder="Cuéntanos sobre ti..."
              class="w-full p-2 border border-border rounded-md bg-background text-foreground resize-none"
              rows="3"
              disabled={!canEditInfo()}
            />
          {:else}
            <h1
              class="text-3xl font-bold text-foreground mb-2"
              style="font-family: 'Montserrat', sans-serif;"
            >
              {user()?.name || "Usuario"}
            </h1>
            <p class="text-muted mb-4">
              {user()?.bio ||
                "Estudiante apasionado por la programación Python. Me encanta resolver problemas y aprender nuevas tecnologías."}
            </p>
            <div class="text-muted mb-2">
              <span class="font-semibold">Correo:</span>
              {user()?.email}
            </div>
            <div class="text-muted mb-2">
              <span class="font-semibold">Rol:</span>
              {user()?.role === "teacher" ? "Docente" : "Estudiante"}
            </div>
            {#if user()?.program}
              <div class="text-muted mb-2">
                <span class="font-semibold">Programa:</span>
                {user().program}
              </div>
            {/if}
          {/if}

          <div
            class="flex flex-wrap justify-center md:justify-start gap-4 text-sm mt-2"
          >
            <div class="flex items-center space-x-1">
              <span class="text-primary font-semibold">Nivel {level()}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-secondary font-semibold">{points()} puntos</span
              >
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-muted"
                >Miembro desde {userStats().joinDate}</span
              >
            </div>
          </div>

          <div class="mt-1 text-xs text-muted">
            Última actividad: {lastActivityLabel()}
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex space-x-2">
          {#if editMode}
            <Button
              onclick={saveProfile}
              size="sm"
              aria-label="Guardar perfil"
              disabled={!canEditInfo()}
            >
              Guardar
            </Button>
            <Button
              variant="outline"
              onclick={toggleEditMode}
              size="sm"
              aria-label="Cancelar">Cancelar</Button
            >
          {:else}
            <Button
              variant="outline"
              onclick={() => {
                if (canEditInfo()) toggleEditMode();
              }}
              size="sm"
              aria-label="Editar"
              disabled={!canEditInfo()}
              title={canEditInfo()
                ? "Editar perfil"
                : "Bloqueado: compra en la tienda"}
            >
              {canEditInfo() ? "Editar Perfil" : "Editar (bloqueado)"}
            </Button>
          {/if}
        </div>
      </div>

      {#if error}
        <div
          class="mt-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-center"
          role="alert"
        >
          {error}
        </div>
      {/if}
      {#if progressError}
        <div class="mt-2 text-xs text-destructive">{progressError}</div>
      {/if}
    </div>



    <!-- Contenido principal -->
    <div class="space-y-6 mt-8">
      <!-- Resumen -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-primary">
            {userStats().totalModulesCompleted}
          </div>
          <div class="text-sm text-muted">Módulos Completados</div>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-secondary">
            {userStats().totalChallengesCompleted}
          </div>
          <div class="text-sm text-muted">Retos Resueltos</div>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-accent">
            #{userRanking || 'N/A'}
          </div>
          <div class="text-sm text-muted">Posición en Ranking</div>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-primary">
            {forumPosts.total}
          </div>
          <div class="text-sm text-muted">Total de Publicaciones</div>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-primary">
            {points()}
          </div>
          <div class="text-sm text-muted">Puntos Totales</div>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-secondary">
            {level()}
          </div>
          <div class="text-sm text-muted">Nivel Actual</div>
        </div>
      </div>

      <!-- Módulos y Retos -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div class="bg-card rounded-xl p-6 border border-border">
          <h2 class="text-xl font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
            Módulos Completados ({completedModules().length})
          </h2>
          {#if progressLoading}
            <div class="text-sm text-muted">Cargando módulos...</div>
          {:else if completedModules().length === 0}
            <div class="text-sm text-muted">Aún no has completado módulos.</div>
          {:else}
            <ul class="list-disc pl-6 space-y-1 text-sm max-h-40 overflow-y-auto">
              {#each completedModules() as mod}
                {@const module = data.modules.find(m => m.id === mod)}
                {#if module}
                  <li class="text-card-foreground">
                    <a href={`/modules/${module.id}`} class="hover:underline">
                      {module.icon}
                      {module.title}
                    </a>
                  </li>
                {/if}
              {/each}
            </ul>
          {/if}
        </div>

        <div class="bg-card rounded-xl p-6 border border-border">
          <h2 class="text-xl font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
            Retos Completados ({completedChallenges().length})
          </h2>
          {#if progressLoading}
            <div class="text-sm text-muted">Cargando retos...</div>
          {:else if completedChallenges().length === 0}
            <div class="text-sm text-muted">Aún no has completado retos.</div>
          {:else}
            <ul class="list-disc pl-6 space-y-1 text-sm max-h-40 overflow-y-auto">
              {#each completedChallenges() as ch}
                {@const challenge = data.challenges.find(c => c.id === ch)}
                {#if challenge}
                  <li class="text-card-foreground">                    
                      {challenge.title}                    
                  </li>
                {/if}
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <!-- Insignias Obtenidas -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h3 class="text-lg font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
          Insignias Obtenidas
        </h3>
        <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
          {#each (gam()?.badges ?? []).filter(badge => badge.earned || entitlements.unlocked.includes(badge.id)) as badge}
            <div class="text-center">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-primary/10 mx-auto mb-1">
                <span class="opacity-100">{badge.icon}</span>
              </div>
              <div class="text-xs text-muted">{badge.name}</div>
            </div>
          {:else}
            <div class="col-span-full text-center text-muted py-4">
              Aún no has obtenido ninguna insignia
            </div>
          {/each}
        </div>
      </div>

      <!-- Insignias Disponibles -->
      <div class="bg-card rounded-xl p-6 border border-border">
        <h3 class="text-lg font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
          Insignias Disponibles
        </h3>
        <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
          {#each (gam()?.badges ?? []).filter(badge => !badge.earned && !entitlements.unlocked.includes(badge.id)) as badge}
            <div class="text-center">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-muted/20 mx-auto mb-1">
                <span class="opacity-30">{badge.icon}</span>
              </div>
              <div class="text-xs text-muted">{badge.name}</div>
            </div>
          {:else}
            <div class="col-span-full text-center text-muted py-4">
              ¡Has obtenido todas las insignias disponibles!
            </div>
          {/each}
        </div>
      </div>


      
      <!-- Progreso de Habilidades -->
      {#if userStats().skillProgress?.length > 0}
        <div class="bg-card rounded-xl p-6 border border-border">
          <h2 class="text-xl font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
            Progreso de Habilidades
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {#each userStats().skillProgress as skill}
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-card-foreground">{skill.skill}</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{skill.level}</span>
                    <span class="text-sm text-muted">{skill.progress}%</span>
                  </div>
                </div>
                <div class="w-full bg-muted/20 rounded-full h-2">
                  <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: {skill.progress}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
