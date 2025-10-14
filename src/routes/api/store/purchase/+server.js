import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";

const catalogPath = path.resolve("src/lib/data/store-catalog.json");
const purchasesPath = path.resolve("src/lib/data/purchases.json");
const progressPath = path.resolve("src/lib/data/progress.json");

function readJson(p) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}

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

    const catalog = readJson(catalogPath) || [];
    const item = Array.isArray(catalog)
      ? catalog.find((i) => i.id === itemId)
      : null;
    if (!item) {
      return json(
        { success: false, error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    const purchases = readJson(purchasesPath) || [];
    const progress = readJson(progressPath) || [];

    const pIndex = Array.isArray(purchases)
      ? purchases.findIndex((p) => p.userId === userId)
      : -1;
    const progressIndex = Array.isArray(progress)
      ? progress.findIndex((p) => p.userId === userId)
      : -1;

    if (progressIndex === -1) {
      return json(
        { success: false, error: "Progreso del usuario no encontrado" },
        { status: 404 }
      );
    }

    const userPurchases =
      pIndex !== -1 ? purchases[pIndex] : { userId, unlocked: [], history: [] };
    if (userPurchases.unlocked.includes(itemId)) {
      // Ya desbloqueado -> idempotente
      return json({
        success: true,
        points: progress[progressIndex].points,
        unlocked: userPurchases.unlocked,
      });
    }

    const cost = Number(item.cost || 0);
    const currentPoints = Number(progress[progressIndex].points || 0);
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

    // Descontar puntos solo si no es administrador
    if (!isAdmin) {
      progress[progressIndex].points = currentPoints - cost;
      // Mantener el total de puntos ganados
      if (!progress[progressIndex].totalPointsEarned) {
        progress[progressIndex].totalPointsEarned = currentPoints;
      }
    }
    
    // Manejar paquetes de insignias
    if (item.type === 'badge_pack' && Array.isArray(item.includes)) {
      // Agregar todas las insignias del paquete
      item.includes.forEach(badgeId => {
        if (!userPurchases.unlocked.includes(badgeId)) {
          userPurchases.unlocked.push(badgeId);
        }
      });
    }
    
    userPurchases.unlocked.push(itemId);
    userPurchases.history.push({ itemId, cost, ts: new Date().toISOString() });

    if (pIndex !== -1) purchases[pIndex] = userPurchases;
    else purchases.push(userPurchases);

    writeJson(progressPath, progress);
    writeJson(purchasesPath, purchases);

    return json({
      success: true,
      points: progress[progressIndex].points,
      unlocked: userPurchases.unlocked,
    });
  } catch (e) {
    console.error("store/purchase error:", e);
    return json(
      { success: false, error: "Error al procesar la compra" },
      { status: 500 }
    );
  }
}
