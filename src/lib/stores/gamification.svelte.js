import { writable } from "svelte/store"

class GamificationStore {
  async syncWithBackend(userId) {
    try {
      // Resetear el estado primero
      this.store.update((state) => {
        state.badges.forEach((b) => {
          b.earned = false;
          delete b.earnedDate;
        });
        return state;
      });
      
      const res = await fetch(`/api/progress/${userId}`);
      const data = await res.json();
      if (data.success && data.progress) {
        this.store.update((state) => ({
          ...state,
          points: data.progress.points ?? state.points,
          level: data.progress.level ?? state.level,
          streak: data.progress.streak ?? state.streak,
        }));
      }
      
      // Sincronizar insignias de la tienda
      const storeRes = await fetch('/api/store/me');
      const storeData = await storeRes.json();
      if (storeData.success && storeData.unlocked) {
        this.store.update((state) => {
          // Resetear todas las insignias primero
          state.badges.forEach((b) => {
            b.earned = false;
            delete b.earnedDate;
          });
          
          // Marcar como obtenidas solo las del usuario actual
          const unlockedFromStore = new Set(storeData.unlocked);
          state.badges.forEach((b) => {
            if (unlockedFromStore.has(b.id)) {
              b.earned = true;
              b.earnedDate = new Date().toISOString().split('T')[0];
            }
          });
          return state;
        });
      }
    } catch (e) {
      console.error('Error sincronizando gamificationStore:', e);
    }
  }
  constructor() {
    this.store = writable({
      points: 0,
      level: 3,
      streak: 7,
      badges: this.initializeBadges(),
      achievements: this.initializeAchievements(),
      challenges: this.initializeChallenges(),
      leaderboardPosition: 3,
    })
  }

  initializeBadges() {
    return [
      {
        id: "first_steps",
        name: "Primeros Pasos",
        description: "Completa tu primer módulo",
        icon: "🌱",
        category: "learning",
        rarity: "common",
        earned: false,
        points: 50,
      },
      {
        id: "explorer",
        name: "Explorador",
        description: "Completa 3 módulos diferentes",
        icon: "🗺️",
        category: "learning",
        rarity: "common",
        earned: false,
        points: 100,
      },
      {
        id: "problem_solver",
        name: "Solucionador",
        description: "Resuelve 10 retos de programación",
        icon: "🧩",
        category: "achievement",
        rarity: "rare",
        earned: false,
        points: 200,
      },

      {
        id: "code_ninja",
        name: "Ninja del Código",
        description: "Resuelve un reto difícil en menos de 10 minutos",
        icon: "🥷",
        category: "special",
        rarity: "epic",
        earned: false,
        points: 300,
      },
      {
        id: "python_master",
        name: "Maestro Python",
        description: "Completa todos los módulos básicos",
        icon: "👑",
        category: "learning",
        rarity: "legendary",
        earned: false,
        points: 500,
      },
      {
        id: "badge_bronze",
        name: "Insignia Bronce",
        description: "Insignia de nivel básico para mostrar tus primeros logros",
        icon: "🥉",
        category: "achievement",
        rarity: "common",
        earned: false,
        points: 50,
      },
      {
        id: "badge_silver",
        name: "Insignia Plata",
        description: "Insignia de nivel intermedio para usuarios dedicados",
        icon: "🥈",
        category: "achievement",
        rarity: "rare",
        earned: false,
        points: 100,
      },
      {
        id: "badge_gold",
        name: "Insignia Oro",
        description: "Insignia de nivel avanzado para los mejores estudiantes",
        icon: "🥇",
        category: "achievement",
        rarity: "epic",
        earned: false,
        points: 200,
      },
      {
        id: "badge_platinum",
        name: "Insignia Diamante",
        description: "Insignia de élite para los maestros de Python",
        icon: "💎",
        category: "achievement",
        rarity: "legendary",
        earned: false,
        points: 500,
      },
      {
        id: "badge_python",
        name: "Insignia Python",
        description: "Obtén una insignia especial por tu progreso en Python",
        icon: "🐍",
        category: "learning",
        rarity: "rare",
        earned: false,
        points: 150,
      },
      {
        id: "badge_challenge_master",
        name: "Insignia Maestro de Retos",
        description: "Demuestra tu habilidad completando retos y obtén esta insignia",
        icon: "⚔️",
        category: "achievement",
        rarity: "epic",
        earned: false,
        points: 250,
      },
      {
        id: "badge_cesmag",
        name: "Insignia CESMAG",
        description: "Insignia especial de la institución CESMAG",
        icon: "🏛️",
        category: "special",
        rarity: "epic",
        earned: false,
        points: 250,
      },
    ]
  }

