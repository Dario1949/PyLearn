import { json } from "@sveltejs/kit";
import fs from "fs";
import path from "path";

const catalogPath = path.resolve("src/lib/data/store-catalog.json");

export async function GET() {
  try {
    const catalog = fs.existsSync(catalogPath)
      ? JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
      : [];
    return json({
      success: true,
      catalog: Array.isArray(catalog) ? catalog : [],
    });
  } catch (e) {
    return json(
      { success: false, error: "No se pudo leer el catálogo" },
      { status: 500 }
    );
  }
}
