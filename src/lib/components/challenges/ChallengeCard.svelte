<script>
	export let challenge;
	export let onclick = null;

	function format(text) {
		if (typeof text !== 'string') {
			return '';
		}

		return text
			.toLowerCase() // 1. Convertir a minúsculas
			.normalize('NFD') // 2. Descomponer caracteres y tildes (ej: 'á' -> 'a' + '´')
			.replace(/[\u0300-\u036f]/g, ''); // 3. Eliminar los diacríticos (las tildes)
	}

	const difficultyColors = {
		easy: 'bg-green-600 text-white border-green-600',
		medium: 'bg-orange-600 text-white border-orange-600',
		hard: 'bg-red-600 text-white border-red-600',
		facil: 'bg-green-600 text-white border-green-600',
		intermedio: 'bg-orange-600 text-white border-orange-600',
		dificil: 'bg-red-600 text-white border-red-600'
	};

	const difficultyLabels = {
		easy: 'Fácil',
		medium: 'Medio',
		hard: 'Difícil'
	};

	function handleChallengeClick() {
		if (onclick) {
			onclick();
		} else {
			// Navigate to individual challenge page
			//window.location.href = `/challenges/${challenge.id}`;
		}
	}
</script>

<div
	class="cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
	role="button"
	tabindex="0"
	aria-label="Challenge Card"
	onclick={handleChallengeClick}
	onkeydown={(e) => e.key === 'Enter' && handleChallengeClick()}
>
	<!-- Challenge Header -->
	<div class="p-6 pb-4">
		<div class="mb-4 flex items-center justify-between">
			<span
				class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium {difficultyColors[
					format(challenge.difficulty)
				]}"
			>
				{difficultyLabels[format(challenge.difficulty)] || challenge.difficulty}
			</span>
			<div class="flex items-center space-x-2">
				{#if challenge.timeLimit}
					<span class="flex items-center text-xs text-muted">
						<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						{challenge.timeLimit}min
					</span>
				{/if}
				{#if challenge.completed}
					<span class="text-green-500">✅</span>
				{/if}
			</div>
		</div>

		<h3
			class="mb-2 text-xl font-bold text-card-foreground"
			style="font-family: 'Montserrat', sans-serif;"
		>
			{challenge.title}
		</h3>

		<p class="mb-4 text-sm leading-relaxed text-muted">
			{challenge.description}
		</p>

		<!-- Challenge Stats -->
		<div class="mb-4 flex items-center justify-between text-sm text-muted">
			<div class="flex items-center space-x-4">
				<div class="flex items-center space-x-1">
					<span class="text-primary">⭐</span>
					<span>{challenge.points} puntos</span>
				</div>
				<div class="flex items-center space-x-1">
					<span>📂</span>
					<span>{challenge.category}</span>
				</div>
			</div>
			{#if challenge.attempts > 0}
				<div class="text-xs text-muted">
					{challenge.attempts} intento{challenge.attempts !== 1 ? 's' : ''}
				</div>
			{/if}
		</div>

		<!-- Progress Indicator -->
		{#if challenge.completed}
			<div class="flex items-center space-x-2 text-sm text-green-600">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span class="font-medium">Completado</span>
			</div>
		{:else}
			<div class="flex items-center space-x-2 text-sm text-primary">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					></path>
				</svg>
				<span class="font-medium">Resolver Reto</span>
			</div>
		{/if}
	</div>
</div>
