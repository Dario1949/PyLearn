<script>
  // ✅ ÚNICA llamada a $props()
  let {
    modules = [],
    streak = 0,
    progressPercent = null, // si viene del padre lo usamos tal cual
    completedModules = [], // ids de módulos completados
    points = 0,
    level = 1,
  } = $props();

  // Derivados (runes): invocar como funciones en el template
  const all = $derived(() => (Array.isArray(modules) ? modules : []));
  const done = $derived(() =>
    Array.isArray(completedModules) ? completedModules : []
  );

  const pct = $derived(() => {
    const p = Number(progressPercent);
    console.log('ProgressOverview - progressPercent:', progressPercent, 'modules:', modules.length, 'completed:', completedModules.length);
    if (Number.isFinite(p) && p > 0) return Math.max(1, Math.min(100, Math.round(p)));
    if (all().length > 0) {
      const calculated = Math.round((done().length / all().length) * 100);
      console.log('ProgressOverview - calculated:', calculated);
      return Math.max(calculated > 0 ? calculated : 1, calculated);
    }
    return 1; // Mínimo 1% para que la barra sea visible
  });
</script>

<div class="bg-card rounded-xl p-6 border border-border">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-card-foreground">Progreso General</h2>
    <span class="text-sm text-muted">Racha: {streak} días</span>
  </div>

  <div class="w-full bg-muted/20 rounded-full h-3 mb-2">
    <div
      class="bg-primary h-3 rounded-full transition-all duration-300"
      style="width: {pct()}%"
    ></div>
  </div>
  <div class="flex justify-between text-sm text-muted mb-4">
    <span>{done().length} / {all().length} módulos</span>
    <span>{pct()}%</span>
  </div>

  <div class="grid grid-cols-2 gap-4 text-center">
    <div class="bg-background rounded-lg p-3 border border-border">
      <div class="text-2xl font-bold text-primary">{points}</div>
      <div class="text-xs text-muted">Puntos</div>
    </div>
    <div class="bg-background rounded-lg p-3 border border-border">
      <div class="text-2xl font-bold text-secondary">{level}</div>
      <div class="text-xs text-muted">Nivel</div>
    </div>
  </div>
</div>
