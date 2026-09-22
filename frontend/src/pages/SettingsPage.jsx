import React from "react";
import { useThemeStore } from "../store/useThemeStore.js";

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset"
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="h-full pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Theme Settings</h1>
            <p className="text-base-content/60">Choose your favorite theme</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors border-2
                  ${theme === t ? "border-primary bg-primary/10" : "border-transparent hover:bg-base-200"}`}
                onClick={() => setTheme(t)}
              >
                <div data-theme={t} className="w-full h-12 rounded-md shadow-sm border border-base-content/10 overflow-hidden flex">
                  <div className="flex-1 bg-base-100 flex items-center justify-center">
                    <span className="text-xs text-base-content font-medium">A</span>
                  </div>
                  <div className="w-1/3 bg-primary"></div>
                  <div className="w-1/3 bg-secondary"></div>
                </div>
                <span className="text-xs font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
