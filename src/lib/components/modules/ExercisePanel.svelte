<script>
  import CodeEditor from './CodeEditor.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let { exercise } = $props();
  
  let code = $state(exercise.initialCode);
  let output = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let isCorrect = $state(false);

  function runCode() {
    try {
      // Simple code execution simulation
      if (code.includes('print(')) {
        const match = code.match(/print$$["'](.+?)["']$$/);
        if (match) {
          output = match[1];
          
          // Check if solution is correct
          if (code.trim().includes(exercise.solution.trim())) {
            isCorrect = true;
            output += '\n\n✅ ¡Correcto! Has completado el ejercicio.';
          }
        }
      } else {
        output = 'Ejecutado correctamente (sin salida visible)';
      }
    } catch (error) {
      output = `Error: ${error.message}`;
    }
  }

  function resetCode() {
    code = exercise.initialCode;
    output = '';
    isCorrect = false;
    showSolution = false;
  }

  function toggleHint() {
    showHint = !showHint;
  }

  function toggleSolution() {
    showSolution = !showSolution;
    if (showSolution) {
      code = exercise.solution;
    }
  }
</script>

<div class="bg-card rounded-xl border border-border overflow-hidden">
  <!-- Exercise Header -->
  <div class="p-6 pb-4 border-b border-border">
    <h3 class="text-lg font-semibold text-card-foreground mb-2" style="font-family: 'Montserrat', sans-serif;">
      🎯 {exercise.title}
    </h3>
    <p class="text-muted text-sm">
      {exercise.description}
    </p>
  </div>

  <!-- Code Editor -->
  <div class="p-6 pt-4">
    <CodeEditor bind:code />
    
    <!-- Action Buttons -->
    <div class="flex items-center space-x-2 mt-4">
      <Button onclick={runCode} size="sm">
        ▶️ Ejecutar
      </Button>
      <Button onclick={resetCode} variant="outline" size="sm">
        🔄 Reiniciar
      </Button>
      <Button onclick={toggleHint} variant="ghost" size="sm">
        💡 Pista
      </Button>
      <Button onclick={toggleSolution} variant="ghost" size="sm">
        👁️ Solución
      </Button>
    </div>

    <!-- Hint -->
    {#if showHint}
      <div class="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
        <p class="text-sm text-secondary">
          💡 <strong>Pista:</strong> {exercise.hint}
        </p>
      </div>
    {/if}

    <!-- Output -->
    {#if output}
      <div class="mt-4">
        <h4 class="text-sm font-medium text-card-foreground mb-2">Salida:</h4>
        <div class="bg-muted/10 rounded-lg p-3 font-mono text-sm {isCorrect ? 'border border-primary/20 bg-primary/5' : ''}">
          <pre class="whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    {/if}

    <!-- Success Message -->
    {#if isCorrect}
      <div class="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div class="flex items-center space-x-2">
          <span class="text-2xl">🎉</span>
          <div>
            <h4 class="font-semibold text-primary">¡Excelente trabajo!</h4>
            <p class="text-sm text-muted">Has completado este ejercicio correctamente. +50 puntos</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
