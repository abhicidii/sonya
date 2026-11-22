import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export type ThemePref = Theme | "system";

const KEY = "sonya-theme";
const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return "light";
}

function resolve(p: ThemePref): Theme {
  return p === "system" ? (mq?.matches ? "dark" : "light") : p;
}

function apply(p: ThemePref) {
  document.documentElement.dataset.theme = resolve(p);
  document.documentElement.dataset.themePref = p;
}

// One app-wide listener: when the preference is "system", follow the OS live.
mq?.addEventListener("change", () => {
  if (readPref() === "system") apply("system");
});
if (typeof document !== "undefined") apply(readPref());

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Theme hook. `pref` is what the user picked (light / dark / system),
 * `theme` is what is rendered right now.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(currentTheme);
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setThemeState(currentTheme());
      setPrefState(readPref());
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-theme-pref"] });
    return () => obs.disconnect();
  }, []);
  const setPref = useCallback((p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* storage unavailable */
    }
    apply(p);
  }, []);
  return {
    theme,
    pref,
    setPref,
    setTheme: setPref as (t: Theme) => void,
    toggle: () => setPref(theme === "dark" ? "light" : "dark"),
  };
}
