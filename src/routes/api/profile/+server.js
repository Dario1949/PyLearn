// src/routes/api/profile/+server.js
import { supabase } from '$lib/supabase.js';

export async function PUT({ request, locals }) {
  try {
    // Auth
    if (!locals?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    console.log('Profile PUT request from:', locals.user.email);

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "JSON inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, ...updates } = body || {};
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email requerido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Solo el propio usuario, o roles elevados
    const isSelf =
      String(email).toLowerCase() === String(locals.user.email).toLowerCase();
    const elevated = ["teacher", "admin"].includes(locals.user.role);
    if (!isSelf && !elevated) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No autorizado para editar este perfil",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Cargar usuario desde Supabase
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuario no encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ---- ENFORCEMENT DE TIENDA ----
    // Determinar intención (cambio de avatar / info)
    const intendsAvatar =
      typeof updates.avatar === "string" &&
      updates.avatar.length > 0 &&
      (updates.avatar.startsWith("data:image") ||
        updates.avatar !== currentUser.avatar);

    const intendsInfo =
      (typeof updates.name === "string" &&
        updates.name.trim() !== (currentUser.name || "").trim()) ||
      (typeof updates.bio === "string" &&
        updates.bio.trim() !== (currentUser.bio || "").trim());

    // Leer desbloqueos del usuario desde Supabase
    const { data: userPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('item_id')
      .eq('user_id', locals.user.id);
    
    if (purchasesError) {
      console.log('Purchases table not found or error:', purchasesError);
    }
    
    const unlocked = userPurchases?.map(p => p.item_id) || [];

    // Cargar catálogo desde Supabase
    const { data: catalog, error: catalogError } = await supabase.from('store_catalog').select('*');
    
    if (catalogError) {
      console.log('Store catalog not found or error:', catalogError);
    }
    
    const getCost = (id) => Number(catalog?.find((i) => i.id === id)?.cost ?? 0);

    // Solo validar tienda si las tablas existen
    if (catalog && userPurchases !== null) {
      if (intendsAvatar && !unlocked.includes("profile_avatar")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Necesitas desbloquear el cambio de avatar en la tienda.",
            required: "profile_avatar",
            cost: getCost("profile_avatar"),
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      if (intendsInfo && !unlocked.includes("profile_info")) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Necesitas desbloquear la edición de información en la tienda.",
            required: "profile_info",
            cost: getCost("profile_info"),
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log('Store validation skipped - tables not available');
    }

    // ---- PROCESO AVATAR (si viene en dataURL) ----
    if (
      typeof updates.avatar === "string" &&
      updates.avatar.startsWith("data:image")
    ) {
      try {
        const matches = updates.avatar.match(
          /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/
        );
        if (!matches || matches.length !== 3)
          throw new Error("Formato de avatar inválido");
        let ext = matches[1].toLowerCase();
        if (ext === "jpeg") ext = "jpg";
        if (ext === "svg+xml") ext = "svg";

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Subir a Supabase Storage
        const fileName = `${email.split("@")[0]}-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: `image/${ext}`,
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        updates.avatar = publicUrl;
      } catch (e) {
        console.error("Error al guardar el avatar:", e);
        return new Response(
          JSON.stringify({
            success: false,
            error: "No se pudo procesar la imagen",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (updates.avatar === "") {
      delete updates.avatar; // no sobreescribir con vacío
    }

    // Guardar cambios en Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, user: updatedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("profile PUT error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
