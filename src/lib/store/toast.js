import { writable } from 'svelte/store';

// Estado del toast: { message, type, visible }
export const toast = writable({
  message: '',
  type: 'success', // 'success' | 'error' | 'info'
  visible: false
});

export function showToast(message, type = 'success', duration = 3000) {
  toast.set({ message, type, visible: true });
  setTimeout(() => {
    toast.set({ message: '', type, visible: false });
  }, duration);
}
