import { json } from "@sveltejs/kit";
import { supabase } from '$lib/supabase.js';

export async function POST({ request, locals }) {
  try {
    if (!locals?.user?.id) {
      return json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    const { itemId } = await request.json().catch(() => ({}));
    if (!itemId) {
      return json(
        { success: false, error: "itemId requerido" },
        { status: 400 }
      );
    }
    const userId = locals.user.id;

    // Obtener item del catálogo
    const { data: item, error: itemError } = await supabase
      .from('store_catalog')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return json(
        { success: false, error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    // Obtener progreso del usuario
    const { data: userProgress, error: progressError } = await supabase
      .from('progress')
      .select('points, total_points_earned')
      .eq('user_id', userId)
      .single();

    if (progressError) {
      return json(
        { success: false, error: "Progreso del usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya está desbloqueado
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (existingPurchase) {
      const { data: unlocked } = await supabase
        .from('purchases')
        .select('item_id')
        .eq('user_id', userId);
      
      return json({
        success: true,
        points: userProgress.points,
        unlocked: unlocked?.map(p => p.item_id) || [],
      });
    }

    const cost = Number(item.cost || 0);
    const currentPoints = Number(userProgress.points || 0);
    const isAdmin = locals.user.role === 'admin' || locals.user.role === 'teacher';
    
    // Verificar puntos solo si no es administrador
    if (!isAdmin && currentPoints < cost) {
      return json(
        {
          success: false,
          error: "Puntos insuficientes",
          required: itemId,
          cost,
          points: currentPoints,
        },
        { status: 400 }
      );
    }

    // Crear registro de compra
    const purchaseRecord = {
      user_id: userId,
      item_id: itemId,
      cost,
      purchase_date: new Date().toISOString(),
      type: 'purchase'
    };

    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseRecord);

    if (purchaseError) throw purchaseError;

    // Manejar paquetes de insignias
    if (item.type === 'badge_pack' && Array.isArray(item.includes)) {
      const badgePurchases = item.includes.map(badgeId => ({
        user_id: userId,
        item_id: badgeId,
        cost: 0,
        purchase_date: new Date().toISOString(),
        type: 'badge_pack_item'
      }));
      
      await supabase.from('purchases').insert(badgePurchases);
    }

    // Descontar puntos solo si no es administrador
    let newPoints = currentPoints;
    if (!isAdmin) {
      newPoints = currentPoints - cost;
      const { error: updateError } = await supabase
        .from('progress')
        .update({ 
          points: newPoints,
          total_points_earned: userProgress.total_points_earned || currentPoints
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    // Obtener todos los items desbloqueados
    const { data: allUnlocked } = await supabase
      .from('purchases')
      .select('item_id')
      .eq('user_id', userId);

    return json({
      success: true,
      points: newPoints,
      unlocked: allUnlocked?.map(p => p.item_id) || [],
    });
  } catch (e) {
    console.error("store/purchase error:", e);
    return json(
      { success: false, error: "Error al procesar la compra" },
      { status: 500 }
    );
  }
}
