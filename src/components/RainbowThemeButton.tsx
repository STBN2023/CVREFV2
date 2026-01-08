import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

function randomHSL(hueBase: number, sat = 70, light = 50) {
  const hue = (hueBase + Math.floor(Math.random() * 60) - 30 + 360) % 360;
  return `${hue} ${sat}% ${light}%`;
}

function randomThemeVars() {
  const base = Math.floor(Math.random() * 360);
  return {
    "--background": randomHSL(base + 40, 100, 97),
    "--foreground": randomHSL(base, 80, 12),
    "--primary": randomHSL(base, 80, 30),
    "--primary-foreground": randomHSL(base, 100, 98),
    "--secondary": randomHSL(base + 60, 60, 85),
    "--secondary-foreground": randomHSL(base, 80, 20),
    "--accent": randomHSL(base + 120, 80, 60),
    "--accent-foreground": randomHSL(base, 100, 10),
    "--muted": randomHSL(base + 180, 40, 90),
    "--muted-foreground": randomHSL(base, 30, 40),
    "--brand-dark": randomHSL(base, 80, 20),
    "--brand-yellow": randomHSL(base + 60, 90, 60),
    "--brand-pale": randomHSL(base + 60, 90, 90),
    "--brand-blue": randomHSL(base + 200, 80, 45),
    "--brand-lightblue": randomHSL(base + 200, 80, 90),
  };
}

// Couleurs de la charte graphique d'origine (HSL exacts)
const ORIGINAL_THEME: Record<string, string> = {
  "--background": "0 0% 100%", // blanc
  "--foreground": "237 34% 18%", // #1D1E3D
  "--primary": "237 34% 18%", // #1D1E3D
  "--primary-foreground": "0 0% 100%", // blanc
  "--secondary": "45 78% 61%", // #EBC14A
  "--secondary-foreground": "237 34% 18%", // #1D1E3D
  "--accent": "212 63% 43%", // #266EB1
  "--accent-foreground": "0 0% 100%", // blanc
  "--muted": "43 89% 86%", // #FCE7B3
  "--muted-foreground": "237 34% 18%", // #1D1E3D
  "--brand-dark": "237 34% 18%", // #1D1E3D
  "--brand-yellow": "45 78% 61%", // #EBC14A
  "--brand-pale": "43 89% 86%", // #FCE7B3
  "--brand-blue": "212 63% 43%", // #266EB1
  "--brand-lightblue": "205 74% 92%", // #D9ECFB
};

export const RainbowThemeButton = () => {
  const [spinning, setSpinning] = useState(false);
  const clickTimeout = useRef<number | null>(null);

  const applyTheme = (vars: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  const handleClick = () => {
    setSpinning(true);
    applyTheme(randomThemeVars());
    setTimeout(() => setSpinning(false), 600);
  };

  const handleDoubleClick = () => {
    setSpinning(true);
    applyTheme(ORIGINAL_THEME);
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <Button
      onClick={handleClick}
      onDoubleClick={e => {
        e.preventDefault();
        handleDoubleClick();
      }}
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-50 bg-white/80 hover:bg-white border-2 border-brand-yellow shadow-lg"
      aria-label="Générer un thème arc-en-ciel"
      style={{ transition: "box-shadow 0.2s" }}
      title="Clic : thème aléatoire / Double-clic : thème d'origine"
    >
      <span className="sr-only">Changer le thème de couleurs</span>
      <svg
        width={32}
        height={32}
        viewBox="0 0 32 32"
        className={`transition-transform ${spinning ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff5e62" />
            <stop offset="20%" stopColor="#ff9966" />
            <stop offset="40%" stopColor="#f9d423" />
            <stop offset="60%" stopColor="#7fd8be" />
            <stop offset="80%" stopColor="#5e72eb" />
            <stop offset="100%" stopColor="#b16cea" />
          </linearGradient>
        </defs>
        <path
          d="M16 28a12 12 0 1 1 12-12"
          stroke="url(#rainbow)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx="28"
          cy="16"
          r="2.5"
          fill="url(#rainbow)"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <Sparkles
        className="absolute -top-2 -right-2 text-yellow-400 animate-pulse"
        size={18}
        aria-hidden="true"
      />
    </Button>
  );
};