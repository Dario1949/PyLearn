<script>
  import Button from '$lib/components/ui/Button.svelte';
  import FeatureCard from '$lib/components/FeatureCard.svelte';
  import TestimonialCard from '$lib/components/TestimonialCard.svelte';
</script>

<svelte:head>
  <title>PyLearn CESMAG - Aprende Python Jugando</title>
  <meta name="description" content="Plataforma gamificada de aprendizaje de Python para estudiantes de primer semestre de la Universidad CESMAG" />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-card to-background py-20 overflow-hidden">
  <div class="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200')] opacity-5"></div>
  
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div class="text-center lg:text-left">
        <h1 class="text-4xl md:text-6xl font-black text-foreground mb-6 animate-bounce-in" style="font-family: 'Montserrat', sans-serif;">
          Aprende Python
          <span class="text-primary">Jugando</span>
        </h1>
        <p class="text-xl text-muted mb-8 max-w-2xl">
          La plataforma gamificada diseñada especialmente para estudiantes de primer semestre de la Universidad CESMAG. 
          Domina Python desde cero con retos interactivos, insignias y competencias amigables.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <Button size="lg" href="/auth/register" class="text-lg px-8 py-4">
            ¡Comenzar a Aprender Ahora!
          </Button>
          <Button variant="outline" size="lg" href="#features" class="text-lg px-8 py-4">
            Ver Características
          </Button>
        </div>
        
        <!-- Stats -->
        <div class="flex justify-center lg:justify-start gap-8 mt-12">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">500+</div>
            <div class="text-sm text-muted">Estudiantes</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">12</div>
            <div class="text-sm text-muted">Módulos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">100+</div>
            <div class="text-sm text-muted">Retos</div>
          </div>
        </div>
      </div>
      
      <div class="text-center lg:text-right animate-float">
        <div class="text-4xl md:text-5xl font-black text-primary mb-2" style="font-family: 'Montserrat', sans-serif;">
          PYLEARN
        </div>
        <div class="text-6xl md:text-8xl font-black text-primary/20 mb-4" style="font-family: 'Montserrat', sans-serif;">
          CESMAG
        </div>
        <div class="text-2xl md:text-3xl font-bold text-foreground mb-6">
          🐍 Domina Python desde Cero
        </div>
        <div class="text-lg text-muted italic">
          "La programación es el lenguaje del futuro,<br>
          y el futuro comienza hoy"
        </div>
      </div>
    </div>
  </div>
</section>

<!-- What is this Section -->
<section class="py-20 bg-background">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
        ¿Qué es PyLearn CESMAG?
      </h2>
      <p class="text-xl text-muted max-w-3xl mx-auto">
        Una plataforma innovadora que transforma el aprendizaje de programación en una experiencia divertida y motivadora, 
        diseñada específicamente para estudiantes de primer semestre de la Universidad CESMAG.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-foreground mb-2">Aprendizaje Desde Cero</h3>
        <p class="text-muted">Diseñado para principiantes absolutos. No necesitas experiencia previa en programación.</p>
      </div>

      <div class="text-center p-6">
        <div class="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-foreground mb-2">Gamificación Motivadora</h3>
        <p class="text-muted">Gana puntos, desbloquea insignias y compite sanamente con tus compañeros de clase.</p>
      </div>

      <div class="text-center p-6">
        <div class="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-foreground mb-2">Seguimiento Docente</h3>
        <p class="text-muted">Los profesores pueden monitorear el progreso y brindar apoyo personalizado.</p>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 bg-card">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-card-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
        Características Principales
      </h2>
      <p class="text-xl text-muted max-w-3xl mx-auto">
        Descubre todas las herramientas que hacen de PyLearn CESMAG la mejor opción para aprender Python
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <FeatureCard
        icon="📚"
        title="Módulos Interactivos"
        description="Lecciones prácticas con ejemplos reales y ejercicios guiados paso a paso."
      />
      
      <FeatureCard
        icon="🎯"
        title="Retos de Programación"
        description="Desafíos progresivos que ponen a prueba tus habilidades de forma divertida."
      />
      
      <FeatureCard
        icon="🏆"
        title="Sistema de Recompensas"
        description="Gana puntos, insignias y reconocimientos por cada logro alcanzado."
      />
      
      <FeatureCard
        icon="📊"
        title="Tabla de Clasificación"
        description="Compite sanamente con tus compañeros y ve tu progreso en tiempo real."
      />
    </div>
  </div>
</section>

<!-- Testimonials Section -->
<section class="py-20 bg-background">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6" style="font-family: 'Montserrat', sans-serif;">
        Lo que Dicen Nuestros Estudiantes
      </h2>
      <p class="text-xl text-muted max-w-3xl mx-auto">
        Conoce las experiencias de estudiantes que ya están aprendiendo con PyLearn CESMAG
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <TestimonialCard
        name="María González"
        program="Ingeniería de Sistemas - 1er Semestre"
        quote="Nunca pensé que programar pudiera ser tan divertido. Los retos me mantienen motivada y siempre quiero seguir aprendiendo más."
        avatar="/placeholder.svg?height=60&width=60"
      />
      
      <TestimonialCard
        name="Carlos Rodríguez"
        program="Ingeniería de Software - 1er Semestre"
        quote="La gamificación hace que cada clase sea emocionante. Ver mi progreso en el ranking me motiva a esforzarme más cada día."
        avatar="/placeholder.svg?height=60&width=60"
      />
      
      <TestimonialCard
        name="Ana Martínez"
        program="Tecnología en Sistemas - 1er Semestre"
        quote="Los módulos están muy bien explicados y los ejercicios son perfectos para practicar. ¡Ya no le tengo miedo a la programación!"
        avatar="/placeholder.svg?height=60&width=60"
      />
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-primary text-primary-foreground">
  <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl md:text-4xl font-bold mb-6" style="font-family: 'Montserrat', sans-serif;">
      ¿Listo para Comenzar tu Aventura en Python?
    </h2>
    <p class="text-xl mb-8 opacity-90">
      Únete a cientos de estudiantes de CESMAG que ya están dominando Python de forma divertida y efectiva.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="secondary" size="lg" href="/auth/register" class="text-lg px-8 py-4">
        Registrarse Gratis
      </Button>
      <Button variant="outline" size="lg" href="/demo" class="text-lg px-8 py-4 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
        Ver Demo
      </Button>
    </div>
  </div>
</section>
