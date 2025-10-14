<script>
	let { user } = $props();

	// --- LÓGICA DE PROGRESO Y NIVELES ---

	// 1. Definimos un sistema de puntos para cada nivel.
	//    Esto hace que el cálculo del progreso sea predecible y fácil de cambiar.
	const POINTS_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, Infinity]; // Puntos totales para alcanzar cada nivel

	function getPointsForLevel(level) {
		return POINTS_PER_LEVEL[level - 1] ?? 0;
	}
	
	// 2. Usamos '$derived' para calcular valores reactivos a partir de los datos del usuario.
	//    Estos se actualizarán automáticamente si los puntos o el nivel del usuario cambian.
	const currentPoints = $derived(user?.points ?? 0);
	const completedModules = $derived(user?.completedModules?.length ?? 0);
	const currentLevel = $derived(Math.max(1, completedModules));

	const pointsForCurrentLevel = $derived(getPointsForLevel(currentLevel));
	const pointsForNextLevel = $derived(getPointsForLevel(currentLevel + 1));
	
	const pointsInLevelWindow = $derived(pointsForNextLevel - pointsForCurrentLevel);
	const userProgressInLevel = $derived(currentPoints - pointsForCurrentLevel);

	// Calculamos el porcentaje, asegurándonos de que no sea mayor a 100 y manejando la división por cero.
	const progressPercentage = $derived(() => {
		console.log('ProfileCard - currentPoints:', currentPoints, 'currentLevel:', currentLevel, 'pointsForCurrentLevel:', pointsForCurrentLevel, 'pointsForNextLevel:', pointsForNextLevel);
		if (pointsInLevelWindow > 0) {
			const pct = Math.min(Math.floor((userProgressInLevel / pointsInLevelWindow) * 100), 100);
			console.log('ProfileCard - progressPercentage:', pct);
			return Math.max(pct > 0 ? pct : 1, pct); // Mínimo 1% para visibilidad
		}
		return 1;
	});

	const pointsNeeded = $derived(Math.max(0, pointsForNextLevel - currentPoints));

	// --- LÓGICA DE INSIGNIAS ---
	import { gamificationStore } from '$lib/stores/gamification.svelte.js';
	
	const gamState = gamificationStore.state;
	const displayBadges = $derived(($gamState?.badges || []).filter(badge => badge.earned));
</script>

<div class="bg-card rounded-xl p-6 border border-border">
	<div class="flex items-center space-x-4 mb-6">
		<div class="relative">
			<img
				src={user?.avatar || '/placeholder.svg?height=64&width=64'}
				alt="Avatar de {user?.name ?? 'Usuario'}"
				class="w-16 h-16 rounded-full border-2 border-primary object-cover"
			/>
			<div
				class="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
			>
				{currentLevel}
			</div>
		</div>
		<div class="flex-1">
			<h2 class="text-xl font-bold text-card-foreground" style="font-family: 'Montserrat', sans-serif;">
				{user?.name ?? 'Nombre de Usuario'}
			</h2>
			<p class="text-muted text-sm">{user?.program ?? 'Programa no especificado'}</p>
			<div class="flex items-center space-x-4 mt-2">
				<div class="flex items-center space-x-1">
					<span class="text-secondary font-semibold">{currentPoints}</span>
					<span class="text-muted text-sm">puntos</span>
				</div>
				<div class="flex items-center space-x-1">
					<span class="text-primary font-semibold">Nivel {currentLevel}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-6">
		<div class="flex justify-between items-center mb-2">
			<span class="text-sm text-muted">Nivel Actual: {currentLevel}</span>
			<span class="text-sm text-muted">{completedModules}/6 módulos</span>
		</div>
		<div class="w-full bg-muted/20 rounded-full h-2">
			<div class="bg-primary h-2 rounded-full transition-all duration-500" style="width: {Math.floor((completedModules / 6) * 100)}%"></div>
		</div>
		{#if completedModules < 6}
			<p class="text-xs text-muted mt-1">Completa 1 módulo más para subir al nivel {currentLevel + 1}</p>
		{:else}
			<p class="text-xs text-primary font-medium mt-1">¡Nivel máximo alcanzado!</p>
		{/if}
	</div>

	<div>
		<h3 class="text-sm font-semibold text-card-foreground mb-3">Insignias</h3>
		{#if displayBadges.length > 0}
			<div class="grid grid-cols-4 gap-2">
				{#each displayBadges.slice(0, 8) as badge}
					<div class="relative group">
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-primary/10 transition-all duration-200 hover:scale-105 mx-auto"
						>
							<span class="opacity-100">{badge.icon}</span>
						</div>
						<div
							class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
						>
							{badge.name}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-4">
				<p class="text-muted text-sm">No tienes insignias aún</p>
				<p class="text-muted text-xs mt-1">Visita la tienda para comprar insignias</p>
			</div>
		{/if}
	</div>
</div>