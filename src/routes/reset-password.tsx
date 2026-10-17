import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — KisanSetu AI" },
      { name: "description", content: "Choose a new password for your KisanSetu AI account." },
      { property: "og:title", content: "Reset password — KisanSetu AI" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      toast.error("Authentication is not configured. A password cannot be changed.");
      return;
    }
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        toast.error("Open the password reset link from your email before setting a new password.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the password.");
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {!supabaseConfigured && (
          <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Password setup is unavailable until Supabase is configured.
          </p>
        )}
        <Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="h-11" />
        <Button type="submit" size="lg" className="w-full" disabled={!supabaseConfigured}>Save password</Button>
      </form>
    </div>
  );
}
