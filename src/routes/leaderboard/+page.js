// src/routes/leaderboard/+page.js

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("No se pudo cargar la tabla de clasificación");
      }
      const data = await response.json();
      const leaderboard = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
      return { leaderboard };
    } catch (error) {
      console.error(error);
      return {
        leaderboard: [],
        error: error.message
      };
    }
  }
  