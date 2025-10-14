<script>
  // 1. Recibimos la prop 'post', que ahora contiene 'author' como un objeto
  let { post } = $props();

  // 2. Calculamos las iniciales y otros datos de forma segura y reactiva con '$derived'
  const authorName = $derived(post?.author?.name ?? "Anónimo");
  const authorAvatar = $derived(post?.author?.avatar);
  const authorRole = $derived(post?.author?.role ?? "student");

  const authorInitials = $derived(() => {
    const name = authorName;
    const parts = name.split(" ").filter((p) => p);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  const timeAgo = $derived(() => {
    if (!post?.createdAt) return "hace un momento";
    const date = new Date(post.createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `hace ${diffInSeconds} seg`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
  });

  // Mantenemos la lógica de categorías, pero ahora en un '$derived' para mayor consistencia
  const categoryInfo = $derived(() => {
    const categoryId = post?.category.toLowerCase() ?? "general";
    const categories = {
      general: { name: "General", color: "bg-blue-500" },
      variables: { name: "Variables", color: "bg-green-500" },
      control: { name: "Control", color: "bg-yellow-500" },
      functions: { name: "Funciones", color: "bg-purple-500" },
      "data-structures": { name: "Listas/Diccionarios", color: "bg-red-500" },
    };
    return categories[categoryId] || { name: "General", color: "bg-gray-500" };
  });
</script>

<div
  class="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
>
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center space-x-3">
      {#if authorAvatar}
        <img
          src={authorAvatar}
          alt="Avatar de {authorName}"
          class="w-10 h-10 rounded-full object-cover"
        />
      {:else}
        <div
          class="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm"
        >
          {authorInitials()}
        </div>
      {/if}
      <div>
        <div class="flex items-center space-x-2">
          <h3 class="font-medium text-foreground">{authorName}</h3>
          {#if authorRole === "teacher"}
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary"
              >Docente</span
            >
          {:else if authorRole === "admin"}
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >Admin</span
            >
          {/if}
        </div>
        <p class="text-sm text-muted">{timeAgo()}</p>
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <span
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {categoryInfo().color} text-white"
      >
        {categoryInfo().name}
      </span>
      {#if post.solved}
        <span
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >✓ Resuelto</span
        >
      {/if}
    </div>
  </div>

  <div class="mb-4">
    <h2
      class="text-lg font-semibold text-foreground mb-2 hover:text-primary cursor-pointer"
    >
      {post.title}
    </h2>
    <p class="text-muted line-clamp-2">
      {post.content}
    </p>
  </div>

  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-1 text-muted">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          ></path></svg
        >
        <span class="text-sm font-medium">{post.votes ?? 0}</span>
      </div>
      <div class="flex items-center space-x-1 text-muted">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          ></path></svg
        >
        <span class="text-sm">{post.answers?.length ?? 0} respuestas</span>
      </div>
    </div>
    <div class="flex flex-wrap gap-1">
      {#each post.tags || [] as tag}
        <span
          class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground"
          >#{tag}</span
        >
      {/each}
    </div>
  </div>
</div>
