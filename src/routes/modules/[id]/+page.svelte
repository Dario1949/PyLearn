<script>
	import { goto } from "$app/navigation";
	import Button from "$lib/components/ui/Button.svelte";
	import ChallengeModal from "$lib/components/challenges/ChallengeModal.svelte";
	import { authStore } from "$lib/stores/auth.svelte.js";
    import MarkdownRenderer from "$lib/components/modules/MarkdownRenderer.svelte";

	// Recibimos los datos que el cargador `+page.js` preparó
	let { data } = $props();
	const { module, error } = data;

	const authState = authStore.state;
	const user = $derived($authState.user);
	let selectedChallenge = $state(null);

	function openChallengeModal(challenge) {
		if (!user) {
			goto("/auth/login");
			return;
		}
		selectedChallenge = challenge;
	}

	function onClose() {
		selectedChallenge = null;
	}

	async function onComplete() {
		if (!user || !module || !module.challenge) return;

		try {
			const response = await fetch("/api/progress/complete-challenge", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					challengeId: module.challenge.id,
					points: module.challenge.points
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Error al completar el reto");
			}

			if (result.success) {
				await authStore.loadUserProgress(user.id);
				onClose();
				alert(`¡Felicidades! Has completado el módulo y ganado ${module.challenge.points} puntos.`);
				goto("/modules");
			}
		} catch (err) {
			alert(`Error: ${err.message}`);
		}
	}
</script>

<svelte:head>
	<title>{module?.title ?? "Módulo"} - PyLearn CESMAG</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
	<div class="mb-6">
		<button 
			on:click={() => { window.location.href = '/modules'; }}
			class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
		>
			← Volver a Módulos
		</button>
	</div>
	{#if error}
		<div class="text-center">
			<h1 class="text-2xl font-bold text-destructive mb-4">
				Error al Cargar
			</h1>
			<p class="text-muted">{error}</p>
			<Button href="/modules" class="mt-6">Volver a Módulos</Button>
		</div>
	{:else if module}
		<div class="mb-10 text-center">
			<div class="text-6xl mb-4">{module.icon}</div>
			<h1
				class="text-4xl font-bold text-foreground"
				style="font-family: 'Montserrat', sans-serif;"
			>
				{module.title}
			</h1>
			<p class="text-lg text-muted mt-2">{module.description}</p>
			

		</div>

		<div class="space-y-4 mb-12">
			<h2 class="text-2xl font-semibold mb-4 border-b pb-2">Lecciones</h2>

			{#each module.lessons as lesson, index}
				<div class="bg-card p-5 border border-border rounded-lg">
					<h3 class="text-lg font-bold text-primary">
						<span class="text-primary/60 mr-2">{index + 1}.</span>
						{lesson.title}
					</h3>
					<p class="mt-2 text-muted leading-relaxed">
						{lesson.content}
					</p>
				</div>
			{:else}
				<p class="text-muted text-center py-4">
					Este módulo aún no tiene lecciones.
				</p>
			{/each}
		</div>

		{#if module.challenge}
			<div
				class="bg-primary/10 p-8 rounded-lg text-center border border-primary/20"
			>
				<h2 class="text-2xl font-semibold mb-2">
					¡Pon a Prueba lo Aprendido!
				</h2>
				<p class="text-muted mb-6">
					Completa el siguiente reto para finalizar el módulo y ganar {module
						.challenge.points} puntos.
				</p>
				<Button size="lg" on:click={() => openChallengeModal(module.challenge)}>
					Resolver: {module.challenge.title}
				</Button>
			</div>
		{/if}
	{/if}
</div>

{#if selectedChallenge}
	<ChallengeModal challenge={selectedChallenge} {onClose} {onComplete} />
{/if}
