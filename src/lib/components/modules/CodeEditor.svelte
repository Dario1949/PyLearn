<script>
  let { code = $bindable('') } = $props();
  
  let textareaRef;
  
  function handleKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      
      // Insert tab character
      code = code.substring(0, start) + '    ' + code.substring(end);
      
      // Move cursor
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = start + 4;
      }, 0);
    }
  }
</script>

<div class="relative">
  <div class="absolute top-2 right-2 text-xs text-muted bg-background px-2 py-1 rounded">
    Python
  </div>
  <textarea
    bind:this={textareaRef}
    bind:value={code}
    onkeydown={handleKeyDown}
    class="w-full h-48 p-4 bg-muted/5 border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    placeholder="Escribe tu código aquí..."
    spellcheck="false"
  ></textarea>
</div>

<style>
  textarea {
    tab-size: 4;
  }
</style>
