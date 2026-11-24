import { DAILY_MISSIONS_TEMPLATE, ACHIEVEMENTS } from "./config.js";

const STORAGE_KEY = "coddiom_nebula_drop_v1";
const RUN_STORAGE_KEY = "coddiom_nebula_drop_run_v1";

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultState() {
  return {
    bestScore: 0,
    bestRushScore: 0,
    bestDailyScore: 0,
    dailyScoreDate: getTodayKey(),
    stardust: 60, // Yeni oyuncular güçleri deneyebilsin diye başlangıç bonusu
    unlockedTiers: [0, 1, 2, 3, 4],
    unlockedAchievements: [],
    activeTheme: "cosmic",
    unlockedThemes: ["cosmic"],
    musicEnabled: true,
    adsRemoved: false,
    onboardingSeen: false,
    playerName: "Sen",
    playerAvatar: "🧑‍🚀",
    stats: {
      totalGames: 0,
      totalMerges: 0,
      maxCombo: 0,
      bigBangs: 0,
    },
    loginStreak: 0,
    lastLoginDate: "",
    missionDate: getTodayKey(),
    missions: DAILY_MISSIONS_TEMPLATE.map((m) => ({
      ...m,
      progress: 0,
      claimed: false,
    })),
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const today = getTodayKey();
    if (parsed.missionDate !== today) {
      parsed.missionDate = today;
      parsed.missions = DAILY_MISSIONS_TEMPLATE.map((m) => ({
        ...m,
        progress: 0,
        claimed: false,
      }));
    }
    if (parsed.dailyScoreDate !== today) {
      parsed.dailyScoreDate = today;
      parsed.bestDailyScore = 0;
    }
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors
  }
}

export function unlockTier(meta, tier) {
  if (!meta.unlockedTiers.includes(tier)) {
    meta.unlockedTiers.push(tier);
    meta.unlockedTiers.sort((a, b) => a - b);
    saveMeta(meta);
  }
}

export function updateMissionProgress(meta, stats) {
  let newlyClaimedReward = 0;
  for (const m of meta.missions) {
    if (m.claimed) continue;
    if (m.type === "merges") {
      m.progress = Math.min(m.target, m.progress + (stats.mergesDelta || 0));
    } else if (m.type === "maxCombo") {
      m.progress = Math.max(m.progress, stats.combo || 0);
    } else if (m.type === "maxTier") {
      m.progress = Math.max(m.progress, stats.tier || 0);
    } else if (m.type === "bestRunScore") {
      m.progress = Math.max(m.progress, stats.score || 0);
    }

    if (m.progress >= m.target && !m.claimed) {
      m.claimed = true;
      m.progress = m.target;
      meta.stardust += m.reward;
      newlyClaimedReward += m.reward;
    }
  }
  saveMeta(meta);
  return newlyClaimedReward;
}

export function claimDailyLogin(meta) {
  const today = getTodayKey();
  if (meta.lastLoginDate === today) return null;
  const yesterday = getYesterdayKey();
  meta.loginStreak = meta.lastLoginDate === yesterday ? meta.loginStreak + 1 : 1;
  meta.lastLoginDate = today;
  const reward = 15 + Math.min(meta.loginStreak, 7) * 5;
  meta.stardust += reward;
  saveMeta(meta);
  return { streak: meta.loginStreak, reward };
}

export function checkAchievements(meta, stats) {
  const unlockedNow = [];
  const checks = {
    first_earth: (stats.tier || 0) >= 5,
    first_saturn: (stats.tier || 0) >= 7,
    big_bang: Boolean(stats.bigBang),
    combo_5: (stats.combo || 0) >= 5,
    score_5000: (stats.score || 0) >= 5000,
    rush_1500: stats.mode === "rush" && (stats.score || 0) >= 1500,
  };
  for (const ach of ACHIEVEMENTS) {
    if (!meta.unlockedAchievements.includes(ach.id) && checks[ach.id]) {
      meta.unlockedAchievements.push(ach.id);
      meta.stardust += ach.reward;
      unlockedNow.push(ach);
    }
  }
  if (unlockedNow.length > 0) saveMeta(meta);
  return unlockedNow;
}

export function saveActiveRun(runData) {
  try {
    localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(runData));
  } catch {
    // Ignore
  }
}

export function loadActiveRun() {
  try {
    const raw = localStorage.getItem(RUN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveRun() {
  try {
    localStorage.removeItem(RUN_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// Not: Canlıda bu listeyi CODDIOM FastAPI / Supabase endpoint'inden çekebilirsiniz.
export function getGalaxyLeaderboard(meta) {
  const rivals = [
    { name: "NovaPilot", score: 12400, badge: "🪐" },
    { name: "CoddiomBot", score: 8600, badge: "🤖" },
    { name: "NebulaQueen", score: 5400, badge: "✨" },
    { name: "AstroEren", score: 3100, badge: "🚀" },
    { name: "StarKid", score: 1450, badge: "🌙" },
    {
      name: meta.playerName || "Sen",
      score: meta.bestScore || 0,
      badge: meta.playerAvatar || "🧑‍🚀",
      isPlayer: true,
    },
  ];
  return rivals.sort((a, b) => b.score - a.score);
}
