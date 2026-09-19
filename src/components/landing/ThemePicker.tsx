// Opera AI — designed & engineered by Gry KJ
import { useMemo } from "react";
import { PALETTES, paletteColors } from "@/lib/themes";

const WORDS = [
  "Opera", "AI", "orbit", "code", "dream", "build", "ship", "fast", "secure", "create",
  "chat", "studio", "cloud", "learn", "grow", "spark", "flow", "vision", "pixel", "logic",
  "galaxy", "planet", "star", "nova", "pulse", "signal", "neural", "vector", "matrix", "quantum",
  "design", "craft", "shape", "render", "compose", "imagine", "invent", "explore", "launch", "scale",
  "أوبرا", "ذكاء", "إبداع", "كود", "مدار", "فضاء", "نجم", "ضوء", "لون", "حلم",
  "ابتكار", "سرعة", "أمان", "تصميم", "مستقبل", "طاقة", "فكرة", "بناء", "إطلاق", "نمو",
  "secure", "private", "encrypted", "verified", "trusted", "swift", "smooth", "bright", "bold", "clear",
  "terminal", "editor", "preview", "deploy", "commit", "branch", "merge", "debug", "refactor", "test",
  "image", "canvas", "brush", "palette", "gradient", "glow", "shadow", "light", "depth", "motion",
  "hello", "مرحباً", "hola", "bonjour", "ciao", "hallo", "olá", "привет", "こんにちは", "안녕",
];

export function ThemePicker() {
  const words = useMemo(
    () => PALETTES.slice(0, 100).map((p, i) => ({ id: p.id, name: p.name, color: paletteColors(p).primary, word: WORDS[i] ?? p.name })),
    [],
  );

  return (
    <section id="themes" className="relative px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="reveal mx-auto mb-10 max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">05 — 100 colors</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-5xl">One word. One hundred colors.</h2>
          <p className="mt-4 text-muted-foreground">
            Every word below is painted in its own unique color from the Opera AI spectrum — a hundred shades, one voice.
          </p>
        </div>

        <div className="reveal glass-strong rounded-3xl p-6 sm:p-10">
          <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-center font-display text-xl font-extrabold leading-relaxed sm:text-3xl">
            {words.map((w, i) => (
              <span
                key={w.id}
                title={w.name}
                className="inline-block transition-transform hover:scale-125"
                style={{ color: w.color, textShadow: `0 0 18px ${w.color}55`, animationDelay: `${i * 30}ms` }}
              >
                {w.word}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
