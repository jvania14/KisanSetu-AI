import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type SyntheticEvent } from "react";
import {
  Sprout,
  LayoutDashboard,
  Leaf,
  MessageCircle,
  TrendingUp,
  Droplets,
  Store,
  Tractor,
  Wheat,
  Users,
  Bell,
  Search,
  ChevronDown,
  MapPin,
  CloudSun,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Sun,
  CalendarDays,
  IndianRupee,
  Handshake,
  Languages,
  Plus,
  Filter,
  ShieldCheck,
  Sparkles,
  CloudRain,
  BookOpen,
  ShoppingBasket,
  PackageCheck,
  X,
  AlertTriangle,
  Flame,
} from "lucide-react";

import WeatherWidget from "@/components/weather/WeatherWidget";
import IrrigationPlanner from "@/components/irrigation/IrrigationPlanner";
import CropDoctorWidget from "@/components/crop-doctor/CropDoctorWidget";
import AdvisoryWidget from "@/components/advisory/AdvisoryWidget";
import MandiInsightsWidget from "@/components/mandi/MandiInsightsWidget";

import {
  fetchFarmWeather,
  describeWeather,
  formatWeatherDate,
  type FarmLocation,
  type FarmWeather,
} from "@/lib/weather";

export const Route = createFileRoute("/")({ component: KisanSetuApp });

type Section =
  | "Overview"
  | "Crop Doctor"
  | "AI Advisory"
  | "Mandi Insights"
  | "Smart Irrigation"
  | "Produce Marketplace"
  | "Machinery"
  | "Residue Exchange"
  | "Community"
  | "Schemes";

const nav: { name: Section; icon: any }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Smart Irrigation", icon: Droplets },
  { name: "Crop Doctor", icon: Leaf },
  { name: "AI Advisory", icon: MessageCircle },
  { name: "Mandi Insights", icon: TrendingUp },
  { name: "Produce Marketplace", icon: Store },
  { name: "Machinery", icon: Tractor },
  { name: "Residue Exchange", icon: Wheat },
  { name: "Community", icon: Users },
  { name: "Schemes", icon: BookOpen },
];

const crops = [
  {
    name: "Wheat",
    variety: "HD-2967",
    stage: "Grain filling",
    progress: 72,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=85",
    status: "Healthy",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    name: "Mustard",
    variety: "RH-0749",
    stage: "Flowering",
    progress: 48,
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=85",
    status: "Monitor",
    color: "bg-amber-100 text-amber-800",
  },
  {
    name: "Basmati rice",
    variety: "Pusa 1121",
    stage: "Harvest planning",
    progress: 88,
    image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=85",
    status: "Healthy",
    color: "bg-emerald-100 text-emerald-800",
  },
];

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500"><rect width="900" height="500" fill="#e5f0df"/><path d="M0 390 Q180 300 360 390 T900 370 V500 H0Z" fill="#a9cda7"/><path d="M0 440 Q220 340 450 435 T900 410 V500 H0Z" fill="#4f8b59"/><g fill="#fff" opacity=".92"><circle cx="720" cy="110" r="45"/></g><g fill="#225d3c"><path d="M430 390 Q390 270 300 240 Q380 230 430 320 Q450 220 540 190 Q510 270 445 340Z"/><path d="M445 395 Q475 285 575 260 Q515 250 455 340Z"/></g><text x="36" y="455" fill="#fff" font-family="Arial,sans-serif" font-size="24" font-weight="700">KisanSetu · Farm image</text></svg>'
  );

const imageFallback = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
};

const listingsInitial = [
  {
    id: 1,
    crop: "Premium Basmati Rice",
    variety: "Pusa 1121 · Grade A",
    qty: "45 quintals",
    price: 3650,
    location: "Sonipat, Haryana",
    seller: "Ramesh Kumar",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85",
    tag: "Ready in 3 days",
  },
  {
    id: 2,
    crop: "Fresh Mustard Seed",
    variety: "Cleaned · 98% purity",
    qty: "18 quintals",
    price: 5780,
    location: "Panipat, Haryana",
    seller: "Sunita Devi",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=85",
    tag: "Verified farmer",
  },
  {
    id: 3,
    crop: "Wheat Grain",
    variety: "HD-2967 · FAQ quality",
    qty: "70 quintals",
    price: 2500,
    location: "Rohtak, Haryana",
    seller: "Ajay Singh",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85",
    tag: "Bulk available",
  },
];

