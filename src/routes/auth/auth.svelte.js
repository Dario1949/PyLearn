import { writable } from 'svelte/store';

function createAuthStore() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  const { subscribe, set, update } = writable(stored ? JSON.parse(stored) : null);

  let isLoading = false;

  return {
    subscribe,
    get isLoading() { return isLoading; },
    async register(user) {
      isLoading = true;
      update(n => n); // trigger update
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(user));
          set(user);
          isLoading = false;
          update(n => n);
          return { success: true };
        }
        isLoading = false;
        update(n => n);
        return { success: false, error: data.error };
      } catch (e) {
        isLoading = false;
        update(n => n);
        return { success: false, error: 'Error de red' };
      }
    },
    logout() {
      localStorage.removeItem('user');
      set(null);
    }
  };
}

export const authStore = createAuthStore();