<script>
  import ColorSelectors from "$lib/components/store/ColorSelectors.svelte";
  import { goto } from "$app/navigation";
</script>

<div class="min-h-screen bg-background">
  <div class="w-full px-6 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-foreground" style="font-family: 'Montserrat', sans-serif;">
        Personalización
      </h1>
      <button
        on:click={() => goto("/dashboard")}
        class="text-sm text-primary hover:underline"
      >
        ← Volver al Dashboard
      </button>
    </div>

    <div class="max-w-4xl mx-auto">
      <ColorSelectors />
    </div>
  </div>
</div>