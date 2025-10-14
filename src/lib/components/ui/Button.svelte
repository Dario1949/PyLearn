<script>
  let {
    variant = "default",
    size = "default",
    href = null,
    class: className = "",
    children,
    ...props
  } = $props();

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
</script>

{#if href}
  <a {href} class={classes} {...props}>
    {#if children}
      {@render children()}
    {/if}
  </a>
{:else}
  <button class={classes} {...props} on:click>
    {#if children}
      {@render children()}
    {/if}
  </button>
{/if}
