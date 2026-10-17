import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KisanSetu AI" },
      { name: "description", content: "Sign in or create your KisanSetu AI farmer account." },
      { property: "og:title", content: "Sign in — KisanSetu AI" },
      { property: "og:description", content: "Access your farm command centre." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) navigate({ to: "/dashboard" });
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to check your sign-in status.");
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (s && e === "SIGNED_IN") navigate({ to: "/dashboard" }); });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, supabaseConfigured]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      toast.error("Authentication is not configured. Connect Supabase before using this sign-in page.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!supabaseConfigured) {
      toast.error("Authentication is not configured. Connect Supabase before signing in.");
      return;
    }
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (r.error) toast.error(r.error.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="Farmer in wheat field" className="absolute inset-0 h-full w-full object-cover" width={1600} height={1008} />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <p className="font-display text-4xl font-bold leading-tight">किसान का साथी,<br />हर फ़ैसले में।</p>
          <p className="mt-3 text-primary-foreground/80">Your partner in every farming decision.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <Link to="/" className="mb-8 flex items-center gap-2 font-display text-xl font-bold"><Sprout className="text-primary" /> KisanSetu AI</Link>
          <h1 className="text-3xl font-bold">{mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset password"}</h1>
          {!supabaseConfigured && (
            <p role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Authentication is unavailable until Supabase is configured. This page will not create accounts or send reset emails.
            </p>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (<div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5 h-11" /></div>)}
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-11" /></div>
            {mode !== "forgot" && (<div><Label>Password</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5 h-11" /></div>)}
            <Button type="submit" size="lg" className="w-full" disabled={busy || !supabaseConfigured}>
              {mode === "in" ? "Sign in" : mode === "up" ? "Sign up" : "Send reset link"}
            </Button>
          </form>
          {mode !== "forgot" && (
            <>
              <div className="my-5 text-center text-xs text-muted-foreground">or</div>
              <Button variant="outline" size="lg" className="w-full" onClick={google} disabled={!supabaseConfigured}>Continue with Google</Button>
            </>
          )}
          <div className="mt-6 flex justify-between text-sm">
            <button className="text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create account" : "Have an account? Sign in"}</button>
            {mode === "in" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
