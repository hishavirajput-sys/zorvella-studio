import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export function AdminGate({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!data.user || error) {
        if (active) setAllowed(false);
        return;
      }
      const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (active) setAllowed(Boolean(role) && !roleError);
    });
    return () => { active = false; };
  }, []);
  if (allowed === null) return <p className="loading-note" role="status">Checking store access…</p>;
  if (!allowed) return <div className="admin-denied"><ShieldAlert size={28} aria-hidden="true" /><h2>Store management is restricted.</h2><p>This account does not have permission to manage the store.</p><Link to="/" className="store-link">Return to the shop</Link></div>;
  return children;
}