<script>
    // Este componente recibe el bloque de código como prop
    let { block } = $props();
</script>

<div class="bg-gray-900 rounded-lg my-4 overflow-hidden">
    <div class="bg-gray-700 px-4 py-2 text-xs text-gray-300 font-mono">
        Ejemplo ({block.language})
    </div>
    <pre class="p-4 text-sm text-white overflow-x-auto"><code
            >{@html block.code}</code
        ></pre>
</div>
