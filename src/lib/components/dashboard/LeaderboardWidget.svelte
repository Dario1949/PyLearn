<script>
  let { leaderboard, currentUser } = $props();

  // --- MEJORA 1: Cálculo reactivo y seguro del rango ---
  // Usamos '$derived' para que el rango se recalcule automáticamente si las props cambian.
  // También añadimos protecciones para evitar errores si 'leaderboard' o 'currentUser' son nulos.
  // Se cambió la comparación de 'name' a un 'id' único para mayor precisión.
  const currentUserRank = $derived(() => {

    if (!currentUser?.id || !leaderboard) {
      return null;
    }
    // Buscamos el índice del usuario actual en la lista.
    const index = leaderboard.findIndex((user) => user.id === currentUser.id);

    // Si se encuentra, devolvemos su rango (índice + 1), si no, nulo.
    return index !== -1 ? index + 1 : null;
  });

  // --- MEJORA 2: Lógica de medallas simplificada ---
  // Usamos un array para que el código en el HTML sea más limpio.
  const medals = ["🥇", "🥈", "🥉"];
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <h2
    class="text-lg font-semibold text-card-foreground mb-4"
    style="font-family: 'Montserrat', sans-serif;"
  >
    Tabla de Clasificación
  </h2>

  {#if currentUserRank}
    <div class="bg-primary/10 rounded-lg p-3 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold"
          >
            {currentUserRank()}
          </div>
          <div>
            <p class="text-sm font-medium text-card-foreground">Tu posición</p>
            <p class="text-xs text-muted">{currentUser?.points ?? 0} puntos</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-primary">#{currentUserRank()}</p>
        </div>
      </div>
    </div>
  {/if}

  <div class="space-y-3">
    {#each (leaderboard || []).slice(0, 3) as user, index}
      <div
        class="flex items-center space-x-3 p-2 rounded-lg {user.id ===
        currentUser?.id
          ? 'bg-primary/10'
          : 'hover:bg-accent/50'} transition-colors"
      >
        <div class="relative">
          <img
            src={user.avatar || "/placeholder.svg"}
            alt="Avatar de {user.name}"
            class="w-8 h-8 rounded-full object-cover"
          />
          <div
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs
                           {index === 0
              ? 'bg-yellow-500 text-white'
              : index === 1
                ? 'bg-gray-400 text-white'
                : 'bg-amber-600 text-white'}"
          >
            {medals[index]}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-card-foreground truncate">
            {user.name}
          </p>
          <p class="text-xs text-muted">{user.points} puntos</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-primary">#{index + 1}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 pt-4 border-t border-border">
    <a href="/leaderboard" class="text-sm text-primary hover:text-primary/80 font-medium">
      Ver ranking completo →
    </a>
  </div>
</div>
