<script>
  let { content } = $props();
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <div class="prose prose-sm max-w-none">
    {@html content}
  </div>
</div>
