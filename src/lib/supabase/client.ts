import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// 싱글톤 인스턴스 (클라이언트 컴포넌트용)
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
};
