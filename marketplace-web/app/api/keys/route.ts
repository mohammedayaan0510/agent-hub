import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // 1. Initialize Supabase SSR Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component / Route Handler.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );

    // 2. Authenticate the active user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create an API key." },
        { status: 401 }
      );
    }

    // 3. Extract request body options
    const body = await request.json().catch(() => ({}));
    const keyName = body.key_name || "Default API Key";

    // 4. Generate raw API key and calculate SHA-256 hash
    const rawKey = `ag_live_${crypto.randomUUID().replace(/-/g, "")}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(rawKey)
    );
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 5. Store key metadata in database
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        buyer_id: user.id,
        key_name: keyName,
        key_hash: keyHash,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Database Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 6. Return raw key once to the client
    return NextResponse.json({
      success: true,
      apiKey: rawKey,
      keyRecord: data,
    });
  } catch (err: any) {
    console.error("API Key Endpoint Failure:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}