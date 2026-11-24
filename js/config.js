export const GAME_CONFIG = {
  width: 400,
  height: 600,
  wallPad: 12,
  floorPad: 12,
  dropY: 46,
  dangerLineY: 105,
  dangerGraceSeconds: 2.5,
  maxSpawnTier: 4, // Asteroit -> Venüs arası doğar
  gravity: 1280,
  subSteps: 8,
  comboWindowMs: 2200,
  feverMax: 100,
  feverDurationMs: 8000,
  zeroGDurationMs: 3200,
  magnetDurationMs: 3500,
  quantumRadius: 20,
  quantumInterval: 12,
};

export const PLANETS = [
  { tier: 0, name: "Asteroit", radius: 16, color: "#94a3b8", glow: "#cbd5e1", score: 2 },
  { tier: 1, name: "Ay", radius: 22, color: "#e2e8f0", glow: "#f8fafc", score: 4 },
  { tier: 2, name: "Merkür", radius: 28, color: "#f59e0b", glow: "#fbbf24", score: 8 },
  { tier: 3, name: "Mars", radius: 35, color: "#ef4444", glow: "#f87171", score: 16 },
  { tier: 4, name: "Venüs", radius: 43, color: "#ec4899", glow: "#f472b6", score: 32 },
  { tier: 5, name: "Dünya", radius: 52, color: "#3b82f6", glow: "#60a5fa", score: 64, isEarth: true },
  { tier: 6, name: "Neptün", radius: 62, color: "#06b6d4", glow: "#22d3ee", score: 128 },
  { tier: 7, name: "Satürn", radius: 73, color: "#eab308", glow: "#fde047", score: 256, hasRing: true },
  { tier: 8, name: "Güneş", radius: 85, color: "#f97316", glow: "#fb923c", score: 512, isStar: true },
  { tier: 9, name: "Nötron", radius: 97, color: "#a855f7", glow: "#c084fc", score: 1024, isPulsar: true },
  { tier: 10, name: "Kara Delik", radius: 110, color: "#0f172a", glow: "#818cf8", score: 2048, isBlackHole: true },
];

export const THEMES = {
  cosmic: {
    id: "cosmic",
    name: "Kozmik Uzay",
    desc: "Asteroit'ten Kara Delik'e klasik uzay evrimi.",
    icon: "🪐",
    cost: 0,
    items: [
      { name: "Asteroit", color: "#94a3b8", glow: "#cbd5e1" },
      { name: "Ay", color: "#e2e8f0", glow: "#f8fafc" },
      { name: "Merkür", color: "#f59e0b", glow: "#fbbf24" },
      { name: "Mars", color: "#ef4444", glow: "#f87171" },
      { name: "Venüs", color: "#ec4899", glow: "#f472b6" },
      { name: "Dünya", color: "#3b82f6", glow: "#60a5fa", isEarth: true },
      { name: "Neptün", color: "#06b6d4", glow: "#22d3ee" },
      { name: "Satürn", color: "#eab308", glow: "#fde047", hasRing: true },
      { name: "Güneş", color: "#f97316", glow: "#fb923c", isStar: true },
      { name: "Nötron", color: "#a855f7", glow: "#c084fc", isPulsar: true },
      { name: "Kara Delik", color: "#0f172a", glow: "#818cf8", isBlackHole: true },
    ],
  },
  cyber: {
    id: "cyber",
    name: "Neon Cyber AI",
    desc: "CODDIOM özel teması: Bit'ten Tekillik AI'a dijital evrim.",
    icon: "🤖",
    cost: 80,
    items: [
      { name: "Bit", color: "#38bdf8", glow: "#7dd3fc" },
      { name: "Byte", color: "#2dd4bf", glow: "#5eead4" },
      { name: "Çip", color: "#4ade80", glow: "#86efac" },
      { name: "Nöron", color: "#a3e635", glow: "#bef264" },
      { name: "Çekirdek", color: "#facc15", glow: "#fde047" },
      { name: "Vektör", color: "#fb923c", glow: "#fdba74" },
      { name: "Ajan", color: "#f43f5e", glow: "#fb7185" },
      { name: "Sinir Ağı", color: "#e879f9", glow: "#f0abfc", hasRing: true },
      { name: "LLM", color: "#a855f7", glow: "#c084fc", isStar: true },
      { name: "Kuantum", color: "#22d3ee", glow: "#67e8f9", isPulsar: true },
      { name: "Tekillik AI", color: "#090d1e", glow: "#22d3ee", isBlackHole: true },
    ],
  },
  kawaii: {
    id: "kawaii",
    name: "Kawaii Tatlılar",
    desc: "Pastel renkli makaron, donut ve tatlı evrimi.",
    icon: "🍩",
    cost: 100,
    items: [
      { name: "Üzüm", color: "#a855f7", glow: "#d8b4fe" },
      { name: "Çilek", color: "#fb7185", glow: "#fda4af" },
      { name: "Makaron", color: "#34d399", glow: "#6ee7b7" },
      { name: "Kurabiye", color: "#d97706", glow: "#fbbf24" },
      { name: "Donut", color: "#f472b6", glow: "#f9a8d4" },
      { name: "Cupcake", color: "#60a5fa", glow: "#93c5fd" },
      { name: "Puding", color: "#facc15", glow: "#fef08a" },
      { name: "Pancake", color: "#f59e0b", glow: "#fde68a", hasRing: true },
      { name: "Pasta", color: "#ec4899", glow: "#f472b6", isStar: true },
      { name: "Bubble Tea", color: "#c084fc", glow: "#e9d5ff", isPulsar: true },
      { name: "Dev Pasta", color: "#be185d", glow: "#fbcfe8", isBlackHole: true },
    ],
  },
};

