<script>
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";

  const authState = authStore.state;
  const user = $derived($authState.user);
  
  let notifications = $state([]);
  let loading = $state(true);
  let showMessageModal = $state(false);
  let selectedNotification = $state(null);

  // Cargar notificaciones
  $effect(() => {
    const u = user;
    if (u?.id) {
      loadNotifications(u.id);
    }
  });

  async function loadNotifications(userId) {
    loading = true;
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      const data = await response.json();
      if (data.notifications) {
        notifications = data.notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      loading = false;
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        notifications = notifications.filter(n => n.id !== notificationId);
      } else {
        alert('Error al eliminar la notificación');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  }

  function openMessageModal(notification) {
    selectedNotification = notification;
    showMessageModal = true;
  }

  function closeMessageModal() {
    showMessageModal = false;
    selectedNotification = null;
  }
</script>

<svelte:head>
  <title>Notificaciones - PyLearn CESMAG</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-foreground mb-2" style="font-family: 'Montserrat', sans-serif;">
          Notificaciones
        </h1>
        <p class="text-muted">Gestiona todos tus mensajes y notificaciones</p>
      </div>
      <Button variant="outline" on:click={() => goto('/dashboard')}>
        ← Volver al Dashboard
      </Button>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if notifications.length === 0}
      <div class="bg-card rounded-xl border border-border p-12 text-center">
        <p class="text-muted">No tienes notificaciones</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each notifications as notification (notification.id)}
          <div class="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-4 flex-1">
                <div class="w-3 h-3 rounded-full mt-2 {notification.read ? 'bg-muted' : 'bg-primary'}"></div>
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <h3 class="font-semibold text-foreground">{notification.from}</h3>
                    {#if notification.type === 'teacher_message'}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                        Docente
                      </span>
                    {/if}
                  </div>
                  
                  <p class="text-sm text-muted mb-3">{notification.message}</p>
                  
                  <p class="text-xs text-muted">
                    {new Date(notification.timestamp).toLocaleDateString('es-ES', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div class="flex space-x-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  on:click={() => openMessageModal(notification)}
                >
                  Ver completo
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  on:click={() => deleteNotification(notification.id)}
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
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
      
      <div class="flex justify-end space-x-3 mt-6">
        <Button variant="outline" on:click={() => deleteNotification(selectedNotification.id)}>
          Eliminar
        </Button>
        <Button on:click={closeMessageModal}>
          Cerrar
        </Button>
      </div>
    </div>
  </div>
{/if}