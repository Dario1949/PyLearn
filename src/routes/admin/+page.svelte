<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte'; // Asegúrate que la ruta sea correcta

	// 1. Recibimos los prompts desde el cargador `+page.js`
	let { data } = $props();

	// 2. Estado local para la UI y los formularios
	let selectedView = $state('teachers');
	let teacherFormData = $state({ name: '', email: '', password: '' });
	// Hacemos una copia de los prompts para poder editarlos.
	let prompts = $state(JSON.parse(JSON.stringify(data.prompts || {})));
	let message = $state('');
	let isLoading = $state(false);

	async function createTeacher(e) {
		e.preventDefault();

		isLoading = true;
		message = '';
		try {
			const response = await fetch('/api/admin/create-teacher', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(teacherFormData)
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error);
			message = `¡Éxito! El docente ${teacherFormData.name} ha sido creado.`;
			teacherFormData = { name: '', email: '', password: '' };
		} catch (error) {
			message = `Error: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}

	async function savePrompts(e) {
		e.preventDefault();
		
		isLoading = true;
		message = '';
		try {
			const response = await fetch('/api/admin/prompts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(prompts)
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error);
			message = '¡Éxito! Los prompts han sido guardados.';
		} catch (err) {
			message = `Error: ${err.message}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Panel de Administración</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
	<h1 class="text-3xl font-bold mb-4">Panel de Administración</h1>
	<p class="text-muted mb-8">Gestiona los recursos de la plataforma.</p>

	<div class="flex border-b mb-6">
		<button
			onclick={() => (selectedView = 'teachers')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'teachers' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Gestionar Docentes
		</button>
		<button
			onclick={() => (selectedView = 'prompts')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'prompts' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Gestionar Prompts de IA
		</button>
	</div>

	{#if selectedView === 'teachers'}
		<div class="bg-card p-6 rounded-lg border">
			<h2 class="text-xl font-semibold mb-4">Crear Nuevo Docente</h2>
			<form onsubmit={createTeacher} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium mb-1">Nombre Completo</label>
					<Input id="name" bind:value={teacherFormData.name} placeholder="Nombre del docente" required />
				</div>
				<div>
					<label for="email" class="block text-sm font-medium mb-1">Correo Institucional</label>
					<Input id="email" bind:value={teacherFormData.email} type="email" placeholder="correo@cesmag.edu.co" required />
				</div>
				<div>
					<label for="password" class="block text-sm font-medium mb-1">Contraseña Temporal</label>
					<Input id="password" bind:value={teacherFormData.password} type="password" placeholder="Contraseña segura" required />
				</div>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? 'Creando...' : 'Crear Docente'}
				</Button>
			</form>
		</div>
	{/if}

	{#if selectedView === 'prompts'}
		<div class="bg-card p-6 rounded-lg border">
			<h2 class="text-xl font-semibold mb-4">Gestión de Prompts de IA</h2>
			<p class="text-sm text-muted mb-6">
				Modifica las instrucciones que se le dan a la IA para generar contenido. Usa `{'{variable}'}` para
				insertar valores dinámicos.
			</p>
			<form onsubmit={savePrompts} class="space-y-6">
				{#if Object.keys(prompts).length > 0}
					{#each Object.entries(prompts) as [key, _]}
						<div>
							<label for={key} class="block text-sm font-medium mb-2 capitalize font-mono">{key.replace(/([A-Z])/g, ' $1')}</label>
							<Textarea id={key} bind:value={prompts[key]} class="min-h-[200px] font-mono text-xs" />
						</div>
					{/each}
					<Button type="submit" disabled={isLoading}>
						{isLoading ? 'Guardando...' : 'Guardar Cambios en Prompts'}
					</Button>
				{:else}
					<p class="text-muted text-center">No se encontraron prompts para editar.</p>
				{/if}
			</form>
		</div>
	{/if}

	{#if message}
		<p class="mt-6 text-sm p-3 rounded-md {message.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}">
			{message}
		</p>
	{/if}
</div>
