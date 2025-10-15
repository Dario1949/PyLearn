<script>
  import { onMount } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import CodeEditor from "$lib/components/challenges/VSCodeEditor.svelte";

  import { showToast } from '$lib/store/toast.js';

  // Props que el componente recibe desde la página
  export let challenge;
  export let onClose;
  export let onComplete;

  // Estado interno del componente
  let code = challenge.code || "";
  let output = "";
  let isRunning = false;
  let isCorrect = false;
  let timeLeft = challenge.timeLimit ? challenge.timeLimit * 60 : null;
  let timer = null;

  // --- Propiedades Computadas para Formatear los Datos ---

  // 1. Separa la descripción en párrafos para una mejor lectura
  $: formattedDescription = challenge.description?.split("\n").filter((p) => p.trim() !== "") || [];

  // 2. Limpia los casos de prueba para que se vean como "Entrada -> Salida"
  $: parsedTestCases = (() => {
    console.log('Challenge completo:', challenge);
    
    // Usar test_cases (snake_case) que es como viene de la base de datos
    let testCases = challenge.test_cases || challenge.testCases;
    console.log('testCases raw:', testCases);
    console.log('Tipo de testCases:', typeof testCases);
    
    // Si testCases es un string, intentar parsearlo como JSON
    if (typeof testCases === 'string') {
      try {
        testCases = JSON.parse(testCases);
        console.log('testCases parseados:', testCases);
      } catch (e) {
        console.error('Error parseando testCases:', e);
        return [];
      }
    }
    
    if (!Array.isArray(testCases)) {
      console.log('testCases no es un array:', testCases);
      return [];
    }
    
    return testCases.map((tc) => {
      const inputMatch = tc.input?.match(/(\[\[.*\]\])/);
      return {
        input: inputMatch ? inputMatch[1] : tc.input,
        expectedOutput: tc.expectedOutput,
      };
    });
  })();

  // --- Lógica del Componente ---

  // Inicia el temporizador cuando el componente se monta
  onMount(() => {
    if (timeLeft) {
      timer = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft = timeLeft - 1;
        } else {
          clearInterval(timer);
          output = "¡Se acabó el tiempo!";
          isRunning = true; // Deshabilita los botones
        }
      }, 1000);
    }

    // Limpia el intervalo cuando el componente se destruye para evitar fugas de memoria
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  // Formatea el tiempo restante de segundos a MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Llama al endpoint de IA para verificar el código del usuario
  async function runCode() {
    isRunning = true;
    output = "Analizando tu código con IA...";
    isCorrect = false;

    try {
      const response = await fetch("/api/challenges/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: challenge, // Enviamos el objeto completo del reto
          userCode: code, // Y el código actual del usuario
        }),
      });

      const data = await response.json();

      if (data.success) {
        isCorrect = data.verification.isCorrect;
        output = data.verification.feedback;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      output = `Error al verificar: ${error.message}`;
    } finally {
      isRunning = false;
    }
  }

  // Llama a la función 'onComplete' de la página padre cuando la solución es correcta
  function submitSolution() {
    if (isCorrect) {
      console.log('submitSolution llamado, challenge.id:', challenge.id);
      showToast(`¡Reto completado! Has ganado ${challenge.points} puntos.`, 'success');
      console.log('Llamando onComplete con:', challenge.id);
      onComplete(challenge.id);
    } else {
      console.log('submitSolution llamado pero isCorrect es false');
    }
  }

  // Llama a la función 'onClose' de la página padre
  function handleClose() {
    if (timer) clearInterval(timer);
    onClose();
  }
</script>

<div
  class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  on:keydown={(e) => e.key === "Escape" && handleClose()}
>
  <div
    class="bg-card rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
    role="document"
  >
    <div class="p-5 border-b border-border flex-shrink-0">
      <div class="flex items-start justify-between">
        <div>
          <h2
            class="text-2xl font-bold text-card-foreground"
            style="font-family: 'Montserrat', sans-serif;"
          >
            {challenge.title}
          </h2>
          <div class="flex items-center space-x-4 mt-2 text-sm text-muted">
            <span>📂 {challenge.category}</span>
            <span>⭐ {challenge.points} puntos</span>
            {#if timeLeft !== null}
              <span
                class="font-medium tabular-nums {timeLeft < 60
                  ? 'text-red-500'
                  : 'text-muted'}"
              >
                ⏱️ {formatTime(timeLeft)}
              </span>
            {/if}
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          on:click={handleClose}
          class="p-2 -m-2 text-muted hover:text-foreground hover:bg-accent rounded-full transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="p-6 flex-1 overflow-y-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-card-foreground mb-3">
              Descripción del Problema
            </h3>
            <div class="text-muted space-y-4 leading-relaxed">
              {#each formattedDescription as paragraph}
                <p>
                  {@html paragraph.replace(
                    /`([^`]+)`/g,
                    '<code class="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
                  )}
                </p>
              {/each}
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-card-foreground mb-3">
              Ejemplos y Casos de Prueba:
            </h4>
            <div class="space-y-4">
              {#each parsedTestCases as testCase, index}
                <div class="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p class="text-sm font-medium mb-2">Ejemplo {index + 1}</p>
                  <div class="font-mono text-xs space-y-2">
                    <div>
                      <span class="text-primary font-semibold">Entrada:</span>
                      <pre
                        class="whitespace-pre-wrap bg-background/30 p-2 rounded mt-1 text-muted-foreground">{testCase.input}</pre>
                    </div>
                    <div>
                      <span class="text-green-500 font-semibold"
                        >Salida Esperada:</span
                      >
                      <pre
                        class="whitespace-pre-wrap bg-background/30 p-2 rounded mt-1 text-muted-foreground">{testCase.expectedOutput}</pre>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <h3 class="text-lg font-semibold text-card-foreground mb-3">
            Tu Solución
          </h3>
          <div class="flex-grow min-h-[250px] mb-4">
            <CodeEditor bind:code />
          </div>

          <div class="flex items-center space-x-2">
            <Button type="button" on:click={runCode} disabled={isRunning}>
              {#if isRunning}
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analizando...
              {:else}
                ▶️ Ejecutar Código
              {/if}
            </Button>

            {#if isCorrect}
              <Button
                type="button"
                on:click={submitSolution}
                variant="secondary"
                aria-label="Enviar Solución"
              >
                🎉 Enviar Solución
              </Button>
            {/if}
          </div>

          {#if output}
            <div class="mt-4">
              <h4 class="text-sm font-medium text-card-foreground mb-2">
                Análisis de la IA:
              </h4>
              <div
                class="bg-muted/50 rounded-lg p-3 text-sm {isCorrect
                  ? 'border border-primary/20 bg-primary/5'
                  : 'border border-destructive/20 bg-destructive/5'}"
              >
                <pre class="whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
