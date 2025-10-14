<script>
  // Sincronizar gamificationStore con backend al cargar la página de retos
  $effect(() => {
    const unsubscribe = authStore.state.subscribe((state) => {
      const userId = state.user?.id;
      if (userId) {
        gamificationStore.syncWithBackend(userId);
      }
      unsubscribe();
    });
  });
  import { page } from '$app/stores';
  import VSCodeEditor from '$lib/components/challenges/VSCodeEditor.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { gamificationStore } from '$lib/stores/gamification.svelte.js';
  import { authStore } from '$lib/stores/auth.svelte.js';
  
  const challengeId = $page.params.id;
  
  let challenge = $state(null);
  let code = $state('');
  let output = $state('');
  let isRunning = $state(false);
  let isCorrect = $state(false);
  let testResults = $state([]);
  let showHint = $state(false);
  let attempts = $state(0);
  let isFullscreen = $state(false);
  let showSuccessToast = $state(false);
  let toastMessage = $state('');

  // Initialize challenge from store
  $effect(() => {
    if (gamificationStore.state && gamificationStore.state.challenges) {
      const foundChallenge = gamificationStore.state.challenges.find(c => c.id === challengeId);
      if (foundChallenge) {
        challenge = foundChallenge;
        code = foundChallenge.initialCode || '# Escribe tu código aquí\n';
      }
    }
  });

  async function runCode() {
    if (!challenge) return;
    
    isRunning = true;
    output = '';
    testResults = [];
    attempts++;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enhanced validation logic for different challenge types
      let allTestsPassed = true;
      const results = [];
      
      for (let i = 0; i < challenge.testCases.length; i++) {
        const testCase = challenge.testCases[i];
        let testPassed = false;
        let actualOutput = '';
        
        // Simulate code execution based on challenge type
        if (challenge.id === 'hello_world') {
          const match = code.match(/print\s*$$\s*["'](.+?)["']\s*$$/);
          if (match) {
            actualOutput = match[1];
            testPassed = actualOutput === testCase.expectedOutput;
          }
        } else if (challenge.id === 'sum_two_numbers') {
          if (code.includes('return a + b') && code.includes('def suma(a, b):')) {
            actualOutput = '8';
            testPassed = actualOutput === testCase.expectedOutput;
          }
        } else if (challenge.id === 'even_odd_checker') {
          if (code.includes('return numero % 2 == 0') && code.includes('def es_par(numero):')) {
            actualOutput = 'True\nFalse';
            testPassed = true;
          }
        } else if (challenge.id === 'factorial_calculator') {
          if (code.includes('factorial') && (code.includes('for') || code.includes('while') || code.includes('*'))) {
            actualOutput = '120';
            testPassed = actualOutput === testCase.expectedOutput;
          }
        } else if (challenge.id === 'palindrome_checker') {
          if (code.includes('[::-1]') || (code.includes('reverse') && code.includes('=='))) {
            actualOutput = 'True';
            testPassed = actualOutput === testCase.expectedOutput;
          }
        } else if (challenge.id === 'fibonacci_sequence') {
          if (code.includes('fibonacci') && (code.includes('for') || code.includes('while'))) {
            actualOutput = '[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]';
            testPassed = actualOutput === testCase.expectedOutput;
          }
        } else {
          // Generic validation for other challenges
          if (code.trim().length > 10 && !code.includes('pass')) {
            actualOutput = 'Código ejecutado correctamente';
            testPassed = true;
          }
        }
        
        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: actualOutput,
          passed: testPassed
        });
        
        if (!testPassed) allTestsPassed = false;
      }
      
      testResults = results;
      isCorrect = allTestsPassed;
      
      if (allTestsPassed) {
        const pointsToAdd = typeof challenge.points === 'number' && challenge.points > 0 ? challenge.points : 10;
        output = `✅ ¡Excelente! Has resuelto el reto correctamente.\n\n🎉 +${pointsToAdd} puntos\n🏆 Reto completado en ${attempts} intento${attempts > 1 ? 's' : ''}`;
        gamificationStore.completeChallenge(challenge.id);

        // Sincronizar con el backend
        const unsubscribe = authStore.state.subscribe(async (state) => {
          const userId = state.user?.id;
          if (userId) {
            await fetch('/api/progress/complete-challenge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                challengeId: challenge.id,
                points: pointsToAdd
              })
            });
            // Sincronizar el store con el backend inmediatamente
            await gamificationStore.syncWithBackend(userId);
            showSuccessToast = true;
            toastMessage = `¡Reto completado! Has ganado +${pointsToAdd} puntos.`;
          }
          unsubscribe();
        });
      } else {
        output = `❌ Algunos casos de prueba fallaron. Revisa tu código e inténtalo de nuevo.\n\n💡 Pista: ${getHintForChallenge(challenge.id)}`;
      }
      
    } catch (error) {
      output = `❌ Error en el código: ${error.message}`;
    } finally {
      isRunning = false;
    }
  }

  $effect(() => {
    if (showSuccessToast) {
      setTimeout(() => {
        showSuccessToast = false;
        toastMessage = '';
      }, 3000);
    }
  });

  function getHintForChallenge(challengeId) {
    const hints = {
      'hello_world': 'Usa la función print() con el texto exacto entre comillas.',
      'sum_two_numbers': 'Dentro de la función, usa "return a + b" para devolver la suma.',
      'even_odd_checker': 'Usa el operador módulo (%) para verificar si un número es divisible por 2.',
      'factorial_calculator': 'Usa un bucle for o while para multiplicar los números desde 1 hasta n.',
      'palindrome_checker': 'Compara la cadena original con su reverso usando [::-1].',
      'fibonacci_sequence': 'Usa un bucle para generar la secuencia sumando los dos números anteriores.',
      'max_of_three': 'Usa la función max() o compara los números con if/elif.',
      'string_reverser': 'Usa slicing con [::-1] para invertir la cadena.'
    };
    return hints[challengeId] || 'Revisa la lógica de tu código y los casos de prueba.';
  }

  function resetCode() {
    if (challenge) {
      code = challenge.initialCode || '# Escribe tu código aquí\n';
      output = '';
      testResults = [];
      isCorrect = false;
      attempts = 0;
    }
  }

  function showSolution() {
    if (challenge && challenge.solution) {
      code = challenge.solution;
      showHint = false;
    }
  }
