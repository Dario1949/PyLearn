<script>
  let { player, isCurrentUser = false, showDetailed = false, category = "points" } = $props();
  
  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-500';
      case 3: return 'text-amber-600';
      default: return 'text-muted';
    }
  };
</script>

<div class="p-6 hover:bg-accent/50 transition-colors {isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''}">
  <div class="flex items-center space-x-4">
    <!-- Rank -->
    <div class="w-12 text-center">
      <div class="text-2xl font-bold {getRankColor(player.rank)}">
        {getRankIcon(player.rank)}
      </div>
    </div>

    <!-- Avatar and Info -->
    <div class="flex items-center space-x-3 flex-1 min-w-0">
      <img 
        src={player.avatar || "/placeholder.svg"} 
        alt="Avatar de {player.name}"
        class="w-12 h-12 rounded-full border-2 {isCurrentUser ? 'border-primary' : 'border-border'}"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2">
          <h3 class="font-semibold text-card-foreground truncate">
            {player.name}
          </h3>
          {#if isCurrentUser}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
              Tú
            </span>
          {/if}
        </div>
        <p class="text-sm text-muted truncate">{player.program}</p>
        {#if showDetailed}
          <div class="flex items-center space-x-4 mt-2">
            <div class="flex items-center space-x-1">
              <span class="text-xs">🏅</span>
              <span class="text-xs text-muted">{player.badges?.length || 0} insignias</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-xs">🔥</span>
              <span class="text-xs text-muted">{player.streak} días</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Stats -->
    <div class="text-right">
      <div class="text-lg font-bold text-primary">
        {#if category === "modules"}
          {player.completedModules?.length || 0}
        {:else if category === "solvedPosts"}
          {player.solvedPosts || 0}
        {:else}
          {player.points.toLocaleString()}
        {/if}
      </div>
      <div class="text-sm text-muted">
        {#if category === "modules"}
          Módulos
        {:else if category === "solvedPosts"}
          Publicaciones
        {:else}
          Nivel {player.level}
        {/if}
      </div>
    </div>

    <!-- Trend Arrow (mock) -->
    <div class="w-6 text-center">
      {#if player.rank <= 3}
        <span class="text-green-500">↗️</span>
      {:else if player.rank <= 5}
        <span class="text-yellow-500">→</span>
      {:else}
        <span class="text-red-500">↘️</span>
      {/if}
    </div>
  </div>
</div>
