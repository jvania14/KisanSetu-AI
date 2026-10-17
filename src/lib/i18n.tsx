import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  dashboard: { en: "Command Centre", hi: "कमांड सेंटर" },
  doctor: { en: "Crop Doctor", hi: "फसल डॉक्टर" },
  assistant: { en: "Kisan AI", hi: "किसान AI" },
  mandi: { en: "Mandi & Net Price", hi: "मंडी और शुद्ध आय" },
  market: { en: "Marketplace", hi: "बाज़ार" },
  profile: { en: "Farm Profile", hi: "खेत प्रोफ़ाइल" },
  signout: { en: "Sign out", hi: "साइन आउट" },
  greeting: { en: "Namaste", hi: "नमस्ते" },
  weather: { en: "Weather", hi: "मौसम" },
  crops: { en: "My crops", hi: "मेरी फसलें" },
  quick: { en: "Quick actions", hi: "त्वरित कार्य" },
  diagnose: { en: "Diagnose crop", hi: "फसल जाँचें" },
  ask: { en: "Ask Kisan AI", hi: "किसान AI से पूछें" },
  compare: { en: "Compare mandi prices", hi: "मंडी भाव तुलना" },
  sell: { en: "Sell produce", hi: "उपज बेचें" },
} as const;

export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("ks-lang");
    if (s === "hi" || s === "en") setLangState(s);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ks-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
