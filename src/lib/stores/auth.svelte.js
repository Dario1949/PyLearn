import { writable } from "svelte/store"

class AuthStore {
  constructor() {
    this.state = writable({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    this.initializeFromStorage()

    // --- ¡AQUÍ ESTÁ LA MAGIA! ---
    // Nos suscribimos a cualquier cambio en el estado.
    this.state.subscribe(currentState => {
      // Si hay un usuario en el estado, lo guardamos en localStorage.
      if (currentState.user) {
        this.saveToLocalStorage(currentState.user)
      } else {
        // Si no hay usuario (ej. después de un logout), limpiamos localStorage.
        this.clearLocalStorage()
      }
    })
  }

  // Los getters no necesitan cambios
  get user() {
    return this.state.subscribe((value) => value.user)
  }
  get isAuthenticated() {
    return this.state.subscribe((value) => value.isAuthenticated)
  }
  get isLoading() {
    return this.state.subscribe((value) => value.isLoading)
  }

  async login(email, password) {
    const { update } = this.state
    update((state) => ({ ...state, isLoading: true }))

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success) {
        // Solo actualizamos el estado. El 'subscribe' de arriba se encargará de guardar.
        update((state) => ({
          ...state,
          user: data.user,
          isAuthenticated: true
        }))
        
        // Cargar progreso y tema del usuario inmediatamente
        await this.loadUserProgress(data.user.id);
        this.loadUserTheme(data.user.id);
        
        return { success: true }
      } else {
        return { success: false, error: data.error || "Credenciales incorrectas" }
      }
    } catch (error) {
      return { success: false, error: "Error de conexión" }
    } finally {
      update((state) => ({ ...state, isLoading: false }))
    }
  }

  async register(userData) {
    const { update } = this.state
    update((state) => ({ ...state, isLoading: true }))

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data = await res.json()
      if (data.success) {
        // Solo actualizamos el estado. El 'subscribe' de arriba se encargará de guardar.
        update((state) => ({
          ...state,
          user: data.user, // Asumimos que el API devuelve el usuario completo
          isAuthenticated: true
        }))
        return { success: true }
      } else {
        return { success: false, error: data.error || "Error al crear la cuenta" }
      }
    } catch (error) {
      return { success: false, error: "Error al crear la cuenta" }
    } finally {
      update((state) => ({ ...state, isLoading: false }))
    }
  }

  logout() {
    const { update } = this.state
    
    // Solo limpiar currentUserId, mantener cache de temas por usuario
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUserId');
    }
    
    // Resetear tema a predeterminado solo visualmente
    import('$lib/stores/theme.svelte.js').then(({ resetToDefaultTheme }) => {
      resetToDefaultTheme();
    });
    
    // Solo actualizamos el estado. El 'subscribe' se encargará de limpiar el storage.
    update((state) => ({
      ...state,
      user: null,
      isAuthenticated: false
    }))
  }

  // --- MÉTODOS DE STORAGE (SIN CAMBIOS) ---
  saveToLocalStorage(user) {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(user))
    }
  }

  clearLocalStorage() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
      localStorage.removeItem("currentUserId")
    }
  }

  initializeFromStorage() {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("auth_user")
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const { update } = this.state
          update((state) => ({
            ...state,
            user: user,
            isAuthenticated: true
          }))
          
          // Cargar progreso y tema real del usuario
          this.loadUserProgress(user.id);
          this.loadUserTheme(user.id);
        } catch (error) {
          this.clearLocalStorage()
        }
      }
    }
  }
  
  async loadUserProgress(userId) {
    try {
      const response = await fetch(`/api/progress/${userId}`);
      const data = await response.json();
      
      if (data.success && data.progress) {
        const { update } = this.state;
        update((state) => {
          if (state.user) {
            const updatedUser = {
              ...state.user,
              points: data.progress.points || 0,
              level: data.progress.level || 1,
              completedModules: data.progress.completed_modules || [],
              completedChallenges: data.progress.completed_challenges || [],
              completedLessons: data.progress.completed_lessons || [],
              earnedBadges: data.progress.earned_badges || [],
              streak: data.progress.streak || 0,
              averageScore: data.progress.average_score || 0,
              totalPointsEarned: data.progress.total_points_earned || 0
            };
            
            // También actualizar localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }
            
            return {
              ...state,
              user: updatedUser
            };
          }
          return state;
        });
        
        console.log('Progreso cargado exitosamente:', data.progress);
      } else {
        console.log('No se encontró progreso para el usuario o es nuevo');
      }
    } catch (error) {
      console.warn('No se pudo cargar el progreso del usuario:', error);
    }
  }
  
  async loadUserTheme(userId) {
    const { loadThemeForUser } = await import('$lib/stores/theme.svelte.js');
    // Establecer currentUser ANTES de cargar el tema
    loadThemeForUser(userId);
    
    try {
      const response = await fetch('/api/store/me');
      const data = await response.json();
      if (data.success) {
        // Sincronizar insignias de la tienda
        const { gamificationStore } = await import('$lib/stores/gamification.svelte.js');
        gamificationStore.state.update((state) => {
          const unlockedFromStore = new Set(data.unlocked || []);
          state.badges.forEach((b) => {
            if (unlockedFromStore.has(b.id)) {
              b.earned = true;
              b.earnedDate = b.earnedDate || new Date().toISOString().split('T')[0];
            }
          });
          return state;
        });
      }
    } catch (error) {
      console.warn('No se pudo sincronizar insignias:', error);
    }
  }
}

export const authStore = new AuthStore()