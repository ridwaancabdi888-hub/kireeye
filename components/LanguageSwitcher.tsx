"use client";

import { useEffect, useState } from "react";

const languages = [
  { code: "so", label: "SO", name: "Somali", dir: "ltr" },
  { code: "en", label: "EN", name: "English", dir: "ltr" },
  { code: "ar", label: "AR", name: "العربية", dir: "rtl" },
] as const;

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("so");

  useEffect(() => {
    const saved = localStorage.getItem("kireeye-language") || "so";
    setLanguage(saved);
    const selected = languages.find(item => item.code === saved) || languages[0];
    document.documentElement.lang = selected.code;
    document.documentElement.dir = selected.dir;
    document.cookie = `kireeye-language=${selected.code}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  function change(code: string) {
    const selected = languages.find(item => item.code === code) || languages[0];
    setLanguage(selected.code);
    localStorage.setItem("kireeye-language", selected.code);
    document.cookie = `kireeye-language=${selected.code}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = selected.code;
    document.documentElement.dir = selected.dir;
    window.dispatchEvent(new CustomEvent("kireeye-language-change", { detail: selected.code }));
    window.location.reload();
  }

  return <div className="language-switcher" aria-label="Choose language">
    {languages.map(item => <button key={item.code} type="button" title={item.name} className={`language-button ${language === item.code ? "active" : ""}`} onClick={() => change(item.code)}>{item.label}</button>)}
  </div>;
}
