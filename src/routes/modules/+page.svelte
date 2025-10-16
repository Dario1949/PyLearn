<script>
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { authStore } from "$lib/stores/auth.svelte.js";
	import ModuleCard from "$lib/components/modules/ModuleCard.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	// 1. Auth (runes bien usadas)
	const authState = authStore.state;
	const user = $derived(() => $authState?.user ?? null);
	const isLoadingAuth = $derived(() => $authState?.isLoading ?? false);

	// 2. Estado local (fetch aquí mismo)
	let modules = $state([]); // SIEMPRE un array
	let isLoading = $state(true);
	let error = $state(null);
	let fetchedOnce = false;


	// 3. Fetch de datos en cliente
	$effect(async () => {
		if (!browser) return;
		if (fetchedOnce) return;
		fetchedOnce = true;

		isLoading = true;
		error = null;

		try {
			const res = await fetch("/api/modules", {
				method: "GET",
				headers: { Accept: "application/json" },
				cache: "no-store",
			});
			if (!res.ok)
				throw new Error(
					"No se pudieron cargar los módulos desde la API.",
				);

			const data = await res.json();
			// Soporta ambas formas: [ ... ] ó { modules: [ ... ] }
			if (Array.isArray(data)) modules = data;
			else if (Array.isArray(data?.modules)) modules = data.modules;
			else modules = [];
		} catch (err) {
			console.error("Error al cargar módulos:", err);
			error = err?.message ?? "Error desconocido";
			modules = [];
		} finally {
			isLoading = false;
		}
	});

	// 4. Estado derivado de UI
	const learningState = $derived(() => {
		// Lee directamente del store aquí para asegurar la reactividad
		const currentUser = $authState?.user ?? null;

		const allModules = modules; // 'modules' ya es reactivo ($state)

		const completed = Array.isArray(currentUser?.completedModules)
			? currentUser.completedModules
			: [];
		let inProgressFound = false;

		const displayModules = allModules.map((module) => {
			const isCompleted = completed.includes(module.id);
			let status = "locked";
			let progress = 0;

	

			if (currentUser) {
				if (isCompleted) {
					status = "completed";
					progress = 100;
				} else if (!inProgressFound) {
					status = "in-progress";
					inProgressFound = true;
				}
			} else {
				if (!inProgressFound) {
					status = "in-progress";
					inProgressFound = true;
				}
			}

			// ... el resto de tu lógica no cambia ...
			const challenge =
				module?.challenge && typeof module.challenge === "object"
					? module.challenge
					: { title: "", difficulty: "" };

			return { ...module, challenge, status, progress };
		});

		const completedCount = currentUser ? completed.length : 0;
		const totalCount = displayModules.length;
		const overallProgress =
			currentUser && totalCount > 0
				? Math.round((completedCount / totalCount) * 100)
				: 0;

		return {
			modules: displayModules,
			completedCount,
			totalCount,
			overallProgress,
		};
	});

	// 5. Completar módulo
	async function handleCompleteModule(module) {
		if (!user) {
			goto("/auth/login");
			return;
		}		

		const response = await fetch("/api/progress/complete-lesson", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId: user.id,
				moduleId: module.id,
				challengeDifficulty: module?.challenge?.difficulty ?? "",
			}),
		});

		const result = await response.json();
		
		if (result?.success) {
			// Usar el método del store para recargar el progreso
			authStore.loadUserProgress(user.id);
		}
	}



	// Cargar progreso solo una vez cuando el usuario cambie
	let lastUserId = $state(null);
	$effect(() => {
		const currentUserId = user()?.id;
		if (currentUserId && currentUserId !== lastUserId) {
			lastUserId = currentUserId;
			authStore.loadUserProgress(currentUserId);
		}
	})
</script>

<svelte:head>
	<title>Módulos de Aprendizaje - PyLearn CESMAG</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="w-full px-6 py-8">
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h1
						class="text-3xl font-bold text-foreground mb-2"
						style="font-family: 'Montserrat', sans-serif;"
					>
						Módulos de Aprendizaje
					</h1>
					<p class="text-muted">
						Domina Python paso a paso con nuestros módulos
						interactivos
					</p>
				</div>
				<Button href={user() ? "/dashboard" : "/"} variant="outline">
					← Volver a {user() ? "Dashboard" : "Inicio"}
				</Button>
			</div>

			{#if user()}
				<div class="bg-card rounded-xl p-6 border border-border">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div class="text-center">
							<div class="text-3xl font-bold text-primary mb-2">
								{learningState().completedCount}
							</div>
							<p class="text-sm text-muted">
								Módulos Completados
							</p>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-secondary mb-2">
								{learningState().overallProgress}%
							</div>
							<p class="text-sm text-muted">Progreso Total</p>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-accent mb-2">
								{user().points ?? 0}
							</div>
							<p class="text-sm text-muted">Puntos Ganados</p>
						</div>
					</div>
				</div>
			{/if}
		</div>


		{#if isLoading}
			<div class="text-center py-12">
				<div
					class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"
				></div>
				<p class="mt-4 text-muted">Cargando módulos...</p>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<p class="text-destructive">{error}</p>
			</div>
		{:else if modules.length === 0}
			<!-- <- usa 'modules', siempre es array -->
			<div class="text-center py-12">
				<p class="text-muted">
					No hay módulos disponibles en este momento.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">			
				{#each learningState().modules as module (module.id)}
					<ModuleCard
						{module}
						user={user()}
						onComplete={() => handleCompleteModule(module)}
					/>
				{/each}
			</div>
		{/if}

		{#if !user() && !isLoadingAuth() && !isLoading}
			<div
				class="mt-12 bg-primary/10 rounded-xl p-8 text-center border border-primary/20"
			>
				<h2 class="text-2xl font-bold text-foreground mb-4">
					🚀 ¿Listo para empezar a aprender?
				</h2>
				<p class="text-muted mb-6 max-w-2xl mx-auto">
					Crea una cuenta o inicia sesión para guardar tu progreso,
					ganar puntos y competir en el ranking.
				</p>
				<div class="flex justify-center gap-4">
					<Button href="/auth/register">Crear Cuenta</Button>
					<Button href="/auth/login" variant="outline"
						>Iniciar Sesión</Button
					>
				</div>
			</div>
		{/if}

		<div class="mt-12 bg-card rounded-xl p-6 border border-border">
			<h2
				class="text-xl font-semibold text-foreground mb-4"
				style="font-family: 'Montserrat', sans-serif;"
			>
				💡 Consejos para Aprender
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="flex items-start space-x-3">
					<div
						class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold mt-0.5"
					>
						1
					</div>
					<div>
						<h3 class="font-medium text-foreground">
							Practica regularmente
						</h3>
						<p class="text-sm text-muted">
							Dedica al menos 30 minutos diarios para mantener el
							ritmo.
						</p>
					</div>
				</div>
				<div class="flex items-start space-x-3">
					<div
						class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold mt-0.5"
					>
						2
					</div>
					<div>
						<h3 class="font-medium text-foreground">
							Experimenta con el código
						</h3>
						<p class="text-sm text-muted">
							No tengas miedo de modificar los ejemplos y ver qué
							sucede.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
