import { json } from "@sveltejs/kit";
import { supabase } from '$lib/supabase.js';

export async function GET() {
  try {
    const { data: catalog, error } = await supabase.from('store_catalog').select('*');
    if (error) throw error;
    
    return json({
      success: true,
      catalog: catalog || [],
    });
  } catch (e) {
    return json(
      { success: false, error: "No se pudo leer el catálogo" },
      { status: 500 }
    );
  }
}
