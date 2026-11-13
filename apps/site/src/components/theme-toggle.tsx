import { useLanguage } from "@/components/language-provider";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { t } = useLanguage();
  const [light, setLight] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("oprynex-theme") === "light";
    setLight(saved);
    document.documentElement.classList.toggle("light", saved);
  }, []);
  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("oprynex-theme", next ? "light" : "dark");
  }
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={light ? t("Включить тёмную тему") : t("Включить светлую тему")} title={light ? t("Тёмная тема") : t("Светлая тема")} className="shrink-0 text-gold">{light ? <Moon /> : <Sun />}</Button>;
}