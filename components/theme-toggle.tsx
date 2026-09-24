"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const value = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
  }, []);
  return (
    <button
      data-theme-toggle
      className="focus-ring border academic-rule px-3 py-2 text-xs font-semibold uppercase tracking-[.12em]"
      onClick={() => {
        const value = !dark;
        setDark(value);
        document.documentElement.classList.toggle("dark", value);
        localStorage.setItem("theme", value ? "dark" : "light");
      }}
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
