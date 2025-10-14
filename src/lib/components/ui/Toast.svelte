<script>
  import { toast } from '$lib/store/toast.js';

  // Animación de entrada/salida
  let timeout;
</script>

{#if $toast.visible}
  <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-lg text-white font-semibold text-center transition-all duration-300
    { $toast.type === 'success' ? 'bg-green-600' : $toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600' }">
    {$toast.message}
  </div>
{/if}

<style>
  .toast {
    min-width: 200px;
    max-width: 90vw;
    font-size: 1rem;
  }
</style>
