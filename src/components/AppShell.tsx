import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LayoutDashboard, Stethoscope, MessageCircle, IndianRupee, Store, UserRound, LogOut, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, type Key } from "@/lib/i18n";

const nav: { to: "/dashboard"; key: Key; icon: typeof Sprout }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
];

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-full border border-border bg-card p-0.5 text-sm ${className}`}>
      {(["en", "hi"] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 font-medium transition ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Sprout /></span>
          KisanSetu <span className="text-sidebar-primary">AI</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, key, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground font-semibold" }}>
              <Icon className="h-5 w-5" /> {t(key)}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent">
          <LogOut className="h-5 w-5" /> {t("signout")}
        </button>
      </aside>

      <div className="flex min-w-0 flex-col pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold lg:hidden">
            <Sprout className="h-5 w-5 text-primary" /> KisanSetu
          </Link>
          <div className="hidden text-sm text-muted-foreground lg:block">Smart Farming. Fair Markets. Better Futures.</div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card lg:hidden">
        {nav.slice(0, 5).map(({ to, key, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary font-semibold" }}>
            <Icon className="h-5 w-5" /> <span className="truncate px-1">{t(key)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
