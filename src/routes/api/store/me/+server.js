import { json } from "@sveltejs/kit";
import { supabase } from '$lib/supabase.js';

export async function GET({ locals, cookies }) {
  try {
    // Intentar obtener usuario de locals o de cookies
    let userId = locals?.user?.id;
    let userRole = locals?.user?.role;
    
    if (!userId) {
      const sessionId = cookies.get('session_id');
      if (!sessionId) {
        return json({ success: false, error: "No autorizado" }, { status: 401 });
      }
      
      // Obtener usuario de Supabase
      const { data: user } = await supabase.from('users').select('id, role').eq('id', sessionId).single();
      if (!user) {
        return json({ success: false, error: "No autorizado" }, { status: 401 });
      }
      
      userId = user.id;
      userRole = user.role;
    }

    const { data: catalog } = await supabase.from('store_catalog').select('*');
    const { data: userPurchases } = await supabase.from('purchases').select('item_id').eq('user_id', userId);
    const { data: userProgress } = await supabase.from('progress').select('points').eq('user_id', userId).single();

    const unlocked = userPurchases?.map(p => p.item_id) || [];
    
    // Dar puntos infinitos a administradores
    const isAdmin = userRole === 'admin' || userRole === 'teacher';
    const points = isAdmin ? 999999 : (Number(userProgress?.points ?? 0) || 0);

    return json({
      success: true,
      points,
      unlocked,
      catalog: catalog || [],
    });
  } catch (e) {
    return json(
      { success: false, error: "Error al cargar la tienda" },
      { status: 500 }
    );
  }
}
