import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  toggle: () => {
    const next = get().theme === "light" ? "dark" : "light";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("mytenant-theme", next);
    }
    set({ theme: next });
  },
  init: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("mytenant-theme") as "light" | "dark" | null;
    const theme = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
}));