export function getPlanetSpec(tier, themeId = "cosmic") {
  const base = PLANETS[tier];
  const theme = THEMES[themeId] || THEMES.cosmic;
  const themed = theme.items[tier] || {};
  return { ...base, ...themed };
}

export function getScoreForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(350 * (level - 1) + (180 * (level - 1) * (level - 2)) / 2);
}

export function getLevelParams(level) {
  return {
    level,
    gravityMult: Math.min(1.55, 1 + (level - 1) * 0.08),
    restitution: Math.min(0.42, 0.22 + (level - 1) * 0.03),
    dangerLineY: Math.min(155, GAME_CONFIG.dangerLineY + Math.max(0, level - 2) * 8),
    frozenChance: level >= 2 ? Math.min(0.32, (level - 1) * 0.08) : 0,
    bumperCount: level >= 3 ? Math.min(3, Math.floor((level - 1) / 2)) : 0,
    shotTimerSec: level >= 4 ? Math.max(5.5, 11 - (level - 4) * 1.0) : 0,
  };
}

export const GAME_MODES = {
  classic: { id: "classic", label: "🪐 Klasik", desc: "Taşana kadar oyna" },
  rush: { id: "rush", label: "⚡ 90sn Rush", duration: 90, desc: "90 saniyede rekor kır" },
  daily: { id: "daily", label: "📅 Günlük", desc: "Bugünün sabit sırası" },
};

export const ACHIEVEMENTS = [
  { id: "first_earth", title: "Mavi Nokta", desc: "Seviye 6'ya (Dünya) ulaş", reward: 25, icon: "🌍" },
  { id: "first_saturn", title: "Halkalı Dev", desc: "Seviye 8'e (Satürn) ulaş", reward: 50, icon: "🪐" },
  { id: "big_bang", title: "Evren Yaratıcısı", desc: "İki Kara Delik ile Big Bang yap", reward: 150, icon: "💥" },
  { id: "combo_5", title: "Kombo Ustası", desc: "5x Kombo zinciri yakala", reward: 40, icon: "⚡" },
  { id: "score_5000", title: "Kozmik Efsane", desc: "Tek elde 5.000+ skora ulaş", reward: 75, icon: "👑" },
  { id: "rush_1500", title: "Hız Tutkunu", desc: "90sn Rush'ta 1.500+ skor yap", reward: 45, icon: "⏱️" },
];

export const DAILY_MISSIONS_TEMPLATE = [
  { id: "merge_20", title: "20 Birleşme Yap", target: 20, reward: 30, type: "merges" },
  { id: "combo_3", title: "3x Kombo Yakala", target: 3, reward: 35, type: "maxCombo" },
  { id: "reach_saturn", title: "Satürn'e Ulaş (Seviye 8)", target: 7, reward: 60, type: "maxTier" },
  { id: "score_2500", title: "Tek Elde 2.500 Skor", target: 2500, reward: 50, type: "bestRunScore" },
];
