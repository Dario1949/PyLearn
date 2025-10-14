<script>
    import { onMount } from 'svelte';
    // Importación CORRECTA con llaves
    import { marked } from 'marked';
    import CodeBlock from './CodeBlock.svelte';

    let { content } = $props();

    let renderedHtml = '';

    const renderer = {
        code(code, lang) {
            return `
                <CodeBlock block={{ language: '${lang}', code: \`${code}\` }} />
            `;
        }
    };

    marked.use({ renderer });

    onMount(() => {
        renderedHtml = marked(content);
    });
</script>

<div>
    {@html renderedHtml}
</div>