  initializeAchievements() {
    return [
      {
        id: "daily_learner",
        title: "Aprendiz Diario",
        description: "Estudia durante 30 días consecutivos",
        type: "streak",
        target: 30,
        current: 7,
        completed: false,
        reward: { points: 500, badge: "streak_legend" },
      },
      {
        id: "point_collector",
        title: "Coleccionista de Puntos",
        description: "Acumula 2000 puntos",
        type: "points",
        target: 2000,
        current: 1250,
        completed: false,
        reward: { points: 200 },
      },
      {
        id: "module_master",
        title: "Maestro de Módulos",
        description: "Completa 5 módulos",
        type: "modules",
        target: 5,
        current: 2,
        completed: false,
        reward: { points: 300, badge: "learning_expert" },
      },
      {
        id: "challenge_champion",
        title: "Campeón de Retos",
        description: "Resuelve 25 retos de programación",
        type: "challenges",
        target: 25,
        current: 8,
        completed: false,
        reward: { points: 400, badge: "challenge_master" },
      },
    ]
  }

  initializeChallenges() {
    return [
      {
        id: "hello_world",
        title: "Hola Mundo",
        description: 'Imprime "Hola, mundo!" en la consola',
        difficulty: "easy",
        points: 25,
        category: "Básico",
        code: "# Escribe tu código aquí\n",
        solution: 'print("Hola, mundo!")',
        testCases: [{ input: "", expectedOutput: "Hola, mundo!" }],
        completed: true,
        attempts: 1,
      },
      {
        id: "sum_numbers",
        title: "Suma de Números",
        description: "Crea una función que sume dos números",
        difficulty: "easy",
        points: 50,
        category: "Funciones",
        code: "def sumar(a, b):\n    # Tu código aquí\n    pass\n\n# Prueba tu función\nprint(sumar(5, 3))",
        solution: "def sumar(a, b):\n    return a + b\n\nprint(sumar(5, 3))",
        testCases: [
          { input: "sumar(5, 3)", expectedOutput: "8" },
          { input: "sumar(10, -2)", expectedOutput: "8" },
        ],
        completed: true,
        attempts: 2,
      },
      {
        id: "calculator",
        title: "Calculadora Básica",
        description: "Crea una calculadora que sume, reste, multiplique y divida",
        difficulty: "easy",
        points: 75,
        category: "Funciones",
        code: "def calculadora(a, b, operacion):\n    # Tu código aquí\n    pass\n\nprint(calculadora(10, 5, '+'))",
        solution:
          "def calculadora(a, b, operacion):\n    if operacion == '+':\n        return a + b\n    elif operacion == '-':\n        return a - b\n    elif operacion == '*':\n        return a * b\n    elif operacion == '/':\n        return a / b\n\nprint(calculadora(10, 5, '+'))",
        testCases: [
          { input: "calculadora(10, 5, '+')", expectedOutput: "15" },
          { input: "calculadora(10, 5, '*')", expectedOutput: "50" },
        ],
        completed: true,
        attempts: 1,
      },
      {
        id: "list_operations",
        title: "Operaciones con Listas",
        description: "Encuentra el número mayor en una lista",
        difficulty: "easy",
        points: 100,
        category: "Listas",
        code: "numeros = [3, 7, 2, 9, 1, 5]\n# Encuentra el número mayor\n",
        solution: "numeros = [3, 7, 2, 9, 1, 5]\nmayor = max(numeros)\nprint(mayor)",
        testCases: [{ input: "numeros = [3, 7, 2, 9, 1, 5]", expectedOutput: "9" }],
        completed: false,
        attempts: 0,
      },
      {
        id: "word_counter",
        title: "Contador de Palabras",
        description: "Cuenta las palabras en una frase",
        difficulty: "medium",
        points: 125,
        category: "Strings",
        code: 'frase = "Python es un lenguaje genial"\n# Cuenta las palabras\n',
        solution: 'frase = "Python es un lenguaje genial"\npalabras = len(frase.split())\nprint(palabras)',
        testCases: [{ input: 'frase = "Python es un lenguaje genial"', expectedOutput: "5" }],
        completed: false,
        attempts: 1,
      },
      {
        id: "temperature_converter",
        title: "Conversor de Temperatura",
        description: "Convierte Celsius a Fahrenheit",
        difficulty: "medium",
        points: 150,
        category: "Matemáticas",
        code: "def celsius_a_fahrenheit(celsius):\n    # Tu código aquí\n    pass\n\nprint(celsius_a_fahrenheit(25))",
        solution:
          "def celsius_a_fahrenheit(celsius):\n    return (celsius * 9/5) + 32\n\nprint(celsius_a_fahrenheit(25))",
        testCases: [
          { input: "celsius_a_fahrenheit(0)", expectedOutput: "32.0" },
          { input: "celsius_a_fahrenheit(25)", expectedOutput: "77.0" },
        ],
        completed: false,
        attempts: 0,
      },
      {
        id: "prime_checker",
        title: "Detector de Números Primos",
        description: "Verifica si un número es primo",
        difficulty: "medium",
        points: 175,
        timeLimit: 25,
        category: "Algoritmos",
        code: "def es_primo(numero):\n    # Tu código aquí\n    pass\n\nprint(es_primo(17))",
        solution:
          "def es_primo(numero):\n    if numero < 2:\n        return False\n    for i in range(2, int(numero**0.5) + 1):\n        if numero % i == 0:\n            return False\n    return True\n\nprint(es_primo(17))",
        testCases: [
          { input: "es_primo(17)", expectedOutput: "True" },
          { input: "es_primo(15)", expectedOutput: "False" },
        ],
        completed: false,
        attempts: 0,
      },
      {
        id: "fibonacci",
        title: "Secuencia Fibonacci",
        description: "Genera los primeros 10 números de la secuencia Fibonacci",
        difficulty: "medium",
        points: 200,
        timeLimit: 30,
        category: "Algoritmos",
        code: "# Genera los primeros 10 números de Fibonacci\n",
        solution: "a, b = 0, 1\nfor i in range(10):\n    print(a)\n    a, b = b, a + b",
        testCases: [{ input: "", expectedOutput: "0\n1\n1\n2\n3\n5\n8\n13\n21\n34" }],
        completed: false,
        attempts: 0,
      },
      {
        id: "password_validator",
        title: "Validador de Contraseñas",
        description: "Verifica si una contraseña es segura (mín 8 caracteres, mayúscula, número)",
        difficulty: "hard",
        points: 250,
        timeLimit: 35,
        category: "Strings",
        code: "def validar_password(password):\n    # Tu código aquí\n    pass\n\nprint(validar_password('MiPass123'))",
        solution:
          "def validar_password(password):\n    if len(password) < 8:\n        return False\n    tiene_mayuscula = any(c.isupper() for c in password)\n    tiene_numero = any(c.isdigit() for c in password)\n    return tiene_mayuscula and tiene_numero\n\nprint(validar_password('MiPass123'))",
        testCases: [
          { input: "validar_password('MiPass123')", expectedOutput: "True" },
          { input: "validar_password('mipass')", expectedOutput: "False" },
        ],
        completed: false,
        attempts: 0,
      },
      {
        id: "palindrome",
        title: "Detector de Palíndromos",
        description: "Verifica si una palabra es un palíndromo",
        difficulty: "hard",
        points: 275,
        timeLimit: 45,
        category: "Strings",
        code: 'def es_palindromo(palabra):\n    # Tu código aquí\n    pass\n\n# Prueba\nprint(es_palindromo("radar"))',
        solution:
          'def es_palindromo(palabra):\n    return palabra.lower() == palabra.lower()[::-1]\n\nprint(es_palindromo("radar"))',
        testCases: [
          { input: 'es_palindromo("radar")', expectedOutput: "True" },
          { input: 'es_palindromo("python")', expectedOutput: "False" },
        ],
        completed: false,
        attempts: 0,
      },
      {
        id: "sorting_algorithm",
        title: "Algoritmo de Ordenamiento",
        description: "Implementa el algoritmo de ordenamiento burbuja",
        difficulty: "hard",
        points: 300,
        timeLimit: 60,
        category: "Algoritmos",
        code: "def ordenamiento_burbuja(lista):\n    # Tu código aquí\n    pass\n\nprint(ordenamiento_burbuja([64, 34, 25, 12, 22, 11, 90]))",
        solution:
          "def ordenamiento_burbuja(lista):\n    n = len(lista)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if lista[j] > lista[j+1]:\n                lista[j], lista[j+1] = lista[j+1], lista[j]\n    return lista\n\nprint(ordenamiento_burbuja([64, 34, 25, 12, 22, 11, 90]))",
        testCases: [{ input: "[64, 34, 25, 12, 22, 11, 90]", expectedOutput: "[11, 12, 22, 25, 34, 64, 90]" }],
        completed: false,
        attempts: 0,
      },
    ]
  }

