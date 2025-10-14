import { visit } from 'unist-util-visit';

function customCodeBlock() {
    return (tree) => {
        visit(tree, 'code', (node) => {
            // Reemplaza el nodo 'code' con un nodo 'html'
            // que contiene tu componente Svelte.
            node.type = 'html';
            node.value = `
        <CodeBlock block={{ language: '${node.lang}', code: \`${node.value}\` }} />
      `;
        });
    };
}

export default customCodeBlock;