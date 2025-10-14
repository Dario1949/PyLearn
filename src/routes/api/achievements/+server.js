import fs from 'fs';
import path from 'path';

const storeCatalogPath = path.resolve('src/lib/data/store-catalog.json');
const purchasesPath = path.resolve('src/lib/data/purchases.json');
const progressPath = path.resolve('src/lib/data/progress.json');

export async function POST({ request }) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'userId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cargar datos
    const catalog = JSON.parse(fs.readFileSync(storeCatalogPath, 'utf-8'));
    const purchases = fs.existsSync(purchasesPath) 
      ? JSON.parse(fs.readFileSync(purchasesPath, 'utf-8')) 
      : [];
    const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    
    const userProgress = progressData.find(p => p.userId === userId);
    if (!userProgress) {
      return new Response(JSON.stringify({ success: false, error: 'Progreso no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Encontrar avatares de logro
    const achievementAvatars = catalog.filter(item => item.type === 'achievement_avatar');
    
    // Verificar qué avatares debe tener desbloqueados
    const modulesCompleted = userProgress.completedModules?.length || 0;
    const newUnlocks = [];
    
    for (const avatar of achievementAvatars) {
      if (avatar.requirement === 'modules_completed' && modulesCompleted >= avatar.threshold) {
        // Verificar si ya lo tiene
        const alreadyUnlocked = purchases.some(p => p.userId === userId && p.itemId === avatar.id);
        
        if (!alreadyUnlocked) {
          // Desbloquear automáticamente
          purchases.push({
            id: `${userId}-${avatar.id}-${Date.now()}`,
            userId,
            itemId: avatar.id,
            cost: 0,
            purchaseDate: new Date().toISOString(),
            type: 'achievement_unlock'
          });
          newUnlocks.push(avatar);
        }
      }
    }

    // Guardar compras actualizadas
    fs.writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));

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