export function KisanSetuApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [profileName, setProfileName] = useState("Demo Farmer");
  const [profileLocation, setProfileLocation] = useState("Sonipat, Haryana");

  const [section, setSection] = useState<Section>("Overview");
  const [role, setRole] = useState("Farmer");
  const [lang, setLang] = useState<"EN" | "हिं" | "ਪੰਜਾਬੀ" | "मराठी" | "বাংলা" | "தமிழ்">("EN");
  const [search, setSearch] = useState("");

  // Integrated Farm Context States
  const [currentLocation, setCurrentLocation] = useState<FarmLocation>(() => {
    try {
      const saved = localStorage.getItem("kisansetu_selected_location");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      name: "Sonipat",
      latitude: 28.9931,
      longitude: 77.0151,
      admin1: "Haryana",
      country: "India",
    };
  });

  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [advisoryPrompt, setAdvisoryPrompt] = useState("");

  // Marketplace & Offers
  const [listings, setListings] = useState(listingsInitial);
  const [offer, setOffer] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState("3600");
  const [offers, setOffers] = useState<{ crop: string; amount: number; status: string }[]>([]);
  const [toast, setToast] = useState("");
  const [listingModal, setListingModal] = useState(false);
  const [newCrop, setNewCrop] = useState("Fresh produce");
  const [newPrice, setNewPrice] = useState("2500");

  useEffect(() => {
    if (localStorage.getItem("kisansetu-demo-session") === "active") {
      setSignedIn(true);
      setProfileName(localStorage.getItem("kisansetu-profile-name") || "Demo Farmer");
      setProfileLocation(localStorage.getItem("kisansetu-profile-location") || "Sonipat, Haryana");
    }
  }, []);

  // Sync weather telemetry for shared location
  useEffect(() => {
    let active = true;
    void fetchFarmWeather(currentLocation)
      .then((res) => {
        if (active) setWeather(res);
      })
      .catch(() => {
        // network error
      });
    return () => {
      active = false;
    };
  }, [currentLocation]);

  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 2800);
  };

  const navTo = (s: Section) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const signIn = (e?: FormEvent) => {
    e?.preventDefault();
    const a = JSON.parse(localStorage.getItem("kisansetu-demo-accounts") || "{}") as Record<
      string,
      { name: string; password: string; phone: string; location: string }
    >;
    const u = a[loginEmail.trim().toLowerCase()];
    if (!u) {
      notify("No account found. Create an account or use demo access.");
      return;
    }
    if (u.password !== loginPassword) {
      notify("Password doesn't match this demo account.");
      return;
    }
    localStorage.setItem("kisansetu-demo-session", "active");
    localStorage.setItem("kisansetu-profile-name", u.name);
    localStorage.setItem("kisansetu-profile-location", u.location || "Sonipat, Haryana");
    setProfileName(u.name);
    setProfileLocation(u.location || "Sonipat, Haryana");
    setSignedIn(true);
    notify("Welcome back, " + u.name + "!");
  };

  const createAccount = (e?: FormEvent) => {
    e?.preventDefault();
    if (fullName.trim().length < 2) {
      notify("Please enter your full name.");
      return;
    }
    if (loginPassword.length < 8) {
      notify("Use a password with at least 8 characters.");
      return;
    }
    if (loginPassword !== confirmPassword) {
      notify("Passwords do not match.");
      return;
    }
    const a = JSON.parse(localStorage.getItem("kisansetu-demo-accounts") || "{}") as Record<
      string,
      { name: string; password: string; phone: string; location: string }
    >;
    const email = loginEmail.trim().toLowerCase();
    if (a[email]) {
      notify("An account with this email already exists.");
      return;
    }
    a[email] = {
      name: fullName.trim(),
      password: loginPassword,
      phone,
      location: farmLocation.trim() || "Sonipat, Haryana",
    };
    localStorage.setItem("kisansetu-demo-accounts", JSON.stringify(a));
    localStorage.setItem("kisansetu-demo-session", "active");
    localStorage.setItem("kisansetu-profile-name", fullName.trim());
    localStorage.setItem("kisansetu-profile-location", farmLocation.trim() || "Sonipat, Haryana");
    setProfileName(fullName.trim());
    setProfileLocation(farmLocation.trim() || "Sonipat, Haryana");
    setSignedIn(true);
    notify("Demo profile created. Welcome to KisanSetu!");
  };

  const resetPassword = (e?: FormEvent) => {
    e?.preventDefault();
    const a = JSON.parse(localStorage.getItem("kisansetu-demo-accounts") || "{}") as Record<
      string,
      unknown
    >;
    if (!a[loginEmail.trim().toLowerCase()]) {
      notify("No demo account found for that email.");
      return;
    }
    notify("Email recovery requires Supabase Auth configuration.");
    setAuthMode("login");
  };

  const signOut = () => {
    localStorage.removeItem("kisansetu-demo-session");
    setSignedIn(false);
    setSection("Overview");
    setLoginPassword("");
    setAuthMode("login");
  };

  const makeListing = () => {
    if (!newCrop.trim() || Number(newPrice) <= 0) {
      notify("Enter a crop name and valid price.");
      return;
    }
    setListings((l) => [
      {
        id: Date.now(),
        crop: newCrop,
        variety: "New farmer listing",
        qty: "10 quintals",
        price: Number(newPrice),
        location: currentLocation.name + (currentLocation.admin1 ? `, ${currentLocation.admin1}` : ""),
        seller: profileName,
        image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85",
        tag: "Just listed",
      },
      ...l,
    ]);
    setListingModal(false);
    setNewCrop("Fresh produce");
    notify("Listing added to demo marketplace.");
  };

  const filtered = useMemo(
    () =>
      listings.filter((l) =>
        (l.crop + " " + l.location + " " + l.variety).toLowerCase().includes(search.toLowerCase())
      ),
    [listings, search]
  );

  const isBuyer = role === "Buyer / FPO";
  const title = section === "Overview" ? (isBuyer ? "Sourcing command centre" : "Your farm, at a glance") : section;

  // Real weather alert calculations
  const upcomingRainyDay = weather?.forecast?.slice(0, 3).find(
    (d) => d.rainfall >= 10 || (d.rainProbability !== null && d.rainProbability >= 65)
  );

  const heatAlertDay = weather?.forecast?.slice(0, 3).find((d) => d.max >= 38);

  // Authentication Gate Screen
  if (!signedIn) {
    return (
      <div className="min-h-screen overflow-hidden bg-[#f4f7ee] text-[#123d2c]">
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
          <section className="relative hidden overflow-hidden bg-[#0b3d2a] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(125deg,rgba(5,43,28,.94),rgba(14,91,52,.78) 58%,rgba(55,128,63,.4)),url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=90)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10 flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ffc344] text-[#12442e]">
                <Sprout size={32} />
              </span>
              <div>
                <div className="text-2xl font-extrabold">
                  KisanSetu <span className="text-[#ffc344]">AI</span>
                </div>
                <div className="text-sm text-white/70">Smart farming · Fair futures</div>
              </div>
            </div>

            <div className="relative z-10 max-w-2xl py-14">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[.16em]">
                <Sparkles size={14} className="mr-2 inline text-[#ffc344]" /> YOUR FARM, ONE SMARTER WORKSPACE
              </span>
              <h1 className="mt-7 text-5xl font-extrabold leading-[1.08] xl:text-6xl">
                Grow with confidence.<br />
                <span className="text-[#ffd064]">Harvest with hope.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">
                Live Open-Meteo weather, agronomic irrigation calculations, visual crop pathology, mandi price intelligence, and fair direct markets.
              </p>
              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  { n: "01", t: "Smart Irrigation" },
                  { n: "02", t: "Crop Doctor" },
                  { n: "03", t: "Mandi Insights" },
                ].map((x) => (
                  <div key={x.n} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="text-xs font-bold text-[#ffd064]">{x.n}</div>
                    <div className="mt-2 text-sm font-bold">{x.t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex justify-between text-xs text-white/65">
              <span>Made for Indian farming communities</span>
              <span>Full-Stack Functional Prototype</span>
            </div>
          </section>

          <section className="relative flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#d7edc8] opacity-70 blur-3xl" />
            <div className="relative w-full max-w-[470px]">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffc344] text-[#12442e]">
                  <Sprout size={27} />
                </span>
                <div className="text-xl font-extrabold">
                  KisanSetu <span className="text-[#d99a1d]">AI</span>
                  <div className="text-xs font-normal text-[#819085]">Smart farming · Fair futures</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-extrabold uppercase tracking-[.16em] text-[#2b8750]">
                  {authMode === "signup"
                    ? "Start your journey"
                    : authMode === "forgot"
                    ? "Account recovery"
                    : "Welcome to your farm"}
                </div>
                <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                  {authMode === "signup"
                    ? "Create your farmer account"
                    : authMode === "forgot"
                    ? "Reset your password"
                    : "Sign in to KisanSetu"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#708277]">
                  {authMode === "signup"
                    ? "Set up your profile to personalize farm advice, weather, and tools."
                    : authMode === "forgot"
                    ? "Enter the email associated with your local account."
                    : "Your farm dashboard, crop tools, and market insights are just a step away."}
                </p>
              </div>

              <div className="rounded-[28px] border border-[#dfe9d9] bg-white/95 p-5 shadow-[0_25px_70px_rgba(22,69,42,.12)] sm:p-7">
                <form
                  onSubmit={
                    authMode === "signup"
                      ? createAccount
                      : authMode === "forgot"
                      ? resetPassword
                      : signIn
                  }
                  className="space-y-4"
                >
                  {authMode === "signup" && (
                    <>
                      <label className="block text-sm font-bold">
                        Full name
                        <input
                          required
                          minLength={2}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          autoComplete="name"
                          placeholder="e.g. Priya Sharma"
                          className="mt-2 w-full rounded-xl border border-[#dce7d8] bg-[#fbfdf9] p-3.5 outline-none focus:border-[#368555]"
                        />
                      </label>
                      <label className="block text-sm font-bold">
                        Mobile number <span className="font-normal text-[#87958a]">(optional)</span>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+91 98xxxxxx"
                          className="mt-2 w-full rounded-xl border border-[#dce7d8] bg-[#fbfdf9] p-3.5 outline-none focus:border-[#368555]"
                        />
                      </label>
                      <label className="block text-sm font-bold">
                        Village / district / state
                        <input
                          value={farmLocation}
                          onChange={(e) => setFarmLocation(e.target.value)}
                          placeholder="e.g. Sonipat, Haryana"
                          className="mt-2 w-full rounded-xl border border-[#dce7d8] bg-[#fbfdf9] p-3.5 outline-none focus:border-[#368555]"
                        />
                      </label>
                    </>
                  )}

                  <label className="block text-sm font-bold">
                    Email address
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-[#dce7d8] bg-[#fbfdf9] p-3.5 outline-none focus:border-[#368555]"
                    />
                  </label>

                  {authMode !== "forgot" && (
                    <label className="block text-sm font-bold">
                      Password
                      <div className="mt-2 flex rounded-xl border border-[#dce7d8] bg-[#fbfdf9] focus-within:border-[#368555]">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={authMode === "signup" ? 8 : 1}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={authMode === "signup" ? "At least 8 characters" : "Enter password"}
                          className="min-w-0 flex-1 rounded-xl bg-transparent p-3.5 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="px-4 text-xs font-bold text-[#37764b]"
                        >
                          {showPassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                    </label>
                  )}

                  {authMode === "signup" && (
                    <label className="block text-sm font-bold">
                      Confirm password
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="mt-2 w-full rounded-xl border border-[#dce7d8] bg-[#fbfdf9] p-3.5 outline-none focus:border-[#368555]"
                      />
                    </label>
                  )}

                  {authMode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setAuthMode("forgot")}
                        className="text-sm font-bold text-[#287747] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#17663e] to-[#0e4b31] p-3.5 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    {authMode === "signup"
                      ? "Create account"
                      : authMode === "forgot"
                      ? "Check recovery options"
                      : "Sign in securely"}{" "}
                    <ArrowRight className="ml-2 inline" size={17} />
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#a0aaa0]">
                  <span className="h-px flex-1 bg-[#e7eee3]" />
                  OR
                  <span className="h-px flex-1 bg-[#e7eee3]" />
                </div>

                {authMode === "login" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileName("Demo Farmer");
                      setProfileLocation("Sonipat, Haryana");
                      localStorage.setItem("kisansetu-profile-name", "Demo Farmer");
                      localStorage.setItem("kisansetu-profile-location", "Sonipat, Haryana");
                      localStorage.setItem("kisansetu-demo-session", "active");
                      setSignedIn(true);
                      notify("Welcome to the KisanSetu workspace.");
                    }}
                    className="w-full rounded-xl border border-[#cde2c9] bg-[#eef7e9] p-3.5 font-bold text-[#205f3c] hover:bg-[#e2f1dc]"
                  >
                    <Sprout className="mr-2 inline" size={18} /> Explore farm workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="w-full rounded-xl border border-[#dce7d8] p-3.5 font-bold text-[#41624b] hover:bg-[#f7faf4]"
                  >
                    Back to sign in
                  </button>
                )}

                <div className="mt-5 text-center text-sm text-[#78877b]">
                  {authMode === "login" ? "New to KisanSetu? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "login" : "signup");
                      setLoginPassword("");
                      setConfirmPassword("");
                    }}
                    className="font-extrabold text-[#287747] hover:underline"
                  >
                    {authMode === "signup" ? "Sign in" : "Create account"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
        {toast && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-semibold text-white shadow-xl"
          >
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8f2] text-[#173b2b]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#e3e7dc]/80 bg-[#fbfcf8]/95 px-4 shadow-[0_5px_25px_rgba(26,65,42,.035)] backdrop-blur-xl sm:px-7 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button className="flex shrink-0 items-center gap-2.5 text-left" onClick={() => navTo("Overview")}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f8bd43] text-[#16452e] shadow-md">
              <Sprout size={25} />
            </span>
            <span className="hidden sm:block">
              <b className="block text-[18px] leading-5 tracking-tight text-[#153e2b]">
                KisanSetu<span className="text-[#d99a1d]"> AI</span>
              </b>
              <small className="text-[11px] text-[#819087]">Smart farming · Fair futures</small>
            </span>
          </button>
          <span className="mx-1 hidden h-9 border-l border-[#e1e7dd] xl:block" />
          <div className="hidden text-xs text-[#829187] xl:block">
            Farm command centre <span className="mx-2">/</span>
          </div>
          <span className="truncate text-sm font-bold text-[#143e2b]">{title}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Crop Selector */}
          <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#dce5da] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1f5033]">
            <Leaf size={14} className="text-[#2b794a]" />
            <span>Active Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent font-bold text-[#15462c] outline-none"
            >
              <option value="Wheat">Wheat (गेहूँ)</option>
              <option value="Mustard">Mustard (सरसों)</option>
              <option value="Rice">Rice (धान)</option>
              <option value="Tomato">Tomato (टमाटर)</option>
              <option value="Cotton">Cotton (कपास)</option>
            </select>
          </div>

          <button
            onClick={() =>
              setLang(
                lang === "EN"
                  ? "हिं"
                  : lang === "हिं"
                  ? "ਪੰਜਾਬੀ"
                  : lang === "ਪੰਜਾਬੀ"
                  ? "मराठी"
                  : lang === "मराठी"
                  ? "বাংলা"
                  : lang === "বাংলা"
                  ? "தமிழ்"
                  : "EN"
              )
            }
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e1e6dc] bg-white px-3 text-xs font-bold"
          >
            <Languages size={16} />
            {lang}
          </button>

          <button
            onClick={() => notify("Notifications: All telemetry systems operational.")}
            className="relative rounded-xl p-2 hover:bg-[#edf2e9]"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e8a12d]" />
          </button>

          <button
            onClick={signOut}
            title="Sign out"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#e9c49b] text-xs font-bold text-[#714624] hover:ring-2 hover:ring-[#9fc7a4]"
          >
            {isBuyer ? "FP" : profileName.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav
        aria-label="Main navigation"
        className="sticky top-[76px] z-20 border-b border-[#e3e7dc] bg-white/95 px-3 py-2 backdrop-blur-xl sm:px-6 xl:px-10"
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => navTo(name)}
              className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 sm:px-4 sm:text-sm ${
                section === name
                  ? "bg-[#e5f1df] text-[#155b38] shadow-sm ring-1 ring-[#d2e7cf]"
                  : "text-[#647469] hover:bg-[#f2f6ee] hover:text-[#155b38]"
              }`}
            >
              <Icon
                size={17}
                className={section === name ? "text-[#24764a]" : "text-[#87978b] group-hover:text-[#24764a]"}
              />
              <span>{name}</span>
              {section === name && <span className="h-1.5 w-1.5 rounded-full bg-[#eeb33e]" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Body Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
        {/* Profile / Location Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3e9df] bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(30,67,43,.035)]">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3dfbd] text-xs font-extrabold text-[#714624]">
              {isBuyer ? "FP" : profileName.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#234b34]">{isBuyer ? "Shakti FPO" : profileName}</p>
              <p className="text-[11px] text-[#829187]">
                {isBuyer ? "Buyer workspace" : `Farmer · ${currentLocation.name}${currentLocation.admin1 ? `, ${currentLocation.admin1}` : ""}`}
              </p>
            </div>
            <span className="hidden rounded-full bg-[#eaf5e7] px-2.5 py-1 text-[10px] font-bold text-[#2c7549] sm:inline-flex items-center">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#4da76b]" />
              Active Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            {weather?.current && (
              <div className="flex items-center gap-2 rounded-xl bg-[#f0f6ed] px-3 py-1.5 text-xs font-bold text-[#1a5332] border border-[#d4e4d1]">
                <CloudSun size={16} className="text-[#327e4d]" />
                <span>
                  {Math.round(weather.current.temperature)}°C · {describeWeather(weather.current.code)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-[#738376]">
              <MapPin size={14} className="text-[#327c4d]" />
              <span>{currentLocation.name}</span>
            </div>
          </div>
        </div>

        {/* Section Heading Bar */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#37835b]">
              <span className="h-2 w-2 rounded-full bg-[#48a66b]" />
              {new Intl.DateTimeFormat(lang === "हिं" ? "hi-IN" : "en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}{" "}
              <span className="text-[#b1b9af]">·</span> {isBuyer ? "BUYER WORKSPACE" : "YOUR FARM OVERVIEW"}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-[38px] text-[#143e2b]">
              {section === "Overview"
                ? isBuyer
                  ? "Good morning, Shakti FPO."
                  : "Namaste, " + profileName.split(" ")[0] + " ji."
                : title}
            </h1>
            <p className="mt-2 text-sm text-[#718176] sm:text-base">
              {section === "Overview"
                ? isBuyer
                  ? "Discover quality produce and build direct farmer partnerships."
                  : "Here's what is happening on your farm today with live telemetry."
                : sectionSubtitle(section)}
            </p>
          </div>

          {section === "Produce Marketplace" && (
            <button
              onClick={() => setListingModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#145c38] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-950/10 hover:bg-[#0d482b]"
            >
              <Plus size={17} /> Add listing
            </button>
          )}
        </div>

        {/* Real Weather Alerts on Dashboard */}
        {section === "Overview" && upcomingRainyDay && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs leading-5 text-blue-900 shadow-sm">
            <div className="flex items-start gap-2.5">
              <CloudRain size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-blue-950">
                  Live Weather Alert: Forecast Rain in {currentLocation.name}
                </p>
                <p className="mt-0.5 text-blue-900">
                  Open-Meteo predicts {upcomingRainyDay.rainfall.toFixed(1)} mm rainfall ({upcomingRainyDay.rainProbability ?? 60}% probability) on {formatWeatherDate(upcomingRainyDay.date)}. Review your irrigation schedule to prevent waterlogging.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navTo("Smart Irrigation")}
              className="shrink-0 rounded-xl bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800"
            >
              Adjust Irrigation
            </button>
          </div>
        )}

        {section === "Overview" && heatAlertDay && !upcomingRainyDay && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 shadow-sm">
            <div className="flex items-start gap-2.5">
              <Flame size={20} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-950">
                  Heat Alert: High Evaporative Demand
                </p>
                <p className="mt-0.5 text-amber-900">
                  Forecast high of {Math.round(heatAlertDay.max)}°C on {formatWeatherDate(heatAlertDay.date)}. Monitor soil moisture closely, especially for vegetable and shallow-rooted crops.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navTo("Smart Irrigation")}
              className="shrink-0 rounded-xl bg-amber-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-900"
            >
              Check Soil Plan
            </button>
          </div>
        )}

        {/* Section Routing */}
        {section === "Overview" &&
          (role === "Farmer" || isBuyer ? (
            <Overview
              isBuyer={isBuyer}
              profileLocation={currentLocation.name}
              navTo={navTo}
              notify={notify}
              offers={offers}
              weather={weather}
              selectedCrop={selectedCrop}
            />
          ) : (
            <RoleOverview role={role} navTo={navTo} notify={notify} />
          ))}

        {section === "Smart Irrigation" && (
          <IrrigationPlanner
            currentLocation={currentLocation}
            weather={weather}
            selectedCrop={selectedCrop}
            onNavigateToAdvisory={(prompt) => {
              setAdvisoryPrompt(prompt);
              navTo("AI Advisory");
            }}
            notify={notify}
          />
        )}

        {section === "Crop Doctor" && (
          <CropDoctorWidget
            selectedCrop={selectedCrop}
            onNavigateToAdvisory={(prompt) => {
              setAdvisoryPrompt(prompt);
              navTo("AI Advisory");
            }}
            notify={notify}
          />
        )}

        {section === "AI Advisory" && (
          <AdvisoryWidget
            currentLocation={currentLocation}
            currentWeather={weather}
            selectedCrop={selectedCrop}
            initialQuestion={advisoryPrompt}
            lang={lang}
            onNavigate={navTo}
            notify={notify}
          />
        )}

        {section === "Mandi Insights" && (
          <MandiInsightsWidget
            selectedCrop={selectedCrop}
            onNavigateToMarketplace={(c) => {
              setSearch(c);
              navTo("Produce Marketplace");
            }}
            notify={notify}
          />
        )}

        {section === "Produce Marketplace" && (
          <Marketplace listings={filtered} isBuyer={isBuyer} setOffer={setOffer} notify={notify} />
        )}

        {section === "Machinery" && <Machinery notify={notify} role={role} />}
        {section === "Residue Exchange" && <Residue notify={notify} />}
        {section === "Community" && <Community notify={notify} />}
        {section === "Schemes" && <Schemes notify={notify} />}
      </main>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1500px] flex-wrap justify-between gap-2 px-4 pb-8 text-[11px] text-[#94a097] sm:px-7 xl:px-10">
        <span>© 2026 KisanSetu AI · Built for IIITD HackShift</span>
        <span>Powered by Open-Meteo & Agmarknet DMI Telemetry</span>
      </footer>

      {/* Offer Modal */}
      {offer !== null && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#102b1e]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Make an offer</h2>
              <button onClick={() => setOffer(null)} className="rounded-lg p-2 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#718176]">Enter your proposed price per quintal. This is a local demo workflow.</p>
            <label className="mt-5 block text-sm font-semibold">Offer price (₹ / quintal)</label>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#dce5da] p-3 outline-none focus:border-[#37835b]"
            />
            <div className="mt-5 flex gap-3">
              <button onClick={() => setOffer(null)} className="flex-1 rounded-xl border p-3 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = listings.find((l) => l.id === offer);
                  if (Number(offerAmount) > 0 && item) {
                    setOffers((o) => [{ crop: item.crop, amount: Number(offerAmount), status: "Pending" }, ...o]);
                    notify("Offer saved in this demo session");
                  }
                  setOffer(null);
                }}
                className="flex-1 rounded-xl bg-[#145c38] p-3 text-sm font-bold text-white"
              >
                Submit offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Produce Listing Modal */}
      {listingModal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#102b1e]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Create produce listing</h2>
              <button onClick={() => setListingModal(false)}>
                <X />
              </button>
            </div>
            <label className="mt-5 block text-sm font-semibold">Crop / produce name</label>
            <input
              value={newCrop}
              onChange={(e) => setNewCrop(e.target.value)}
              className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-[#37835b]"
            />
            <label className="mt-4 block text-sm font-semibold">Price per quintal (₹)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-[#37835b]"
            />
            <p className="mt-3 text-xs text-[#7c8b7f]">
              Listing will be saved to your active browser session with location {currentLocation.name}.
            </p>
            <button onClick={makeListing} className="mt-5 w-full rounded-xl bg-[#145c38] p-3 font-bold text-white">
              Publish listing
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-[#123f2b] px-5 py-3 text-sm font-semibold text-white shadow-xl sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function RoleOverview({ role, navTo, notify }: { role: string; navTo: (s: Section) => void; notify: (s: string) => void }) {
  const configs: Record<
    string,
    {
      eyebrow: string;
      title: string;
      desc: string;
      metrics: { label: string; value: string; note: string }[];
      actions: { label: string; desc: string; section: Section; icon: any }[];
    }
  > = {
    "Machinery Owner": {
      eyebrow: "EQUIPMENT PARTNER WORKSPACE",
      title: "Your equipment, better utilized.",
      desc: "Manage inventory, explore booking demand, and keep equipment information ready for local farmers.",
      metrics: [
        { label: "Equipment listings", value: "03", note: "Illustrative inventory" },
        { label: "Requests to review", value: "02", note: "Active requests" },
        { label: "Service radius", value: "30 km", note: "Local coverage" },
      ],
      actions: [
        { label: "Manage machinery", desc: "Review equipment cards and booking actions", section: "Machinery", icon: Tractor },
        { label: "Explore residue exchange", desc: "See circular-agriculture listings", section: "Residue Exchange", icon: Wheat },
        { label: "Community", desc: "Connect with farmers in your area", section: "Community", icon: Users },
      ],
    },
    "Agricultural Expert": {
      eyebrow: "AGRICULTURAL EXPERT WORKSPACE",
      title: "Help farmers make informed decisions.",
      desc: "Review crop cases, explore diagnosis workflows, and share practical, careful guidance.",
      metrics: [
        { label: "Cases to review", value: "04", note: "Field queue" },
        { label: "Crop topics", value: "06", note: "Verified categories" },
        { label: "Guidance status", value: "Ready", note: "Decision tree active" },
      ],
      actions: [
        { label: "Review crop cases", desc: "Open crop photo and symptom workflow", section: "Crop Doctor", icon: Leaf },
        { label: "Answer farm questions", desc: "Use the advisory companion", section: "AI Advisory", icon: MessageCircle },
        { label: "Community questions", desc: "Review discussions and share guidance", section: "Community", icon: Users },
      ],
    },
    Administrator: {
      eyebrow: "PLATFORM ADMIN WORKSPACE",
      title: "Monitor the KisanSetu platform.",
      desc: "Inspect modules, real telemetry, and reference information.",
      metrics: [
        { label: "Active Modules", value: "10", note: "Fully integrated" },
        { label: "Weather Provider", value: "Open-Meteo", note: "Real API" },
        { label: "Mandi Source", value: "Agmarknet", note: "Government APMC" },
      ],
      actions: [
        { label: "Marketplace activity", desc: "Inspect listings and offer interaction", section: "Produce Marketplace", icon: Store },
        { label: "Mandi data", desc: "Review live prices and calculator", section: "Mandi Insights", icon: TrendingUp },
        { label: "Scheme directory", desc: "Open verified official portal links", section: "Schemes", icon: BookOpen },
      ],
    },
  };

  const c = configs[role] ?? configs["Agricultural Expert"]!;

  return (
    <div className="space-y-6 animate-rise">
      <section className="relative overflow-hidden rounded-[26px] bg-[#103f2b] p-7 text-white sm:p-10">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[35px] border-white/5" />
        <div className="relative max-w-3xl">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[.16em] text-[#f8bd43]">
            {c.eyebrow}
          </span>
          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">{c.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{c.desc}</p>
          <button
            onClick={() => navTo(c.actions[0]?.section ?? "Crop Doctor")}
            className="mt-6 rounded-xl bg-[#f8bd43] px-4 py-3 text-sm font-bold text-[#173b2b]"
          >
            Open primary workspace <ArrowRight className="ml-2 inline" size={16} />
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {c.metrics.map((m) => (
          <Panel key={m.label} className="p-5">
            <p className="text-xs text-[#7c8a7e]">{m.label}</p>
            <b className="mt-2 block text-2xl">{m.value}</b>
            <p className="mt-1 text-xs text-[#879287]">{m.note}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {c.actions.map((a) => (
          <button
            key={a.label}
            onClick={() => navTo(a.section)}
            className="rounded-2xl border border-[#e2e9df] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e7f3e4] text-[#28784c]">
              <a.icon size={22} />
            </span>
            <h3 className="mt-4 font-bold">{a.label}</h3>
            <p className="mt-2 text-sm leading-5 text-[#7b897d]">{a.desc}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#247449]">
              Open workspace <ArrowRight size={15} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function sectionSubtitle(s: Section) {
  const d: Record<Section, string> = {
    Overview: "",
    "Crop Doctor": "Inspect crop photos and symptoms with verified field protocols.",
    "AI Advisory": "Multilingual farm companion connected to your live weather and crop telemetry.",
    "Mandi Insights": "Real APMC market benchmarks, live arrival data, and net proceeds math.",
    "Smart Irrigation": "Weather-aware irrigation engine with exact water volume calculations.",
    "Produce Marketplace": "Discover produce directly from farmers and negotiate transparently.",
    Machinery: "Find equipment for your next field operation.",
    "Residue Exchange": "Turn agricultural residue into a useful circular resource instead of waste.",
    Community: "Learn from other growers and share practical field experience.",
    Schemes: "Explore agricultural support programmes and official government portals.",
  };
  return d[s];
}

function Panel({ children, className = "" }: { children: any; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#e4e9df] bg-white shadow-[0_4px_20px_rgba(30,67,43,.035)] ${className}`}>
      {children}
    </section>
  );
}

function PanelHead({ title, sub, action }: { title: string; sub?: string; action?: any }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {sub && <p className="mt-1 text-xs text-[#839086]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Overview({
  isBuyer,
  profileLocation,
  navTo,
  notify,
  offers,
  weather,
  selectedCrop,
}: {
  isBuyer: boolean;
  profileLocation: string;
  navTo: (s: Section) => void;
  notify: (s: string) => void;
  offers: any[];
  weather: FarmWeather | null;
  selectedCrop: string;
}) {
  return (
    <div className="space-y-6 animate-rise">
      {/* Banner */}
      <div className="group relative overflow-hidden rounded-[28px] border border-[#cfe4d0] bg-gradient-to-br from-[#dff2df] via-[#eaf5e5] to-[#fff0c8] shadow-[0_18px_50px_rgba(35,87,51,.09)] transition-shadow duration-500 hover:shadow-[0_24px_65px_rgba(35,87,51,.14)]">
        <img
          onError={imageFallback}
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=90"
          className="absolute inset-y-0 right-0 h-full w-[58%] object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          alt="Golden morning over green agricultural fields"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#e5f3e2] via-[#e5f3e2]/95 via-45% to-[#e5f3e2]/15" />
        <div className="relative max-w-3xl p-6 sm:p-9 lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#28784c]">
            <Sparkles size={13} /> {isBuyer ? "SMART SOURCING INSIGHT" : "LIVE FARM INTELLIGENCE"}
          </span>
          <h2 className="mt-4 max-w-lg text-2xl font-bold leading-tight sm:text-3xl text-[#143e2b]">
            {isBuyer
              ? "Build a stronger supply chain, directly from farms."
              : `Real-time weather and crop guidance for ${selectedCrop}.`}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#526d5b]">
            {isBuyer
              ? "Browse crop listings, compare indicative asking prices, and send an offer to start a conversation."
              : weather?.current
              ? `Current temperature is ${Math.round(weather.current.temperature)}°C (${describeWeather(weather.current.code)}) with ${weather.current.humidity}% humidity. Smart irrigation planning can save significant water.`
              : "Connecting with Open-Meteo live weather to help you optimize irrigation and plant protection."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navTo(isBuyer ? "Produce Marketplace" : "Smart Irrigation")}
              className="flex items-center gap-2 rounded-xl bg-[#155b38] px-4 py-3 text-sm font-bold text-white shadow hover:bg-[#0f4429]"
            >
              {isBuyer ? "Explore produce" : "View Irrigation Engine"}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navTo("AI Advisory")}
              className="rounded-xl border border-[#b7d6bd] bg-white/75 px-4 py-3 text-sm font-bold text-[#1a5030] hover:bg-white"
            >
              Ask Kisan AI
            </button>
          </div>
        </div>
        <div className="absolute right-5 top-5 hidden items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold sm:flex">
          <MapPin size={14} /> {profileLocation}
        </div>
      </div>

      {/* 4 Metric Panels */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {(isBuyer
          ? [
              { l: "Active produce listings", v: "128", s: "Live marketplace", i: ShoppingBasket },
              { l: "New offers", v: "12", s: "Negotiation flow", i: Handshake },
              { l: "Supplier regions", v: "8", s: "Haryana · Punjab · UP", i: MapPin },
              { l: "Saved listings", v: "06", s: "Your shortlist", i: PackageCheck },
            ]
          : [
              { l: "Farm area", v: "2.0 acres", s: "Configured farm profile", i: Sprout },
              { l: "Active crop", v: selectedCrop, s: "Wheat · Mustard · Rice", i: Leaf },
              {
                l: "Telemetry Weather",
                v: weather?.current ? `${Math.round(weather.current.temperature)}°C` : "28°C",
                s: weather?.current ? describeWeather(weather.current.code) : "Open-Meteo Live",
                i: CloudSun,
              },
              { l: "Benchmark wheat rate", v: "₹2,525", s: "APMC Sonipat /quintal", i: IndianRupee },
            ]
        ).map((x: any) => (
          <Panel key={x.l} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#7c8a7e]">{x.l}</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f4e7] text-[#247749]">
                <x.i size={18} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-[#143e2b]">{x.v}</div>
            <div className="mt-1 text-[11px] text-[#879287]">{x.s}</div>
          </Panel>
        ))}
      </div>

      {/* 2 Big Panels: Active Fields & Priority Actions */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Panel>
          <PanelHead
            title={isBuyer ? "Market watchlist" : "My fields"}
            sub={isBuyer ? "Indicative prices to guide sourcing" : "Crop stage and progress · field telemetry"}
            action={
              <button
                onClick={() => navTo(isBuyer ? "Mandi Insights" : "Crop Doctor")}
                className="text-xs font-bold text-[#27764a]"
              >
                {isBuyer ? "View prices" : "Crop health →"}
              </button>
            }
          />
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:px-6">
            {crops.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-xl border border-[#e6ebe3]">
                <img onError={imageFallback} src={c.image} alt={c.name} className="h-28 w-full object-cover" />
                <div className="p-3">
                  <div className="flex items-center justify-between gap-1">
                    <b className="text-sm text-[#143d2a]">{c.name}</b>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${c.color}`}>{c.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#859087]">
                    {c.variety} · {c.stage}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9eee7]">
                    <div className="h-full rounded-full bg-[#4b9b68]" style={{ width: `${c.progress}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-[#849087]">
                    <span>Season progress</span>
                    <b>{c.progress}%</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead
            title={isBuyer ? "Recent offers" : "Today’s priorities"}
            sub={isBuyer ? "Offers created in this session" : "Actionable next steps based on telemetry"}
          />
          {isBuyer && offers.length > 0 ? (
            <div className="space-y-3 p-5">
              {offers.slice(0, 3).map((o, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-[#f5f8f2] p-3">
                  <div>
                    <b className="text-sm">{o.crop}</b>
                    <p className="text-xs text-[#829084]">₹{o.amount.toLocaleString("en-IN")}/quintal</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">{o.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 p-5">
              {[
                {
                  icon: Droplets,
                  t: "Run Smart Irrigation recommendation",
                  s: "Assess 72h Open-Meteo rainfall forecast against soil moisture",
                  c: "green",
                  target: "Smart Irrigation" as Section,
                },
                {
                  icon: Leaf,
                  t: "Scout mustard and wheat leaves",
                  s: "Upload a leaf photo in Crop Doctor for field inspection guidelines",
                  c: "amber",
                  target: "Crop Doctor" as Section,
                },
                {
                  icon: TrendingUp,
                  t: "Calculate net mandi realization",
                  s: "Deduct transport & handling costs from current APMC modal price",
                  c: "green",
                  target: "Mandi Insights" as Section,
                },
              ].map((t) => (
                <button
                  key={t.t}
                  onClick={() => navTo(t.target)}
                  className="flex w-full items-start gap-3 text-left hover:bg-[#f6f9f3] p-2 rounded-xl transition"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      t.c === "amber" ? "bg-amber-100 text-amber-800" : "bg-[#eaf4e8] text-[#2c7a4d]"
                    }`}
                  >
                    <t.icon size={17} />
                  </span>
                  <span className="flex-1">
                    <b className="text-sm text-[#143e2b]">{t.t}</b>
                    <span className="mt-1 block text-xs leading-5 text-[#849087]">{t.s}</span>
                  </span>
                  <ArrowUpRight size={15} className="mt-1 text-[#8a9a8c]" />
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* 3 Quick Cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        <QuickCard
          img="https://images.unsplash.com/photo-1523742815158-2b2c2f7c2a5b?auto=format&fit=crop&w=700&q=80"
          title="Crop Doctor"
          sub="Guided visual inspection checklist and expert review workflow."
          cta="Check crop health"
          onClick={() => navTo("Crop Doctor")}
        />
        <QuickCard
          img="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80"
          title="Mandi intelligence"
          sub="APMC arrival rates, MSP references, and net proceeds calculator."
          cta="Compare prices"
          onClick={() => navTo("Mandi Insights")}
        />
        <QuickCard
          img="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80"
          title="Direct marketplace"
          sub="Connect verified crop listings with buyers and FPOs directly."
          cta="Explore marketplace"
          onClick={() => navTo("Produce Marketplace")}
        />
      </div>
    </div>
  );
}

function QuickCard({
  img,
  title,
  sub,
  cta,
  onClick,
}: {
  img: string;
  title: string;
  sub: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-[#e4e9df] bg-white text-left shadow-[0_4px_20px_rgba(30,67,43,.035)] transition hover:-translate-y-1 hover:shadow-lg"
    >
      <img onError={imageFallback} src={img} alt="" className="h-32 w-full object-cover transition group-hover:scale-[1.02]" />
      <div className="p-5">
        <h3 className="font-bold text-[#143e2b]">{title}</h3>
        <p className="mt-2 min-h-10 text-sm leading-5 text-[#7b897d]">{sub}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#247449]">
          {cta} <ArrowRight size={15} />
        </span>
      </div>
    </button>
  );
}

function Marketplace({ listings, isBuyer, setOffer, notify }: any) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-[#dcefe0] p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-25">
          <img onError={imageFallback} src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80" className="h-full w-full object-cover" alt="" />
        </div>
        <div className="relative max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2c8150]">Farm direct · fairer trade</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{isBuyer ? "Source produce closer to the farm." : "Your harvest deserves a better market."}</h2>
          <p className="mt-2 text-sm leading-6 text-[#637b68]">Browse quality crop listings, compare asking prices, and start a direct conversation with the grower.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Available produce</h2>
          <p className="mt-1 text-xs text-[#849087]">{listings.length} listings · active marketplace</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((l: any) => (
          <Panel key={l.id} className="overflow-hidden">
            <div className="relative">
              <img onError={imageFallback} src={l.image} alt={l.crop} className="h-48 w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#2b7047]">{l.tag}</span>
              <button onClick={() => notify("Listing shortlisted in this session")} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#386c4a]">
                ♡
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{l.crop}</h3>
                  <p className="mt-1 text-xs text-[#839087]">{l.variety}</p>
                </div>
                <span className="whitespace-nowrap text-lg font-bold text-[#1c633d]">
                  ₹{l.price.toLocaleString("en-IN")}
                  <small className="block text-right text-[10px] font-normal text-[#849087]">per quintal</small>
                </span>
              </div>
              <div className="mt-4 space-y-2 text-xs text-[#758478]">
                <div className="flex items-center gap-2">
                  <PackageCheck size={14} />
                  {l.qty}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {l.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  {l.seller}
                </div>
              </div>
              <button
                onClick={() => (isBuyer ? setOffer(l.id) : notify("Open the Buyer / FPO workspace to test submitting an offer"))}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#155b38] p-3 text-sm font-bold text-white"
              >
                {isBuyer ? "Make an offer" : "View buyer offer flow"}
                <ArrowRight size={16} />
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {listings.length === 0 && <div className="rounded-2xl border border-dashed p-12 text-center text-[#819085]">No listings match this search.</div>}
    </div>
  );
}

function Machinery({ notify, role }: any) {
  const [bookings, setBookings] = useState<number[]>([]);
  const data = [
    { n: "Mahindra 575 DI Tractor", s: "45 HP · With operator", p: 950, u: "hour", loc: "Sonipat · 8 km", img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=700&q=80" },
    { n: "Happy Seeder", s: "Zero-till sowing · 7 feet", p: 1800, u: "acre", loc: "Gohana · 14 km", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80" },
    { n: "Combine Harvester", s: "Multi-crop · seasonal booking", p: 2200, u: "acre", loc: "Rohtak · 26 km", img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Available equipment", v: "24", i: Tractor },
          { t: "Local service radius", v: "30 km", i: MapPin },
          { t: "Your demo bookings", v: String(bookings.length), i: CalendarDays },
        ].map((x) => (
          <Panel key={x.t} className="p-5">
            <x.i className="text-[#398357]" />
            <p className="mt-3 text-xs text-[#819085]">{x.t}</p>
            <b className="mt-1 block text-2xl">{x.v}</b>
          </Panel>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {data.map((d, i) => (
          <Panel key={d.n} className="overflow-hidden">
            <img onError={imageFallback} src={d.img} alt={d.n} className="h-44 w-full object-cover" />
            <div className="p-5">
              <h3 className="font-bold">{d.n}</h3>
              <p className="mt-1 text-xs text-[#839087]">{d.s}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-xl font-bold text-[#226b43]">
                  ₹{d.p.toLocaleString("en-IN")}
                  <small className="text-xs font-normal text-[#839087]"> / {d.u}</small>
                </span>
                <span className="text-xs text-[#839087]">{d.loc}</span>
              </div>
              <button
                onClick={() => {
                  setBookings((b) => [...b, i]);
                  notify("Booking request logged for " + d.n);
                }}
                className="mt-5 w-full rounded-xl bg-[#155b38] p-3 text-sm font-bold text-white"
              >
                {bookings.includes(i) ? "Request recorded" : "Request booking"}
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Residue({ notify }: any) {
  const data = [
    { t: "Wheat straw bales", s: "Bedding · compost · feed", p: "₹3,200 / tonne", l: "Sonipat", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80" },
    { t: "Rice straw", s: "Biomass and composting", p: "₹1,850 / tonne", l: "Karnal", img: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=700&q=80" },
    { t: "Mustard stalks", s: "Fuel and organic matter", p: "Negotiable", l: "Panipat", img: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=80" },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((d) => (
        <Panel key={d.t} className="overflow-hidden">
          <img onError={imageFallback} src={d.img} alt={d.t} className="h-44 w-full object-cover" />
          <div className="p-5">
            <span className="rounded-full bg-[#eaf4e7] px-2.5 py-1 text-[10px] font-bold text-[#34794d]">CIRCULAR AGRICULTURE</span>
            <h3 className="mt-3 font-bold">{d.t}</h3>
            <p className="mt-1 text-sm text-[#819085]">{d.s}</p>
            <div className="mt-4 flex justify-between text-sm">
              <b>{d.p}</b>
              <span className="text-[#839087]">{d.l}</span>
            </div>
            <button onClick={() => notify(`Interest recorded for ${d.t}`)} className="mt-5 w-full rounded-xl bg-[#155b38] p-3 text-sm font-bold text-white">
              Express interest
            </button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Community({ notify }: any) {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([
    {
      name: "Suresh Malik",
      loc: "Karnal, Haryana",
      time: "2 hours ago",
      tag: "Wheat",
      text: "What should I check before the final irrigation at grain filling? Soil moisture seems moderate.",
      likes: 12,
    },
    {
      name: "Meena Rani",
      loc: "Sonipat, Haryana",
      time: "Yesterday",
      tag: "Mustard",
      text: "Sharing a reminder: scout both sides of mustard leaves and note any new spots after humid weather.",
      likes: 8,
    },
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Panel className="p-5">
        <h3 className="font-bold">Share with your farming community</h3>
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder="Ask a question, share a field observation…"
          rows={3}
          className="mt-4 w-full resize-y rounded-xl border border-[#dfe7dc] p-3 text-sm outline-none focus:border-[#4d9868]"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              if (!post.trim()) return;
              setPosts((p) => [{ name: "You", loc: "Sonipat, Haryana", time: "Just now", tag: "Community", text: post, likes: 0 }, ...p]);
              setPost("");
              notify("Post published to community.");
            }}
            className="rounded-xl bg-[#155b38] px-4 py-2.5 text-sm font-bold text-white"
          >
            Publish post
          </button>
        </div>
      </Panel>
      {posts.map((p, i) => (
        <Panel key={i} className="p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e5f0df] font-bold text-[#34784c]">{p.name[0]}</div>
            <div className="flex-1">
              <b className="text-sm">{p.name}</b>
              <p className="text-xs text-[#849087]">
                {p.loc} · {p.time}
              </p>
            </div>
            <span className="rounded-full bg-[#eef5e9] px-2.5 py-1 text-[10px] font-bold text-[#36794e]">{p.tag}</span>
          </div>
          <p className="mt-4 text-sm leading-6">{p.text}</p>
          <div className="mt-4 flex gap-4 border-t border-[#edf0ea] pt-3">
            <button onClick={() => notify("Helpful vote recorded")} className="text-xs font-semibold text-[#718176]">
              ♡ {p.likes} helpful
            </button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Schemes({ notify }: any) {
  const data = [
    { n: "PM-KISAN Samman Nidhi", d: "Income support for eligible landholding farmer families.", url: "https://pmkisan.gov.in/", c: "Income support" },
    { n: "Pradhan Mantri Fasal Bima Yojana", d: "Crop insurance information and seasonal enrolment guidance.", url: "https://pmfby.gov.in/", c: "Crop insurance" },
    { n: "Soil Health Card", d: "Soil testing and nutrient-management information.", url: "https://soilhealth.dac.gov.in/", c: "Soil health" },
    { n: "e-NAM", d: "National Agriculture Market information and unified market access.", url: "https://www.enam.gov.in/", c: "Market access" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#e2f0df] p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#2d794a]">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Agricultural Support Directory</h2>
            <p className="mt-1 text-sm text-[#69806c]">Verified links to official government schemes and portals.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((d) => (
          <Panel key={d.n} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-[#edf5e8] px-3 py-1 text-[10px] font-bold text-[#36794d]">{d.c}</span>
              <ShieldCheck size={18} className="text-[#4c8b60]" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{d.n}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-[#78877b]">{d.d}</p>
            <div className="mt-4 flex gap-3">
              <a href={d.url} target="_blank" rel="noreferrer" className="rounded-xl bg-[#155b38] px-4 py-2.5 text-sm font-bold text-white">
                Open official site ↗
              </a>
              <button onClick={() => notify(`${d.n} saved in your session`)} className="rounded-xl border border-[#dfe7dc] px-4 py-2.5 text-sm font-bold">
                Save
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