  get state() {
    return this.store
  }

  addPoints(points) {
    this.store.update((state) => {
      state.points += points
      // Check for level up
      const newLevel = Math.floor(state.points / 500) + 1
      if (newLevel > state.level) {
        state.level = newLevel
        // Level up notification could be triggered here
      }
      return state
    })
  }

  earnBadge(badgeId) {
    this.store.update((state) => {
      const badge = state.badges.find((b) => b.id === badgeId)
      if (badge && !badge.earned) {
        badge.earned = true
        badge.earnedDate = new Date().toISOString().split("T")[0]
        state.points += badge.points
      }
      return state
    })
  }

  completeChallenge(challengeId) {
    this.store.update((state) => {
      const challenge = state.challenges.find((c) => c.id === challengeId)
      if (challenge && !challenge.completed) {
        challenge.completed = true
        state.points += challenge.points

        // Update achievements
        const challengeAchievement = state.achievements.find((a) => a.type === "challenges")
        if (challengeAchievement) {
          challengeAchievement.current++
          if (challengeAchievement.current >= challengeAchievement.target) {
            challengeAchievement.completed = true
            state.points += challengeAchievement.reward.points
          }
        }
      }
      return state
    })
  }

  updateStreak(days) {
    this.store.update((state) => {
      state.streak = days

      // Update streak achievements
      const streakAchievement = state.achievements.find((a) => a.type === "streak")
      if (streakAchievement) {
        streakAchievement.current = days
        if (streakAchievement.current >= streakAchievement.target && !streakAchievement.completed) {
          streakAchievement.completed = true
          state.points += streakAchievement.reward.points
        }
      }

      return state
    })
  }
}

export const gamificationStore = new GamificationStore()
