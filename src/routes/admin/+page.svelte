<script>
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let { data } = $props();

	let selectedView = $state('users');
	let userFormData = $state({ name: '', email: '', password: '', role: 'student', program: '' });
	let prompts = $state(JSON.parse(JSON.stringify(data.prompts || [])));
	let users = $state(data.users || []);
	let message = $state('');
	let isLoading = $state(false);
	let editingUser = $state(null);
	let moduleFormData = $state({ topic: '', numModules: 6 });
	let selectedUsers = $state([]);
	let exportFormat = $state('csv');
	let filterBy = $state('all');
	let careerFilter = $state('');

	// Cargar usuarios al inicializar
	$effect(() => {
		if (selectedView === 'users' && users.length === 0) {
			loadUsers();
		}
	});

	// Filtrar usuarios
	let filteredUsers = $derived(() => {
		let filtered = users;
		if (filterBy === 'students') filtered = users.filter(u => u.role === 'student');
		else if (filterBy === 'teachers') filtered = users.filter(u => u.role === 'teacher');
		else if (filterBy === 'admins') filtered = users.filter(u => u.role === 'admin');
		if (careerFilter) filtered = filtered.filter(u => u.program?.toLowerCase().includes(careerFilter.toLowerCase()));
		return filtered;
	});

	// Auto-ocultar mensajes después de 5 segundos
	$effect(() => {
		if (message) {
			const timer = setTimeout(() => {
				message = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});

	async function createUser(e) {
		e.preventDefault();
		isLoading = true;
		message = '';
		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userFormData)
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error);
			message = `¡Éxito! ${userFormData.role === 'teacher' ? 'Docente' : userFormData.role === 'admin' ? 'Administrador' : 'Estudiante'} "${userFormData.name}" creado correctamente.`;
			userFormData = { name: '', email: '', password: '', role: 'student', program: '' };
			await loadUsers();
		} catch (error) {
			message = `Error: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			const result = await response.json();
			if (response.ok) users = result;
		} catch (error) {
			console.error('Error cargando usuarios:', error);
		}
	}

	async function deleteUser(userId) {
		const user = users.find(u => u.id === userId);
		if (!confirm(`¿Estás seguro de eliminar al usuario "${user?.name}"?\n\nEsta acción no se puede deshacer.`)) return;
		
		isLoading = true;
		try {
			const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
			const result = await response.json();
			if (response.ok) {
				message = `Usuario "${user?.name}" eliminado correctamente`;
				await loadUsers();
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			message = `Error al eliminar usuario: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}

	async function updateUser(e) {
		e.preventDefault();
		isLoading = true;
		try {
			const response = await fetch(`/api/admin/users/${editingUser.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editingUser)
			});
			if (response.ok) {
				message = `Usuario "${editingUser.name}" actualizado correctamente`;
				editingUser = null;
				await loadUsers();
			}
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

	async function generateModules(e) {
		e.preventDefault();
		isLoading = true;
		message = '';
		try {
			const response = await fetch('/api/modules/generate-plan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(moduleFormData)
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error);
			message = `¡Éxito! Se generaron ${moduleFormData.numModules} módulos sobre "${moduleFormData.topic}" con IA.`;
			moduleFormData = { topic: '', numModules: 6 };
		} catch (error) {
			message = `Error: ${error.message}`;
		} finally {
			isLoading = false;
		}
	}

	function toggleUserSelection(userId) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter(id => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	function selectAllFiltered() {
		selectedUsers = filteredUsers.map(u => u.id);
	}

	function clearSelection() {
		selectedUsers = [];
	}

	async function exportData() {
		const usersToExport = selectedUsers.length > 0 
			? users.filter(u => selectedUsers.includes(u.id))
			: filteredUsers;

		if (usersToExport.length === 0) {
			message = 'No hay usuarios seleccionados para exportar';
			return;
		}

		try {
			const response = await fetch('/api/admin/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ users: usersToExport, format: exportFormat })
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `estudiantes_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
				a.click();
				window.URL.revokeObjectURL(url);
				message = `Archivo ${exportFormat.toUpperCase()} descargado correctamente`;
			} else {
				throw new Error('Error al exportar datos');
			}
		} catch (error) {
			message = `Error: ${error.message}`;
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
			onclick={() => (selectedView = 'users')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Gestionar Usuarios
		</button>
		<button
			onclick={() => (selectedView = 'modules')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'modules' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Crear Módulos IA
		</button>
		<button
			onclick={() => (selectedView = 'exports')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'exports' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Exportar Datos
		</button>
		<button
			onclick={() => (selectedView = 'prompts')}
			class="px-4 py-2 text-sm font-medium transition-colors {selectedView === 'prompts' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'}"
		>
			Gestionar Prompts
		</button>
	</div>

	{#if selectedView === 'users'}
		<div class="space-y-6">
			<div class="bg-card p-6 rounded-lg border">
				<h2 class="text-xl font-semibold mb-4">Crear Nuevo Usuario</h2>
				<form onsubmit={createUser} class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium mb-1">Nombre Completo</label>
						<Input id="name" bind:value={userFormData.name} placeholder="Nombre completo" required />
					</div>
					<div>
						<label for="email" class="block text-sm font-medium mb-1">Correo Electrónico</label>
						<Input id="email" bind:value={userFormData.email} type="email" placeholder="correo@ejemplo.com" required />
					</div>
					<div>
						<label for="password" class="block text-sm font-medium mb-1">Contraseña</label>
						<Input id="password" bind:value={userFormData.password} type="password" placeholder="Contraseña segura" required />
					</div>
					<div>
						<label for="role" class="block text-sm font-medium mb-1">Rol</label>
						<select bind:value={userFormData.role} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
							<option value="student">Estudiante</option>
							<option value="teacher">Docente</option>
							<option value="admin">Administrador</option>
						</select>
					</div>
					<div>
						<label for="program" class="block text-sm font-medium mb-1">Programa/Carrera (Opcional)</label>
						<Input id="program" bind:value={userFormData.program} placeholder="Ej: Ingeniería de Sistemas" />
					</div>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? 'Creando...' : 'Crear Usuario'}
					</Button>
				</form>
			</div>

			<div class="bg-card p-6 rounded-lg border">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-semibold">Lista de Usuarios ({users.length})</h2>
					<Button onclick={loadUsers} disabled={isLoading}>Actualizar</Button>
				</div>
				
				{#if users.length === 0}
					<div class="text-center py-8 text-muted">
						<p>No hay usuarios registrados</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b bg-muted/50">
									<th class="text-left p-3 font-medium">Nombre</th>
									<th class="text-left p-3 font-medium">Email</th>
									<th class="text-left p-3 font-medium">Rol</th>
									<th class="text-left p-3 font-medium">Fecha Registro</th>
									<th class="text-left p-3 font-medium">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredUsers as user}
									<tr class="border-b hover:bg-muted/30 transition-colors">
										<td class="p-3 font-medium">{user.name}</td>
										<td class="p-3 text-muted">{user.email}</td>
										<td class="p-3">
											<span class="px-2 py-1 rounded-full text-xs font-medium {user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : user.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}">
												{user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Docente' : 'Estudiante'}
											</span>
										</td>
										<td class="p-3 text-muted text-xs">
											{new Date(user.created_at).toLocaleDateString('es-ES')}
										</td>
										<td class="p-3">
											<div class="flex gap-2">
												<button onclick={() => editingUser = {...user}} class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors">Editar</button>
												<button onclick={() => deleteUser(user.id)} class="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors">Eliminar</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			{#if editingUser}
				<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={(e) => e.target === e.currentTarget && (editingUser = null)}>
					<div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-lg font-semibold">Editar Usuario</h3>
							<button onclick={() => editingUser = null} class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
						</div>
						<form onsubmit={updateUser} class="space-y-4">
							<div>
								<label class="block text-sm font-medium mb-1">Nombre Completo</label>
								<Input bind:value={editingUser.name} placeholder="Nombre completo" required />
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Correo Electrónico</label>
								<Input bind:value={editingUser.email} type="email" placeholder="correo@ejemplo.com" required />
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Rol del Usuario</label>
								<select bind:value={editingUser.role} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
									<option value="student">Estudiante</option>
									<option value="teacher">Docente</option>
									<option value="admin">Administrador</option>
								</select>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Programa/Carrera</label>
								<Input bind:value={editingUser.program} placeholder="Ej: Ingeniería de Sistemas" />
							</div>
							<div class="flex gap-2 pt-2">
								<Button type="submit" disabled={isLoading} class="flex-1">
									{isLoading ? 'Guardando...' : 'Guardar Cambios'}
								</Button>
								<Button type="button" onclick={() => editingUser = null} class="flex-1 bg-gray-500 hover:bg-gray-600">Cancelar</Button>
							</div>
						</form>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if selectedView === 'modules'}
		<div class="bg-card p-6 rounded-lg border">
			<div class="mb-6">
				<h2 class="text-xl font-semibold mb-2">Crear Módulos con IA</h2>
				<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
					<p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
						<strong>🤖 Generación Inteligente:</strong> La IA creará módulos completos con lecciones, retos y casos de prueba.
					</p>
					<p class="text-xs text-blue-600 dark:text-blue-300">
						💡 Especifica el tema y número de módulos para generar contenido educativo personalizado
					</p>
				</div>
			</div>

			<form onsubmit={generateModules} class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="topic" class="block text-sm font-medium mb-2">Tema del Curso</label>
						<Input 
							id="topic" 
							bind:value={moduleFormData.topic} 
							placeholder="Ej: Fundamentos de Python, Estructuras de Datos, etc." 
							required 
						/>
					</div>
					<div>
						<label for="numModules" class="block text-sm font-medium mb-2">Número de Módulos</label>
						<select bind:value={moduleFormData.numModules} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value={4}>4 Módulos (Básico)</option>
							<option value={6}>6 Módulos (Intermedio)</option>
							<option value={8}>8 Módulos (Avanzado)</option>
							<option value={10}>10 Módulos (Completo)</option>
						</select>
					</div>
				</div>

				<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
					<p class="text-sm text-yellow-800 dark:text-yellow-200">
						⚠️ <strong>Advertencia:</strong> Esta acción reemplazará todos los módulos, lecciones y retos existentes.
					</p>
				</div>

				<Button type="submit" disabled={isLoading} class="w-full">
					{isLoading ? 'Generando con IA...' : '🤖 Generar Módulos con IA'}
				</Button>
			</form>
		</div>
	{/if}

	{#if selectedView === 'exports'}
		<div class="space-y-6">
			<div class="bg-card p-6 rounded-lg border">
				<h2 class="text-xl font-semibold mb-4">Exportar Datos de Estudiantes</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div>
						<label class="block text-sm font-medium mb-2">Filtrar por Rol</label>
						<select bind:value={filterBy} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="all">Todos los usuarios</option>
							<option value="students">Solo estudiantes</option>
							<option value="teachers">Solo docentes</option>
							<option value="admins">Solo administradores</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">Filtrar por Carrera</label>
						<Input bind:value={careerFilter} placeholder="Ej: Ingeniería, Sistemas..." />
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">Formato de Exportación</label>
						<select bind:value={exportFormat} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="csv">CSV (Excel)</option>
							<option value="pdf">PDF</option>
							<option value="xlsx">Excel (.xlsx)</option>
						</select>
					</div>
				</div>

				<div class="flex gap-3 mb-4">
					<Button onclick={selectAllFiltered} variant="outline">Seleccionar Todos ({filteredUsers.length})</Button>
					<Button onclick={clearSelection} variant="outline">Limpiar Selección</Button>
					<Button onclick={exportData} disabled={filteredUsers.length === 0}>
						📄 Exportar {selectedUsers.length > 0 ? `(${selectedUsers.length})` : `Todos (${filteredUsers.length})`}
					</Button>
				</div>

				{#if filteredUsers.length > 0}
					<div class="overflow-x-auto max-h-96 border rounded-lg">
						<table class="w-full text-sm">
							<thead class="bg-muted/50 sticky top-0">
								<tr>
									<th class="text-left p-3">
										<input type="checkbox" 
											checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
											onchange={selectedUsers.length === filteredUsers.length ? clearSelection : selectAllFiltered}
										/>
									</th>
									<th class="text-left p-3 font-medium">Nombre</th>
									<th class="text-left p-3 font-medium">Email</th>
									<th class="text-left p-3 font-medium">Rol</th>
									<th class="text-left p-3 font-medium">Programa</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredUsers as user}
									<tr class="border-b hover:bg-muted/30 transition-colors">
										<td class="p-3">
											<input type="checkbox" 
												checked={selectedUsers.includes(user.id)}
												onchange={() => toggleUserSelection(user.id)}
											/>
										</td>
										<td class="p-3 font-medium">{user.name}</td>
										<td class="p-3 text-muted">{user.email}</td>
										<td class="p-3">
											<span class="px-2 py-1 rounded-full text-xs font-medium {user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
												{user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Docente' : 'Estudiante'}
											</span>
										</td>
										<td class="p-3 text-muted">{user.program || 'No especificado'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="text-center py-8 text-muted">
						<p>No se encontraron usuarios con los filtros aplicados</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if selectedView === 'prompts'}
		<div class="bg-card p-6 rounded-lg border">
			<div class="mb-6">
				<h2 class="text-xl font-semibold mb-2">Gestión de Prompts de IA</h2>
				<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
					<p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
						<strong>Instrucciones:</strong> Modifica las instrucciones que se le dan a la IA para generar contenido.
					</p>
					<p class="text-xs text-blue-600 dark:text-blue-300">
						💡 Usa <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{variable}'}</code> para insertar valores dinámicos
					</p>
				</div>
			</div>
			
			<form onsubmit={savePrompts} class="space-y-6">
				{#if prompts.length > 0}
					{#each prompts as prompt, index}
						<div class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
							<div class="flex items-center justify-between mb-3">
								<label class="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
									{prompt.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
								</label>
								<span class="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
									{prompt.content?.length || 0} caracteres
								</span>
							</div>
							<Textarea 
								bind:value={prompt.content} 
								class="min-h-[150px] font-mono text-xs resize-y" 
								placeholder="Ingresa las instrucciones para la IA..."
							/>
						</div>
					{/each}
					<div class="flex justify-between items-center pt-4 border-t">
						<p class="text-sm text-muted">
							{prompts.length} prompt{prompts.length !== 1 ? 's' : ''} configurado{prompts.length !== 1 ? 's' : ''}
						</p>
						<Button type="submit" disabled={isLoading} class="px-6">
							{isLoading ? 'Guardando...' : 'Guardar Todos los Prompts'}
						</Button>
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="text-gray-400 mb-4">
							<svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
						</div>
						<p class="text-muted text-lg mb-2">No se encontraron prompts</p>
						<p class="text-sm text-muted">Los prompts de IA no están configurados en la base de datos.</p>
					</div>
				{/if}
			</form>
		</div>
	{/if}

	{#if message}
		<div class="mt-6 p-4 rounded-lg border {message.toLowerCase().includes('error') ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'}">
			<div class="flex items-center gap-2">
				{#if message.toLowerCase().includes('error')}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				{/if}
				<p class="font-medium">{message}</p>
				<button onclick={() => message = ''} class="ml-auto text-current opacity-70 hover:opacity-100">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>
