<script>
  import { goto, invalidateAll } from "$app/navigation";
  import { authStore } from "$lib/stores/auth.svelte.js";
  import Button from "$lib/components/ui/Button.svelte";
  import ForumPost from "$lib/components/forum/ForumPost.svelte";
  import CreatePostModal from "$lib/components/forum/CreatePostModal.svelte";

  // 1. Datos reales del cargador y sesión del usuario
  let { data } = $props();
  const authState = authStore.state;
  const user = $derived($authState.user);
  const isLoadingAuth = $derived($authState.isLoading);

  $effect(() => {
    if (!isLoadingAuth && !user) {
      goto("/auth/login");
    }
  });

  // 2. Estado de la UI
  let posts = $state(data.posts || []);
  let selectedCategory = $state("all");
  let searchQuery = $state("");
  let showCreateModal = $state(false);
  let verifyingAnswerId = $state(null); // Estado para el spinner de verificación

  // 3. Lógica reactiva para filtrar los posts
  const filteredPosts = $derived(() => {
    return posts.filter((post) => {
      const categoryMatch =
        selectedCategory === "all" ||
        post.category.toLowerCase() === selectedCategory;
      const searchMatch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return categoryMatch && searchMatch;
    });
  });

  // 4. Estadísticas reactivas para los contadores
  const forumStats = $derived(() => {
    const solved = posts.filter((p) => p.solved).length ?? 0;
    const replies =
      posts.reduce((sum, p) => sum + (p.answers?.length || 0), 0) ?? 0;
    return {
      total: posts.length,
      solved,
      replies,
    };
  });

  // 5. Funciones para interactuar con la API
  async function askQuestion(postData) {
    if (!user) return;
    
    console.log('Enviando datos:', { ...postData, authorId: user.id });
    
    try {
      const response = await fetch("/api/forum/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...postData, authorId: user.id }),
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (result.success && result.question) {
        console.log('Posts antes:', posts.length);
        console.log('Nueva pregunta:', result.question);
        
        // Agregar la nueva pregunta al estado local inmediatamente
        posts = [result.question, ...posts];
        
        console.log('Posts después:', posts.length);
        
        alert("¡Pregunta publicada! Has ganado 5 puntos.");
        showCreateModal = false;
        
        // Recargar datos del servidor
        setTimeout(async () => {
          await invalidateAll();
        }, 100);
      } else {
        console.error('Error en respuesta:', result);
        alert(result.error || "Error al publicar la pregunta");
      }
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      alert("Error al publicar la pregunta.");
    }
  }

  async function answerQuestion(questionId, content, formElement) {
    if (!user || !content.trim()) return;
    try {
      const response = await fetch("/api/forum/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          authorId: user.id,
          content,
        }),
      });
      if (!response.ok) throw new Error("No se pudo enviar la respuesta.");
      alert("¡Respuesta enviada! Has ganado 5 puntos.");
      formElement.reset();
      await invalidateAll();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  async function verifyAnswer(question, answer) {
    if (!user) return;
    verifyingAnswerId = answer.id;
    try {
      const response = await fetch("/api/forum/verify-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.isCorrect) {
        alert(
          "¡Respuesta verificada como correcta! El autor ha ganado 15 puntos extra."
        );
        await invalidateAll();
      } else {
        alert(
          "La IA ha determinado que esta respuesta no es del todo correcta."
        );
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      verifyingAnswerId = null;
    }
  }

  async function closeQuestion(questionId) {
    if (!user) return;
    try {
      const response = await fetch("/api/forum/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      alert(result.closed ? "Pregunta cerrada" : "Pregunta reabierta");
      await invalidateAll();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  async function deleteQuestion(questionId) {
    if (!user) return;
    if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await fetch("/api/forum/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      alert("Pregunta eliminada correctamente");
      await invalidateAll();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  const categories = [
    { id: "all", name: "Todas las categorías", color: "bg-primary" },
    { id: "general", name: "General", color: "bg-blue-500" },
    { id: "variables", name: "Variables", color: "bg-green-500" },
    { id: "control", name: "Control", color: "bg-yellow-500" },
    { id: "functions", name: "Funciones", color: "bg-purple-500" },
  ];
</script>

<svelte:head>
  <title>Foro y Comunidad - PyLearn CESMAG</title>
</svelte:head>

{#if user}
  <div class="min-h-screen bg-background">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-foreground">Foro y Comunidad</h1>
            <p class="text-muted">
              Comparte conocimientos, haz preguntas y ayuda a tus compañeros
            </p>
          </div>
          <div class="flex space-x-3">
            <Button variant="outline" on:click={() => goto("/dashboard")}
              >← Dashboard</Button
            >
            <Button on:click={() => (showCreateModal = true)}
              >+ Nueva Pregunta</Button
            >
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input
              type="search"
              placeholder="Buscar en el foro por título, contenido o etiqueta..."
              bind:value={searchQuery}
              class="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each categories as category}
            <button
              on:click={() => (selectedCategory = category.id)}
              class="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-colors {selectedCategory ===
              category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
            >
              <div class="w-2 h-2 rounded-full {category.color}"></div>
              <span>{category.name}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-primary mb-1">
            {forumStats().total}
          </div>
          <p class="text-sm text-muted">Total de Posts</p>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-green-600 mb-1">
            {forumStats().solved}
          </div>
          <p class="text-sm text-muted">Resueltos</p>
        </div>
        <div class="bg-card rounded-lg p-4 border border-border text-center">
          <div class="text-2xl font-bold text-blue-600 mb-1">
            {forumStats().replies}
          </div>
          <p class="text-sm text-muted">Respuestas</p>
        </div>
      </div>

      <div class="space-y-4">
        {#if filteredPosts().length > 0}
          {#each filteredPosts() as post (post.id)}
            <div class="bg-card rounded-lg border p-6 {post.closed ? 'opacity-60' : ''}">
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <ForumPost {post} />
                </div>
                {#if user.id === post.author_id || user.role === 'admin' || user.role === 'teacher'}
                  <div class="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      on:click={() => closeQuestion(post.id)}
                    >
                      {post.closed ? '🔓 Reabrir' : '🔒 Cerrar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      on:click={() => deleteQuestion(post.id)}
                      class="bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                {/if}
              </div>
              {#if post.closed}
                <div class="bg-red-600 border border-red-700 text-white px-4 py-3 rounded-lg mb-4 text-sm font-bold shadow-md">
                  🔒 Esta pregunta está cerrada y no acepta nuevas respuestas.
                </div>
              {/if}
              <div class="border-t mt-4 pt-4 ml-8 space-y-3">
                <h4 class="font-semibold text-sm">Respuestas</h4>
                {#each post.answers as answer}
                  <div class="flex items-start space-x-3 text-sm">
                    <img
                      src={answer.author.avatar || "/placeholder.svg"}
                      alt="avatar"
                      class="w-6 h-6 rounded-full mt-1"
                    />
                    <div class="flex-1">
                      <p>
                        <strong>{answer.author.name}</strong
                        >{#if answer.isVerifiedCorrect}<span
                            class="text-green-500 ml-2 font-bold"
                            >✓ Verificada</span
                          >{/if}
                      </p>
                      <p class="text-muted">{answer.content}</p>
                    </div>
                    {#if (user.id === post.authorId || user.role !== "student") && !answer.isVerifiedCorrect}
                      <Button
                        size="sm"
                        variant="outline"
                        on:click={() => verifyAnswer(post, answer)}
                        disabled={verifyingAnswerId === answer.id}
                      >
                        {verifyingAnswerId === answer.id
                          ? "Verificando..."
                          : "Verificar con IA"}
                      </Button>
                    {/if}
                  </div>
                {:else}
                  <p class="text-xs text-muted">
                    Aún no hay respuestas. ¡Sé el primero en ayudar!
                  </p>
                {/each}
              </div>
              {#if !post.closed}
                <form
                  class="mt-4 ml-8"
                  on:submit|preventDefault={(e) => {
                    const form = e.currentTarget;
                    const content = form.elements.content.value;
                    answerQuestion(post.id, content, form);
                  }}
                >
                  <textarea
                    name="content"
                    placeholder="Escribe tu respuesta..."
                    class="w-full bg-muted p-2 rounded-md text-sm"
                  ></textarea>
                  <Button type="submit" size="sm" class="mt-2">Responder</Button>
                </form>
              {/if}
            </div>
          {/each}
        {:else}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold text-foreground mb-2">
              No se encontraron posts
            </h3>
            <p class="text-muted">
              Intenta cambiar los filtros o crear una nueva pregunta.
            </p>
            <Button class="mt-4" on:click={() => (showCreateModal = true)}
              >Crear Primera Pregunta</Button
            >
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if showCreateModal}
    <CreatePostModal
      {categories}
      onClose={() => (showCreateModal = false)}
      on:submit={(e) => askQuestion(e.detail)}
    />
  {/if}
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted">Cargando foro...</p>
    </div>
  </div>
{/if}
