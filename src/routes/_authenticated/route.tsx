import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (!data.user || error) {
      const next = location.pathname.startsWith("/") ? location.pathname : "/account";
      throw redirect({ to: "/login", search: { next } as never });
    }
  },
  component: () => <Outlet />,
});