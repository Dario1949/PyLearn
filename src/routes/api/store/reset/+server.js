import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";

const purchasesPath = path.resolve("src/lib/data/purchases.json");

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
    const purchases = fs.existsSync(purchasesPath)
      ? JSON.parse(fs.readFileSync(purchasesPath, "utf-8"))
      : [];

    const pIndex = Array.isArray(purchases)
      ? purchases.findIndex((p) => p.userId === userId)
      : -1;

    if (pIndex !== -1) {
      // Resetear las compras del administrador
      purchases[pIndex] = { userId, unlocked: [], history: [] };
      fs.writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2), "utf-8");
    }

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