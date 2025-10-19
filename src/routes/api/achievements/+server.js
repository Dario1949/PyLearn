import { supabase } from '$lib/supabase.js';

export async function POST({ request }) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'userId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cargar datos desde Supabase
    const { data: catalog } = await supabase.from('store_catalog').select('*');
    const { data: purchases } = await supabase.from('purchases').select('*').eq('user_id', userId);
    const { data: userProgress } = await supabase.from('progress').select('*').eq('user_id', userId).single();
    
    if (!userProgress) {
      return new Response(JSON.stringify({ success: false, error: 'Progreso no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Encontrar avatares de logro
    const achievementAvatars = catalog.filter(item => item.type === 'achievement_avatar');
    
    // Verificar qué avatares debe tener desbloqueados
    const modulesCompleted = userProgress.completed_modules?.length || 0;
    const newUnlocks = [];
    
    for (const avatar of achievementAvatars) {
      if (avatar.requirement === 'modules_completed' && modulesCompleted >= avatar.threshold) {
        // Verificar si ya lo tiene
        const alreadyUnlocked = purchases?.some(p => p.item_id === avatar.id);
        
        if (!alreadyUnlocked) {
          // Desbloquear automáticamente
          const { error } = await supabase.from('purchases').insert({
            user_id: userId,
            item_id: avatar.id,
            cost: 0,
            purchase_date: new Date().toISOString(),
            type: 'achievement_unlock'
          });
          
          if (!error) {
            newUnlocks.push(avatar);
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      newUnlocks,
      totalModules: modulesCompleted 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking achievements:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
