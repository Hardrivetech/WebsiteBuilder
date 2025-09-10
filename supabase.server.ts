import { createServerClient, parse, serialize } from "@supabase/ssr";
import { redirect } from "@remix-run/cloudflare";
import type { Env } from "~/routes/_index";

export const getSupabaseClient = (request: Request, env: Env) => {
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => cookies[key],
      set: (key, value, options) =>
        headers.append("Set-Cookie", serialize(key, value, options)),
      remove: (key, options) =>
        headers.append("Set-Cookie", serialize(key, "", options)),
    },
  });
};

export const getUserId = async (
  request: Request,
  env: Env
): Promise<string> => {
  const supabase = getSupabaseClient(request, env);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw redirect("/login"); // Redirect to a login page if not authenticated
  return session.user.id;
};
