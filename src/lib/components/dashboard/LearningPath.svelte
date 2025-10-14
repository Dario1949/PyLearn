<script>
	// --- MEJORA: Props desacopladas ---
	// 'allModules' es la lista estática de todos los módulos del curso.
	// 'userProgress' es el estado dinámico del usuario.
	let { allModules, userProgress } = $props();

	// --- MEJORA: Lógica centralizada y reactiva con '$derived' ---
	// Esta constante se recalcula automáticamente si 'allModules' o 'userProgress' cambian.
	const displayModules = $derived(() => {
		// Usamos un fallback a un array vacío para evitar errores si las props no han cargado.
		if (!allModules || !userProgress) {
			return [];
		}
		
		let inProgressFound = false;
		
		// Mapeamos sobre la lista maestra de módulos para determinar el estado de cada uno.
		return allModules.map((module) => {
			const isCompleted = userProgress.completedModules?.includes(module.id);
			let status = 'locked';
			let progress = 0;

			if (isCompleted) {
				status = 'completed';
				progress = 100;
			} else if (!inProgressFound) {
				// El primer módulo que no está completado se marca como "en progreso".
				status = 'in-progress';
				progress = userProgress.currentProgress?.moduleId === module.id 
					? userProgress.currentProgress.progress 
					: 0;
				inProgressFound = true;
			}
			
			// Devolvemos el objeto del módulo enriquecido con su estado y progreso calculado.
			return { ...module, status, progress };
		});
	});
	
	// --- MEJORA: Código más limpio con objetos de mapeo ---
	const statusColors = {
		completed: 'bg-primary text-primary-foreground',
		'in-progress': 'bg-secondary text-secondary-foreground',
		locked: 'bg-muted text-muted-foreground'
	};
	
	const statusLabels = {
		completed: { text: 'Completado', class: 'bg-primary/10 text-primary' },
		'in-progress': { text: 'En Progreso', class: 'bg-secondary/10 text-secondary' },
		locked: { text: 'Bloqueado', class: 'bg-muted/20 text-muted' }
	};
</script>

<div class="bg-card rounded-xl p-6 border border-border">
	<h2 class="text-lg font-semibold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
		Mi Ruta de Aprendizaje
	</h2>

	<div class="relative">
		<div class="absolute left-8 top-8 bottom-8 w-0.5 bg-border"></div>

		<div class="space-y-6">
			{#each displayModules as module}
				<div class="relative flex items-center space-x-4">
					<div
						class="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl
                        {statusColors[module.status]} transition-all duration-200 hover:scale-105"
					>
						{module.icon}
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between mb-2">
							<h3 class="text-base font-semibold text-card-foreground truncate">{module.name}</h3>
							<div class="flex items-center space-x-2">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {statusLabels[module.status].class}">
									{statusLabels[module.status].text}
								</span>
							</div>
						</div>

						{#if module.status !== 'locked'}
							<div class="w-full bg-muted/20 rounded-full h-2 mb-2">
								<div
									class="h-2 rounded-full transition-all duration-300
                                  {module.status === 'completed' ? 'bg-primary' : 'bg-secondary'}"
									style="width: {module.progress}%"
								></div>
							</div>
							<p class="text-xs text-muted">{module.progress}% completado</p>
						{:else}
							<p class="text-xs text-muted">Completa el módulo anterior para desbloquear</p>
						{/if}
					</div>

					<div>
						</div>
				</div>
			{/each}
		</div>
	</div>
</div>