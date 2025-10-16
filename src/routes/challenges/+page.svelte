<script>
	import ChallengeCard from "$lib/components/challenges/ChallengeCard.svelte";
	import ChallengeModal from "$lib/components/challenges/ChallengeModal.svelte";
	import { goto, invalidateAll } from "$app/navigation";
	import { authStore } from "$lib/stores/auth.svelte.js";
	import { browser } from '$app/environment';
  import { onMount } from "svelte";

	// Datos que trae +page.js
	export let data;
	console.log("Datos recibidos en el componente Svelte:", data);

	// authStore.state debe ser un store Svelte (writable/derived)
	const state = authStore.state;
	$: user = $state?.user ?? null;
	$: isLoadingAuth = $state?.isLoading ?? false;

	// redirección si no hay usuario
	$: if (browser && !isLoadingAuth && !user) {
		goto("/auth/login");
	}

	// UI state
	let statusFilter = "all"; // 'all' | 'completed' | 'uncompleted'
	let difficultyFilter = "all"; // 'all' | 'easy' | 'medium' | 'hard'
	let selectedChallenge = null;
	let isLoading = false;
	let error = data?.error || "";

	// retos
	let allChallenges = data?.challenges ?? [];

	// lista a mostrar (reactiva)
	$: displayChallenges = (allChallenges || [])
		.map((challenge) => {
			// Usar el campo correcto del usuario
			const userCompletedChallenges = user?.completedChallenges || user?.completed_challenges || [];
			const completed = userCompletedChallenges.includes(challenge.id) ?? false;
			console.log(`Challenge ${challenge.id}: completed = ${completed}`, userCompletedChallenges);
			return {
				...challenge,
				completed
			};
		})
		.filter((challenge) => {
			const statusMatch =
				statusFilter === "all" ||
				(statusFilter === "completed" && challenge.completed) ||
				(statusFilter === "uncompleted" && !challenge.completed);

			const difficultyMatch =
				difficultyFilter === "all" ||
				challenge.difficulty === difficultyFilter;

			return statusMatch && difficultyMatch;
		});

	// cargar retos desde la API
	async function loadChallenges() {
		try {
			const res = await fetch('/api/challenges');
			const data = await res.json();
			if (data.challenges) {
				allChallenges = data.challenges;
			}
		} catch (e) {
			console.error('Error cargando retos:', e);
		}
	}

	// generar nuevo reto
	async function generateNewChallenge() {
		isLoading = true;
		error = "";
		try {
			const response = await fetch("/api/challenges/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					topic: "aleatoria",
					difficulty: "aleatoria",
				}),
			});
			const responseData = await response.json();
			if (responseData.success) {
				// Agregar el nuevo reto a la lista existente
				allChallenges = [...allChallenges, responseData.challenge];
			} else {
				throw new Error(responseData.error || "Error generando reto");
			}
		} catch (e) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	function openChallenge(challenge) {
		selectedChallenge = challenge;
	}
	function onClose() {
		selectedChallenge = null;
	}

	async function onComplete(completedChallengeId) {
		console.log('=== INICIO onComplete ===');
		console.log('Challenge ID recibido:', completedChallengeId);
		console.log('Tipo del ID:', typeof completedChallengeId);
		console.log('Todos los challenges disponibles:', allChallenges.map(c => ({ id: c.id, title: c.title })));
		console.log('Usuario actual:', user);

		const challenge = allChallenges.find(
			(c) => c.id === completedChallengeId,
		);
		console.log('Challenge encontrado:', challenge);
		
		if (!challenge || !user) {
			console.log('Challenge o user no encontrado:', { challenge, user });
			return;
		}

		const payload = {
			userId: user.id,
			challengeId: challenge.id,
			challengeDifficulty: challenge.difficulty || 'medium',
			points: challenge.points || 5
		};
		console.log('Payload a enviar:', payload);

		try {
			const response = await fetch('/api/progress/complete-challenge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			console.log('Response status:', response.status);
			const result = await response.json();
			console.log('Respuesta completa de API:', result);
			
			if (result.success) {
				console.log('✅ Reto completado exitosamente');
				console.log('Progreso actualizado:', result.progress);
				
				// Actualizar el estado local inmediatamente
				const updatedChallenges = allChallenges.map(c => 
					c.id === challenge.id ? { ...c, completed: true } : c
				);
				allChallenges = updatedChallenges;
				
				// Actualizar el usuario inmediatamente
				await authStore.loadUserProgress(user.id);
				console.log('Progreso recargado');
				
				// Verificar el estado actualizado
				setTimeout(() => {
					const updatedUser = $state.user;
					console.log('Usuario después de actualizar:', updatedUser);
					console.log('Challenges completados:', updatedUser?.completedChallenges || updatedUser?.completed_challenges);
				}, 200);
			} else {
				console.error('❌ API retornó error:', result.error);
				alert('Error: ' + result.error);
			}
		} catch (error) {
			console.error('❌ Error de red al completar reto:', error);
			alert('Error de conexión');
		}
		console.log('=== FIN onComplete ===');
		onClose();
	}

	async function getProgress() {
		if (user) {
			await authStore.loadUserProgress(user.id);

			console.log(user);
			
		}
	}

	onMount(() => {
		getProgress();

	});
</script>

<div class="w-full px-4 py-6">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-3xl font-bold text-foreground">
			Retos de Programación
		</h1>
		<button
			on:click={() => goto("/dashboard")}
			class="text-sm text-primary hover:underline"
		>
			← Volver al Dashboard
		</button>
	</div>

	<!-- filtros: estado y dificultad -->
	<div
		class="flex flex-wrap gap-4 items-center mb-8 p-4 bg-card rounded-lg border border-border"
	>
		<div class="flex items-center space-x-2">
			<span class="text-sm font-medium">Estado:</span>
			<div class="flex space-x-1 bg-muted p-1 rounded-md">
				<button
					type="button"
					on:click={() => (statusFilter = "all")}
					class:active={statusFilter === "all"}>Todos</button
				>
				<button
					type="button"
					on:click={() => (statusFilter = "completed")}
					class:active={statusFilter === "completed"}
					>Realizados</button
				>
				<button
					type="button"
					on:click={() => (statusFilter = "uncompleted")}
					class:active={statusFilter === "uncompleted"}
					>Por Hacer</button
				>
			</div>
		</div>

		<div class="flex items-center space-x-2">
			<span class="text-sm font-medium">Dificultad:</span>
			<div class="flex space-x-1 bg-muted p-1 rounded-md">
				<button
					type="button"
					on:click={() => (difficultyFilter = "all")}
					class:active={difficultyFilter === "all"}>Todas</button
				>
				<button
					type="button"
					on:click={() => (difficultyFilter = "easy")}
					class:active={difficultyFilter === "easy"}>Fácil</button
				>
				<button
					type="button"
					on:click={() => (difficultyFilter = "medium")}
					class:active={difficultyFilter === "medium"}>Media</button
				>
				<button
					type="button"
					on:click={() => (difficultyFilter = "hard")}
					class:active={difficultyFilter === "hard"}>Difícil</button
				>
			</div>
		</div>

		<div class="flex-1"></div>

		<button
			type="button"
			on:click={generateNewChallenge}
			disabled={isLoading}
			class="bg-primary text-white p-2 rounded-lg text-sm"
		>
			{isLoading ? "Generando..." : "✨ Generar Nuevo Reto"}
		</button>
	</div>

	{#if error}
		<p class="text-red-500 mb-4">{error}</p>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each displayChallenges as challenge (challenge.id)}
			<!-- Si ChallengeCard no propaga el click, envolvemos en un div clickable -->
			<div
				on:click={() => openChallenge(challenge)}
				class="cursor-pointer"
			>
				<ChallengeCard {challenge} />
			</div>
		{:else}
			<p class="text-muted md:col-span-2 lg:col-span-3 text-center py-8">
				No se encontraron retos que coincidan con tus filtros.
			</p>
		{/each}
	</div>
</div>

{#if selectedChallenge}
	<!-- paso como prop 'challenge' (ajusta según la prop que espere tu modal) -->
	<ChallengeModal
		challenge={selectedChallenge}
		{onClose}
		{onComplete}
	/>
{/if}

<style>
	.active {
		background-color: var(--background);
		color: var(--foreground);
		box-shadow: var(--shadow-sm);
	}
	button {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: all 0.2s;
	}
	.cursor-pointer {
		cursor: pointer;
	}
</style>
