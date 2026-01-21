import { createClient } from "@supabase/supabase-js";

// 서버 컴포넌트 및 API 라우트용 Supabase 클라이언트
// Service Role Key를 사용하여 RLS를 우회
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// 레거시 호환용 export
export const supabaseServer = createServerClient;
