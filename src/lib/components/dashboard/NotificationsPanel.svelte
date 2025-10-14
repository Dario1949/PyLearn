<script>
	let { notifications } = $props();

	// --- MEJORA 1: Cálculo reactivo del conteo ---
	// Usamos '$derived' para que 'unreadCount' se recalcule automáticamente
	// cada vez que la prop 'notifications' cambie (ej. al marcar una como leída).
	// También añadimos un fallback '|| []' para evitar errores si las notificaciones aún no han cargado.
	const unreadCount = $derived((notifications || []).filter((n) => !n.read).length);
	
	// Estado para el modal de mensaje completo
	let showMessageModal = $state(false);
	let selectedNotification = $state(null);
	
	function openMessageModal(notification) {
		selectedNotification = notification;
		showMessageModal = true;
	}
	
	function closeMessageModal() {
		showMessageModal = false;
		selectedNotification = null;
	}
</script>

<div class="bg-card rounded-xl p-6 border border-border">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-semibold text-card-foreground" style="font-family: 'Montserrat', sans-serif;">
			Notificaciones
		</h2>
		{#if unreadCount > 0}
			<span
				class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
			>
				{unreadCount}
			</span>
		{/if}
	</div>

	<div class="space-y-3">
		{#each (notifications || []).slice(0, 3) as notification}
			<div
				class="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors {notification.read
					? ''
					: 'bg-primary/5'}"
			>
				<div class="flex items-start space-x-3">
					<div
						class="w-2 h-2 rounded-full mt-2 {notification.read ? 'bg-muted' : 'bg-primary'}"
					></div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center space-x-2">
							<p class="text-sm font-medium text-card-foreground">{notification.from ?? 'Sistema'}</p>
							{#if notification.type === 'teacher_message'}
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
									Docente
								</span>
							{/if}
						</div>
						<p class="text-xs text-muted mt-1">{notification.message?.length > 50 ? notification.message.substring(0, 50) + '...' : notification.message ?? 'Sin mensaje.'}</p>
						<div class="flex items-center justify-between mt-2">
							<p class="text-xs text-muted">{new Date(notification.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
							<button 
								on:click={() => openMessageModal(notification)}
								class="text-xs text-primary hover:text-primary/80 font-medium"
							>
								Ver completo
							</button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-4 pt-4 border-t border-border">
		<a href="/notifications" class="text-sm text-primary hover:text-primary/80 font-medium">
			Ver todas las notificaciones →
		</a>
	</div>
</div>

{#if showMessageModal && selectedNotification}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-2">
					<h2 class="text-lg font-semibold text-foreground">Mensaje</h2>
					{#if selectedNotification.type === 'teacher_message'}
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
							Docente
						</span>
					{/if}
				</div>
				<button on:click={closeMessageModal} class="text-muted hover:text-foreground">✕</button>
			</div>
			
			<div class="space-y-4">
				<div>
					<p class="text-sm font-medium text-foreground mb-1">De: {selectedNotification.from}</p>
					<p class="text-xs text-muted">{new Date(selectedNotification.timestamp).toLocaleDateString('es-ES', { 
						weekday: 'long',
						year: 'numeric', 
						month: 'long', 
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}</p>
				</div>
				
				<div class="bg-muted/30 rounded-lg p-4">
					<p class="text-sm text-foreground whitespace-pre-wrap">{selectedNotification.message}</p>
				</div>
			</div>
			
			<div class="flex justify-end mt-6">
				<button 
					on:click={closeMessageModal}
					class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
				>
					Cerrar
				</button>
			</div>
		</div>
	</div>
{/if}