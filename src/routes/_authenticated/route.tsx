import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isSupabaseConfigured()) throw redirect({ to: "/auth" });

    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
