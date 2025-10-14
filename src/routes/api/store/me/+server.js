import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";

const catalogPath = path.resolve("src/lib/data/store-catalog.json");
const purchasesPath = path.resolve("src/lib/data/purchases.json");
const progressPath = path.resolve("src/lib/data/progress.json");

export async function GET({ locals }) {
  try {
    if (!locals?.user?.id) {
      return json({ success: false, error: "No autorizado" }, { status: 401 });
    }
    const userId = locals.user.id;

    const catalog = fs.existsSync(catalogPath)
      ? JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
      : [];
    const purchases = fs.existsSync(purchasesPath)
      ? JSON.parse(fs.readFileSync(purchasesPath, "utf-8"))
      : [];
    const progress = fs.existsSync(progressPath)
      ? JSON.parse(fs.readFileSync(progressPath, "utf-8"))
      : [];

    const entry = Array.isArray(purchases)
      ? purchases.find((p) => p.userId === userId)
      : null;
    const unlocked = entry?.unlocked ?? [];

    const row = Array.isArray(progress)
      ? progress.find((p) => p.userId === userId)
      : null;
    
    // Dar puntos infinitos a administradores
    const isAdmin = locals.user.role === 'admin' || locals.user.role === 'teacher';
    const points = isAdmin ? 999999 : (Number(row?.points ?? 0) || 0);

    return json({
      success: true,
      points,
      unlocked,
      catalog: Array.isArray(catalog) ? catalog : [],
    });
  } catch (e) {
    return json(
      { success: false, error: "Error al cargar la tienda" },
      { status: 500 }
    );
  }
}
