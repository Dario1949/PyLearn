import { json } from "@sveltejs/kit";
import { supabase } from '$lib/supabase.js';

export async function POST({ locals }) {
  try {
    if (!locals?.user?.id) {
      return json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const isAdmin = locals.user.role === 'admin' || locals.user.role === 'teacher';
    if (!isAdmin) {
      return json({ success: false, error: "Solo administradores pueden resetear" }, { status: 403 });
    }

    const userId = locals.user.id;

    // Eliminar todas las compras del administrador
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return json({
      success: true,
      message: "Recompensas reseteadas correctamente"
    });
  } catch (e) {
    console.error("store/reset error:", e);
    return json(
      { success: false, error: "Error al resetear recompensas" },
      { status: 500 }
    );
  }
}