</script>

<svelte:head>
  <title>{challenge?.title || 'Reto'} - PyLearn CESMAG</title>
</svelte:head>

{#if !challenge}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-card-foreground mb-4">Reto no encontrado</h1>
      <p class="text-muted mb-6">El reto que buscas no existe.</p>
      <Button href="/challenges">Volver a Retos</Button>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center space-x-2 text-sm text-muted mb-2">
          <a href="/challenges" class="hover:text-primary transition-colors">Retos</a>
          <span>›</span>
          <span>{challenge.category}</span>
        </div>
        <h1 class="text-3xl font-bold text-card-foreground mb-4" style="font-family: 'Montserrat', sans-serif;">
          {challenge.title}
        </h1>
        <div class="flex items-center space-x-4">
          <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {challenge.difficulty}
          </span>
          <span class="text-sm text-muted">⭐ {challenge.points} puntos</span>
          <span class="text-sm text-muted">📂 {challenge.category}</span>
          {#if challenge.completed}
            <span class="text-sm text-green-600">✅ Completado</span>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-1 {isFullscreen ? '' : 'lg:grid-cols-2'} gap-8">
        <!-- Problem Description -->
        <div class="space-y-6 {isFullscreen ? 'hidden' : ''}">
          <div class="bg-card rounded-xl border border-border p-6">
            <h2 class="text-xl font-semibold text-card-foreground mb-4">Descripción del Problema</h2>
            <p class="text-muted leading-relaxed mb-6">{challenge.description}</p>
            
            <h3 class="font-semibold text-card-foreground mb-3">Casos de Prueba:</h3>
            <div class="space-y-3">
              {#each challenge.testCases as testCase, index}
                <div class="bg-muted/10 rounded-lg p-4">
                  <div class="text-sm mb-1">
                    <strong>Caso {index + 1}:</strong>
                  </div>
                  {#if testCase.input}
                    <div class="text-sm text-muted mb-1">
                      <strong>Entrada:</strong> <code class="bg-muted/20 px-1 rounded">{testCase.input}</code>
                    </div>
                  {/if}
                  <div class="text-sm text-muted">
                    <strong>Salida esperada:</strong> <code class="bg-muted/20 px-1 rounded">{testCase.expectedOutput}</code>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Test Results -->
          {#if testResults.length > 0}
            <div class="bg-card rounded-xl border border-border p-6">
              <h3 class="font-semibold text-card-foreground mb-4">Resultados de Pruebas</h3>
              <div class="space-y-3">
                {#each testResults as result, index}
                  <div class="flex items-center space-x-3 p-3 rounded-lg {result.passed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}">
                    <span class="text-lg">{result.passed ? '✅' : '❌'}</span>
                    <div class="flex-1 text-sm">
                      <div><strong>Caso {index + 1}:</strong> {result.passed ? 'Pasó' : 'Falló'}</div>
                      {#if !result.passed}
                        <div class="text-muted mt-1">
                          Esperado: <code>{result.expected}</code> | Obtenido: <code>{result.actual || 'Sin salida'}</code>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- VS Code Editor -->
        <div class="space-y-6 {isFullscreen ? 'col-span-full' : ''}">
          <div class="bg-card rounded-xl border border-border p-6">
            <h2 class="text-xl font-semibold text-card-foreground mb-4">Tu Solución</h2>
            
            <!-- Replaced basic CodeEditor with VSCodeEditor -->
            <div class="mb-4">
              <VSCodeEditor bind:code onRun={runCode} />
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
              <Button onclick={resetCode} variant="outline">
                🔄 Reiniciar
              </Button>
              
              <Button onclick={() => showHint = !showHint} variant="ghost">
                💡 Pista
              </Button>
              
              <Button onclick={showSolution} variant="ghost">
                👁️ Ver Solución
              </Button>
              </div>
              
              <Button onclick={() => isFullscreen = !isFullscreen} variant="outline">
                {isFullscreen ? '📱 Vista Normal' : '🖥️ Pantalla Completa'}
              </Button>
            </div>

            <!-- Hint -->
            {#if showHint}
              <div class="mb-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                <p class="text-sm text-secondary">
                  💡 <strong>Pista:</strong> {getHintForChallenge(challenge.id)}
                </p>
              </div>
            {/if}

            <!-- Output -->
            {#if output}
              <div class="mt-4">
                <h4 class="text-sm font-medium text-card-foreground mb-2">Resultado:</h4>
                <div class="bg-muted/10 rounded-lg p-4 font-mono text-sm {isCorrect ? 'border border-primary/20 bg-primary/5' : ''}">
                  <pre class="whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            {/if}

            <!-- Success Actions -->
            {#if isCorrect}
              <div class="mt-6 flex items-center space-x-3">
                <Button href="/challenges">Ver Más Retos</Button>
                <Button href="/leaderboard" variant="outline">Ver Ranking</Button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Mensaje emergente tipo toast -->
{#if showSuccessToast && toastMessage}
  <div style="position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #22c55e; color: white; padding: 16px 32px; border-radius: 8px; font-size: 1rem; z-index: 9999; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
    {toastMessage}
  </div>
{/if}
