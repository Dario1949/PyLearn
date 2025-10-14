<script>
  let { 
    options = [],
    value = $bindable(''),
    placeholder = 'Seleccionar...',
    class: className = '',
    required = false,
    disabled = false,
    ...props 
  } = $props();

  const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const classes = `${baseClasses} ${className}`;
</script>

<select
  bind:value
  {required}
  {disabled}
  class={classes}
  {...props}
>
  {#if placeholder}
    <option value="" disabled>{placeholder}</option>
  {/if}
  {#each options as option}
    <option value={option}>{option}</option>
  {/each}
</select>
