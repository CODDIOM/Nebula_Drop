import {
  GAME_CONFIG,
  PLANETS,
  THEMES,
  GAME_MODES,
  ACHIEVEMENTS,
  getPlanetSpec,
  getScoreForLevel,
  getLevelParams,
} from "./config.js";
import { createBody, stepPhysics, applyQuakeImpulse } from "./physics.js";
import { renderGame, renderSlotPreview } from "./renderer.js";
import { sound } from "./audio.js";
import { ads } from "./ads.js";
import {
  loadMeta,
  saveMeta,
  unlockTier,
  updateMissionProgress,
  claimDailyLogin,
  checkAchievements,
  saveActiveRun,
  loadActiveRun,
  clearActiveRun,
  getTodayKey,
  getGalaxyLeaderboard,
} from "./meta.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextPreview");
const holdCanvas = document.getElementById("holdPreview");

const el = {
  score: document.getElementById("scoreValue"),
  best: document.getElementById("bestValue"),
  stardust: document.getElementById("stardustCount"),
  comboBadge: document.getElementById("comboBadge"),
  quantumBadge: document.getElementById("quantumBadge"),
  feverBar: document.getElementById("feverBar"),
  feverLabel: document.getElementById("feverLabel"),
  evolutionStrip: document.getElementById("evolutionStrip"),
  btnHold: document.getElementById("btnHold"),
  laserPrompt: document.getElementById("laserPrompt"),
  zeroGBanner: document.getElementById("zeroGBanner"),
  zeroGTimer: document.getElementById("zeroGTimer"),
  magnetBanner: document.getElementById("magnetBanner"),
  magnetTimer: document.getElementById("magnetTimer"),
  dangerBanner: document.getElementById("dangerBanner"),
  dangerTimer: document.getElementById("dangerTimer"),
  comboTimerTrack: document.getElementById("comboTimerTrack"),
  comboTimerFill: document.getElementById("comboTimerFill"),
  gameOverModal: document.getElementById("gameOverModal"),
  finalScore: document.getElementById("finalScore"),
  finalBest: document.getElementById("finalBest"),
  earnedStardust: document.getElementById("earnedStardust"),
  maxPlanetReached: document.getElementById("maxPlanetReached"),
  btnContinueAd: document.getElementById("btnContinueAd"),
  btnShareScore: document.getElementById("btnShareScore"),
  btnRestart: document.getElementById("btnRestart"),
  btnMusic: document.getElementById("btnMusic"),
  btnSound: document.getElementById("btnSound"),
  btnQuake: document.getElementById("btnQuake"),
  btnLaser: document.getElementById("btnLaser"),
  btnZeroG: document.getElementById("btnZeroG"),
  btnMagnet: document.getElementById("btnMagnet"),
  btnCancelLaser: document.getElementById("btnCancelLaser"),
  quakeMeta: document.getElementById("quakeMeta"),
  laserMeta: document.getElementById("laserMeta"),
  zeroGMeta: document.getElementById("zeroGMeta"),
  magnetMeta: document.getElementById("magnetMeta"),
  playerNameInput: document.getElementById("playerNameInput"),
  avatarPicker: document.getElementById("avatarPicker"),
  btnDex: document.getElementById("btnDex"),
  btnMissions: document.getElementById("btnMissions"),
  btnThemes: document.getElementById("btnThemes"),
  dexModal: document.getElementById("dexModal"),
  missionsModal: document.getElementById("missionsModal"),
  themesModal: document.getElementById("themesModal"),
  dexGrid: document.getElementById("dexGrid"),
  missionsList: document.getElementById("missionsList"),
  achievementsList: document.getElementById("achievementsList"),
  themesList: document.getElementById("themesList"),
  rushTimerPill: document.getElementById("rushTimerPill"),
  tabMissions: document.getElementById("tabMissions"),
  tabAchievements: document.getElementById("tabAchievements"),
  tabLeaderboard: document.getElementById("tabLeaderboard"),
  missionsSubDesc: document.getElementById("missionsSubDesc"),
  leaderboardPanel: document.getElementById("leaderboardPanel"),
  statsMiniGrid: document.getElementById("statsMiniGrid"),
  leaderboardList: document.getElementById("leaderboardList"),
  onboardingHint: document.getElementById("onboardingHint"),
  btnContinueRewarded: document.getElementById("btnContinueRewarded"),
  btnRewardedStardust: document.getElementById("btnRewardedStardust"),
  btnRemoveAds: document.getElementById("btnRemoveAds"),
  adBannerSlot: document.getElementById("adBannerSlot"),
  levelBadge: document.getElementById("levelBadge"),
  levelBar: document.getElementById("levelBar"),
  levelProgressText: document.getElementById("levelProgressText"),
  stageLevelPill: document.getElementById("stageLevelPill"),
  levelUpBanner: document.getElementById("levelUpBanner"),
  levelUpTitle: document.getElementById("levelUpTitle"),
  levelUpDesc: document.getElementById("levelUpDesc"),
  introOverlay: document.getElementById("introOverlay"),
  introStatsPill: document.getElementById("introStatsPill"),
  btnStartGame: document.getElementById("btnStartGame"),
  btnNewGameIntro: document.getElementById("btnNewGameIntro"),
  btnBrandHome: document.getElementById("btnBrandHome"),
};

let meta = loadMeta();
sound.setMusicEnabled(meta.musicEnabled !== false);
el.btnMusic.textContent = meta.musicEnabled !== false ? "🎵" : "🔕";

const state = {
  mode: "classic",
  rushTimeLeft: GAME_MODES.rush.duration,
  dailyRng: null,
  activeTheme: meta.activeTheme || "cosmic",
  level: 1,
  dangerLineY: GAME_CONFIG.dangerLineY,
  shotTimer: 0,
  obstacles: [],
  bodies: [],
  particles: [],
  shockwaves: [],
  floatingTexts: [],
  laserBeam: null,
  score: 0,
  maxTierThisRun: 0,
  current: { tier: 0, isQuantum: false },
  next: { tier: 1, isQuantum: false },
  hold: null,
  swappedThisTurn: false,
  dropCount: 0,
  aimX: GAME_CONFIG.width / 2,
  canDrop: true,
  dropCooldown: 0,
  combo: 0,
  lastMergeAt: 0,
  feverCharge: 0,
  feverTimer: 0,
  zeroGTimer: 0,
  magnetTimer: 0,
  shakeTime: 0,
  hitStopTimer: 0,
  flashAlpha: 0,
  dangerTimer: 0,
  dangerActive: false,
  introActive: true,
  gameOver: false,
  laserMode: false,
  freePowers: { quake: 1, laser: 1, zeroG: 1, magnet: 1 },
  continuedOnce: false,
};

function vibrate(ms) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore on unsupported browsers
    }
  }
}

function createDailyRng(dateStr) {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextRand() {
  return state.mode === "daily" && state.dailyRng ? state.dailyRng() : Math.random();
}

function randomSpawnTier() {
  return Math.floor(nextRand() * (GAME_CONFIG.maxSpawnTier + 1));
}

function getBestForMode() {
  if (state.mode === "rush") return meta.bestRushScore || 0;
  if (state.mode === "daily") return meta.bestDailyScore || 0;
  return meta.bestScore || 0;
}

function setBestForMode(score) {
  if (state.mode === "rush") {
    if (score > (meta.bestRushScore || 0)) meta.bestRushScore = score;
  } else if (state.mode === "daily") {
    if (score > (meta.bestDailyScore || 0)) {
      meta.bestDailyScore = score;
      meta.dailyScoreDate = getTodayKey();
    }
  } else if (score > meta.bestScore) {
    meta.bestScore = score;
  }
}

function persistClassicRun() {
  if (state.mode !== "classic" || state.gameOver) return;
  saveActiveRun({
    score: state.score,
    level: state.level,
    maxTierThisRun: state.maxTierThisRun,
    current: state.current,
    next: state.next,
    hold: state.hold,
    swappedThisTurn: state.swappedThisTurn,
    dropCount: state.dropCount,
    freePowers: state.freePowers,
    continuedOnce: state.continuedOnce,
    bodies: state.bodies.map((b) => ({
      tier: b.tier,
      isQuantum: Boolean(b.isQuantum),
      frozen: Boolean(b.frozen),
      x: b.x,
      y: b.y,
      vx: b.vx,
      vy: b.vy,
      angle: b.angle,
    })),
  });
}

function createNextQueueItem() {
  state.dropCount += 1;
  if (state.dropCount % GAME_CONFIG.quantumInterval === 0) {
    return { tier: -1, isQuantum: true, isFrozen: false };
  }
  const params = getLevelParams(state.level);
  const isFrozen = nextRand() < params.frozenChance;
  return { tier: randomSpawnTier(), isQuantum: false, isFrozen };
}

function syncLevelDifficulty() {
  const params = getLevelParams(state.level);
  state.dangerLineY = params.dangerLineY;

  const presets = [
    { id: "obs1", baseX: 200, y: 270, radius: 18, amp: 55, speed: 1.4, phase: 0 },
    { id: "obs2", baseX: 115, y: 365, radius: 16, amp: 35, speed: 1.8, phase: 1.8 },
    { id: "obs3", baseX: 285, y: 365, radius: 16, amp: 35, speed: 1.8, phase: 4.2 },
  ];
  while (state.obstacles.length < params.bumperCount && state.obstacles.length < presets.length) {
    const p = presets[state.obstacles.length];
    state.obstacles.push({ ...p, x: p.baseX });
  }
  if (state.obstacles.length > params.bumperCount) {
    state.obstacles = state.obstacles.slice(0, params.bumperCount);
  }
}

function thawNearbyFrozen(mx, my, maxRadius = 150) {
  let thawedCount = 0;
  for (const b of state.bodies) {
    if (!b.frozen) continue;
    const dx = b.x - mx;
    const dy = b.y - my;
    if (dx * dx + dy * dy <= (maxRadius + b.radius) * (maxRadius + b.radius)) {
      b.frozen = false;
      thawedCount += 1;
      spawnParticles(b.x, b.y, "#bae6fd", 12);
      addFloatingText(b.x, b.y - 10, "❄️ BUZ KIRILDI!", "#bae6fd", 14);
    }
  }
  if (thawedCount > 0) sound.playIceBreak();
}

function getLevelModText(lvl) {
  if (lvl === 1) return "Normal";
  if (lvl === 2) return "❄️ Buzlu + Hız";
  if (lvl === 3) return "🪨 1 Engel + Dar Alan";
  if (lvl === 4) return "⏱️ Süre Baskısı";
  if (lvl >= 5) return `🪨 ${getLevelParams(lvl).bumperCount} Engel • Hız x${getLevelParams(lvl).gravityMult.toFixed(2)}`;
  return "";
}

let levelBannerTimer = null;

function checkLevelUp() {
  let leveledUp = false;
  while (state.score >= getScoreForLevel(state.level + 1)) {
    state.level += 1;
    leveledUp = true;
    meta.stardust += 15;
  }
  if (leveledUp) {
    saveMeta(meta);
    syncLevelDifficulty();
    state.shotTimer = getLevelParams(state.level).shotTimerSec;
    sound.playLevelUp();
    vibrate([25, 25, 45]);
    spawnShockwave(GAME_CONFIG.width / 2, 240, 30, 210, "#a855f7");

    el.levelBadge.classList.remove("pulse");
    void el.levelBadge.offsetWidth;
    el.levelBadge.classList.add("pulse");

    el.levelUpTitle.textContent = `🚀 SEVİYE ${state.level}! (+15 ✦)`;
    el.levelUpDesc.textContent = `Yeni Zorluk: ${getLevelModText(state.level)}`;
    el.levelUpBanner.classList.remove("hidden");
    clearTimeout(levelBannerTimer);
    levelBannerTimer = setTimeout(() => {
      el.levelUpBanner.classList.add("hidden");
    }, 2200);
  }
}

function getItemRadius(item) {
  return item.isQuantum ? GAME_CONFIG.quantumRadius : PLANETS[item.tier].radius;
}

function clampAimX(x, item) {
  const r = getItemRadius(item);
  const minX = GAME_CONFIG.wallPad + r;
  const maxX = GAME_CONFIG.width - GAME_CONFIG.wallPad - r;
  return Math.max(minX, Math.min(maxX, x));
}

function spawnParticles(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 170;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3.5,
      color,
      life: 0.45,
      maxLife: 0.45,
    });
  }
}

function spawnShockwave(x, y, startRadius, maxRadius, color) {
  state.shockwaves.push({
    x,
    y,
    startRadius,
    maxRadius,
    color,
    life: 0.36,
    maxLife: 0.36,
  });
}

function addFloatingText(x, y, text, color = "#fbbf24", size = 16) {
  state.floatingTexts.push({
    x,
    y,
    text,
    color,
    size,
    life: 0.85,
    maxLife: 0.85,
  });
}

function updateHUD() {
  el.score.textContent = state.score.toLocaleString("tr-TR");
  el.best.textContent = getBestForMode().toLocaleString("tr-TR");
  el.stardust.textContent = meta.stardust;

  el.levelBadge.textContent = `LVL ${state.level}`;
  const prevLvlScore = getScoreForLevel(state.level);
  const nextLvlScore = getScoreForLevel(state.level + 1);
  const lvlPct = ((state.score - prevLvlScore) / Math.max(1, nextLvlScore - prevLvlScore)) * 100;
  el.levelBar.style.width = `${Math.min(100, Math.max(0, lvlPct))}%`;
  el.levelProgressText.textContent = `${state.score.toLocaleString("tr-TR")} / ${nextLvlScore.toLocaleString("tr-TR")}`;
  el.stageLevelPill.textContent = `LVL ${state.level} • ${getLevelModText(state.level)}`;

  if (state.mode === "rush") {
    const secs = Math.ceil(Math.max(0, state.rushTimeLeft));
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, "0");
    el.rushTimerPill.textContent = `⏱ ${m}:${s}`;
    el.rushTimerPill.classList.remove("hidden");
  } else {
    el.rushTimerPill.classList.add("hidden");
  }

  if (state.combo >= 2) {
    el.comboBadge.textContent = `x${state.combo} KOMBO`;
    el.comboBadge.classList.remove("hidden");
  } else {
    el.comboBadge.classList.add("hidden");
  }

  const untilQuantum =
    GAME_CONFIG.quantumInterval - (state.dropCount % GAME_CONFIG.quantumInterval);
  if (state.current.isQuantum) {
    el.quantumBadge.textContent = "🌈 AKTİF!";
  } else if (state.next.isQuantum) {
    el.quantumBadge.textContent = "🌈 SIRADAKİ!";
  } else {
    el.quantumBadge.textContent = `🌈 ${untilQuantum}`;
  }

  el.btnHold.disabled = state.gameOver || state.laserMode || state.swappedThisTurn;
  el.btnHold.classList.toggle("used", state.swappedThisTurn);

  const feverPct =
    state.feverTimer > 0
      ? (state.feverTimer / (GAME_CONFIG.feverDurationMs / 1000)) * 100
      : state.feverCharge;
  el.feverBar.style.width = `${Math.min(100, Math.max(0, feverPct))}%`;
  el.feverLabel.textContent = state.feverTimer > 0 ? "FEVER x2!" : "FEVER";

  // Power-up labels
  const updatePowerBtn = (btn, metaEl, key, cost) => {
    const free = state.freePowers[key];
    if (free > 0) {
      metaEl.textContent = `Ücretsiz (${free})`;
      btn.disabled = state.gameOver;
    } else {
      metaEl.textContent = `✦ ${cost}`;
      btn.disabled = state.gameOver || meta.stardust < cost;
    }
  };
  updatePowerBtn(el.btnQuake, el.quakeMeta, "quake", 25);
  updatePowerBtn(el.btnLaser, el.laserMeta, "laser", 35);
  updatePowerBtn(el.btnZeroG, el.zeroGMeta, "zeroG", 30);
  updatePowerBtn(el.btnMagnet, el.magnetMeta, "magnet", 35);

  renderEvolutionStrip();
}

function applyTheme(themeId) {
  state.activeTheme = themeId;
  meta.activeTheme = themeId;
  document.body.dataset.theme = themeId;
  saveMeta(meta);
  renderSlotPreview(nextCanvas, state.next, state.activeTheme);
  renderSlotPreview(holdCanvas, state.hold, state.activeTheme);
  renderEvolutionStrip();
}

function renderEvolutionStrip() {
  const activeTier = state.current.isQuantum ? -1 : state.current.tier;
  el.evolutionStrip.innerHTML = PLANETS.map((base, idx) => {
    const p = getPlanetSpec(base.tier, state.activeTheme);
    const unlocked = meta.unlockedTiers.includes(p.tier);
    const isActive = p.tier === activeTier;
    const node = `<div class="evo-node ${unlocked ? "unlocked" : ""} ${isActive ? "active" : ""}" title="${p.name} (Seviye ${p.tier + 1})" style="background:${p.color}; box-shadow:${unlocked ? `0 0 6px ${p.glow}` : "none"}"></div>`;
    return idx < PLANETS.length - 1 ? `${node}<span class="evo-arrow">›</span>` : node;
  }).join("");
}

function resetGame(nextMode = state.mode) {
  state.mode = nextMode;
  state.rushTimeLeft = GAME_MODES.rush.duration;
  state.dailyRng = nextMode === "daily" ? createDailyRng(getTodayKey()) : null;
  if (nextMode === "classic") clearActiveRun();

  document.querySelectorAll(".mode-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.mode === state.mode);
  });

  state.bodies = [];
  state.obstacles = [];
  state.particles = [];
  state.shockwaves = [];
  state.floatingTexts = [];
  state.laserBeam = null;
  state.score = 0;
  state.level = 1;
  state.shotTimer = 0;
  syncLevelDifficulty();
  state.maxTierThisRun = 0;
  state.dropCount = 0;
  state.hold = null;
  state.swappedThisTurn = false;
  state.current = { tier: randomSpawnTier(), isQuantum: false, isFrozen: false };
  state.next = createNextQueueItem();
  state.aimX = clampAimX(GAME_CONFIG.width / 2, state.current);
  state.canDrop = true;
  state.dropCooldown = 0;
  state.combo = 0;
  state.lastMergeAt = 0;
  state.feverCharge = 0;
  state.feverTimer = 0;
  state.zeroGTimer = 0;
  state.magnetTimer = 0;
  state.shakeTime = 0;
  state.hitStopTimer = 0;
  state.flashAlpha = 0;
  state.dangerTimer = 0;
  state.dangerActive = false;
  state.gameOver = false;
  state.laserMode = false;
  state.freePowers = { quake: 1, laser: 1, zeroG: 1, magnet: 1 };
  state.continuedOnce = false;

  el.gameOverModal.classList.add("hidden");
  el.laserPrompt.classList.add("hidden");
  el.zeroGBanner.classList.add("hidden");
  el.magnetBanner.classList.add("hidden");
  el.dangerBanner.classList.add("hidden");
  document.body.dataset.theme = state.activeTheme;
  renderSlotPreview(nextCanvas, state.next, state.activeTheme);
  renderSlotPreview(holdCanvas, state.hold, state.activeTheme);
  updateHUD();
}

function restoreClassicRunIfSaved() {
  const saved = loadActiveRun();
  if (!saved || !Array.isArray(saved.bodies) || saved.bodies.length === 0) {
    return false;
  }
  resetGame("classic");
  state.score = saved.score || 0;
  state.level = saved.level || 1;
  syncLevelDifficulty();
  state.shotTimer = getLevelParams(state.level).shotTimerSec;
  state.maxTierThisRun = saved.maxTierThisRun || 0;
  state.current = saved.current || state.current;
  state.next = saved.next || state.next;
  state.hold = saved.hold || null;
  state.swappedThisTurn = Boolean(saved.swappedThisTurn);
  state.dropCount = saved.dropCount || 0;
  state.freePowers = saved.freePowers || state.freePowers;
  state.continuedOnce = Boolean(saved.continuedOnce);
  state.bodies = saved.bodies.map((sb) => {
    const b = createBody(sb.tier, sb.x, sb.y, sb.vx, sb.vy, sb.isQuantum, sb.frozen);
    b.angle = sb.angle || 0;
    b.scalePop = 1;
    b.happyTimer = 0;
    return b;
  });
  renderSlotPreview(nextCanvas, state.next, state.activeTheme);
  renderSlotPreview(holdCanvas, state.hold, state.activeTheme);
  updateHUD();
  addFloatingText(GAME_CONFIG.width / 2, 160, "💾 OTURUM DEVAM ETTİRİLDİ", "#22d3ee", 15);
  return true;
}

function swapHold() {
  if (state.gameOver || state.laserMode || state.swappedThisTurn || !state.canDrop) return;
  if (!state.hold) {
    state.hold = { ...state.current };
    state.current = state.next;
    state.next = createNextQueueItem();
    renderSlotPreview(nextCanvas, state.next, state.activeTheme);
  } else {
    const temp = { ...state.current };
    state.current = { ...state.hold };
    state.hold = temp;
  }
  state.swappedThisTurn = true;
  state.aimX = clampAimX(state.aimX, state.current);
  renderSlotPreview(holdCanvas, state.hold, state.activeTheme);
  sound.playSwap();
  vibrate(8);
  updateHUD();
}

function dropCurrentPlanet() {
  if (!state.canDrop || state.gameOver || state.laserMode) return;
  if (!meta.onboardingSeen) {
    meta.onboardingSeen = true;
    saveMeta(meta);
    el.onboardingHint.classList.add("hidden");
  }
  const x = clampAimX(state.aimX, state.current);
  const body = createBody(
    state.current.tier,
    x,
    GAME_CONFIG.dropY,
    0,
    0,
    state.current.isQuantum,
    state.current.isFrozen
  );
  state.bodies.push(body);
  sound.playDrop();

  state.current = state.next;
  state.next = createNextQueueItem();
  state.swappedThisTurn = false;
  state.aimX = clampAimX(state.aimX, state.current);
  state.canDrop = false;
  state.dropCooldown = 0.42;
  state.shotTimer = getLevelParams(state.level).shotTimerSec;
  renderSlotPreview(nextCanvas, state.next, state.activeTheme);
  updateHUD();
  persistClassicRun();
}

function handleMerge(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;

  const now = performance.now();
  if (now - state.lastMergeAt <= GAME_CONFIG.comboWindowMs) {
    state.combo += 1;
  } else {
    state.combo = 1;
  }
  state.lastMergeAt = now;

  // Fever buildup
  if (state.feverTimer <= 0) {
    state.feverCharge = Math.min(GAME_CONFIG.feverMax, state.feverCharge + 14 + state.combo * 4);
    if (state.feverCharge >= GAME_CONFIG.feverMax) {
      state.feverTimer = GAME_CONFIG.feverDurationMs / 1000;
      state.feverCharge = 0;
      addFloatingText(GAME_CONFIG.width / 2, 160, "COSMIC FEVER! x2", "#fbbf24", 20);
    }
  }

  const feverMult = state.feverTimer > 0 ? 2 : 1;
  const comboMult = Math.min(4, 1 + (state.combo - 1) * 0.25);

  let didBigBang = false;

  // Case 1: Quantum Joker merges!
  if (a.isQuantum || b.isQuantum) {
    if (a.isQuantum && b.isQuantum) {
      // Double Quantum -> spawns Earth (Tier 5)
      const bonusTier = 5;
      const spawned = createBody(bonusTier, mx, my, 0, -50);
      state.bodies.push(spawned);
      state.maxTierThisRun = Math.max(state.maxTierThisRun, bonusTier);
      unlockTier(meta, bonusTier);
      const pts = Math.round(800 * feverMult * comboMult);
      state.score += pts;
      spawnParticles(mx, my, "#22d3ee", 28);
      spawnShockwave(mx, my, 20, 95, "#22d3ee");
      addFloatingText(mx, my, `KUANTUM SENTEZ! +${pts}`, "#22d3ee", 19);
      sound.playQuantum();
      vibrate([20, 20, 30]);
    } else {
      const target = a.isQuantum ? b : a;
      if (target.tier === PLANETS.length - 1) {
        // Quantum + Black Hole -> keep Black Hole & massive bonus
        const kept = createBody(target.tier, target.x, target.y, target.vx, target.vy);
        state.bodies.push(kept);
        const pts = Math.round(2500 * feverMult * comboMult);
        state.score += pts;
        state.shakeTime = 0.35;
        state.hitStopTimer = 0.09;
        state.flashAlpha = 0.25;
        spawnParticles(mx, my, "#818cf8", 30);
        spawnShockwave(mx, my, 40, 175, "#818cf8");
        addFloatingText(mx, my, `TEKİLLİK! +${pts}`, "#fbbf24", 20);
        sound.playQuantum();
        vibrate([30, 20, 40]);
      } else {
        const evolvedTier = target.tier + 1;
        const spec = getPlanetSpec(evolvedTier, state.activeTheme);
        const spawned = createBody(evolvedTier, target.x, target.y, target.vx * 0.4, -45);
        state.bodies.push(spawned);
        state.maxTierThisRun = Math.max(state.maxTierThisRun, evolvedTier);
        unlockTier(meta, evolvedTier);
        const pts = Math.round(spec.score * 1.5 * feverMult * comboMult);
        state.score += pts;
        spawnParticles(target.x, target.y, "#22d3ee", 20);
        spawnParticles(target.x, target.y, spec.glow, 14);
        spawnShockwave(target.x, target.y, spec.radius * 0.6, spec.radius * 1.9, "#22d3ee");
        addFloatingText(target.x, target.y - 12, `🌈 EVRİM! +${pts}`, "#22d3ee", 17);
        sound.playQuantum();
        vibrate(18);
      }
    }
  } else if (a.tier === PLANETS.length - 1) {
    // Two Black Holes -> BIG BANG!
    didBigBang = true;
    const bonus = Math.round(5000 * feverMult * comboMult);
    state.score += bonus;
    state.shakeTime = 0.45;
    state.hitStopTimer = 0.14;
    state.flashAlpha = 0.45;
    spawnParticles(mx, my, "#818cf8", 38);
    spawnParticles(mx, my, "#fbbf24", 24);
    spawnShockwave(mx, my, 45, 240, "#fbbf24");
    addFloatingText(mx, my, `BIG BANG! +${bonus}`, "#fbbf24", 22);
    sound.playMerge(10, state.combo);
    vibrate([40, 30, 60]);
  } else {
    const nextTier = a.tier + 1;
    const spec = getPlanetSpec(nextTier, state.activeTheme);
    const spawned = createBody(nextTier, mx, my, (a.vx + b.vx) * 0.3, -40);
    state.bodies.push(spawned);

    state.maxTierThisRun = Math.max(state.maxTierThisRun, nextTier);
    unlockTier(meta, nextTier);

    const pts = Math.round(spec.score * feverMult * comboMult);
    state.score += pts;
    spawnParticles(mx, my, spec.glow, 16);
    spawnShockwave(mx, my, spec.radius * 0.6, spec.radius * 1.85, spec.glow);
    if (nextTier >= 7) {
      state.hitStopTimer = 0.08;
      state.shakeTime = Math.max(state.shakeTime, 0.2);
      state.flashAlpha = 0.18;
    }
    addFloatingText(
      mx,
      my - 10,
      state.combo >= 2 ? `+${pts} (x${state.combo})` : `+${pts}`,
      spec.glow,
      state.combo >= 2 ? 18 : 15
    );
    sound.playMerge(nextTier, state.combo);
    vibrate(14);
  }

  setBestForMode(state.score);
  thawNearbyFrozen(mx, my);
  checkLevelUp();
  meta.stats = meta.stats || { totalGames: 0, totalMerges: 0, maxCombo: 0, bigBangs: 0 };
  meta.stats.totalMerges += 1;
  meta.stats.maxCombo = Math.max(meta.stats.maxCombo, state.combo);
  if (didBigBang) meta.stats.bigBangs += 1;

  const missionBonus = updateMissionProgress(meta, {
    mergesDelta: 1,
    combo: state.combo,
    tier: state.maxTierThisRun,
    score: state.score,
  });
  if (missionBonus > 0) {
    addFloatingText(GAME_CONFIG.width / 2, 120, `GÖREV TAMAM! +${missionBonus} ✦`, "#34d399", 16);
  }

  const unlockedAchs = checkAchievements(meta, {
    tier: state.maxTierThisRun,
    combo: state.combo,
    score: state.score,
    bigBang: didBigBang,
    mode: state.mode,
  });
  unlockedAchs.forEach((ach, idx) => {
    addFloatingText(
      GAME_CONFIG.width / 2,
      150 + idx * 24,
      `🏆 ${ach.title}! +${ach.reward} ✦`,
      "#fbbf24",
      15
    );
  });

  updateHUD();
  persistClassicRun();
}

function triggerGameOver(reason = "overflow") {
  state.gameOver = true;
  state.dangerActive = false;
  el.dangerBanner.classList.add("hidden");
  if (state.mode === "classic") clearActiveRun();
  sound.playGameOver();

  setBestForMode(state.score);
  const unlockedAchs = checkAchievements(meta, {
    tier: state.maxTierThisRun,
    combo: state.combo,
    score: state.score,
    mode: state.mode,
  });
  unlockedAchs.forEach((ach) => {
    addFloatingText(GAME_CONFIG.width / 2, 140, `🏆 ${ach.title}! +${ach.reward} ✦`, "#fbbf24", 15);
  });

  const stardustEarned = Math.max(5, Math.floor(state.score / 120));
  meta.stardust += stardustEarned;
  meta.stats = meta.stats || { totalGames: 0, totalMerges: 0, maxCombo: 0, bigBangs: 0 };
  meta.stats.totalGames += 1;
  saveMeta(meta);
  updateHUD();

  el.gameOverModal.querySelector(".modal-eyebrow").textContent =
    reason === "timeout" ? "SÜRE DOLDU (90sn RUSH)" : "KOZMİK ÇÖKÜŞ";
  el.finalScore.textContent = state.score.toLocaleString("tr-TR");
  el.finalBest.textContent = getBestForMode().toLocaleString("tr-TR");
  el.earnedStardust.textContent = `+${stardustEarned}`;
  el.maxPlanetReached.textContent = `Seviye ${state.level} • En Büyük: ${getPlanetSpec(state.maxTierThisRun, state.activeTheme).name}`;
  el.btnContinueRewarded.disabled = reason === "timeout" || state.continuedOnce;
  el.btnContinueAd.disabled = reason === "timeout" || state.continuedOnce || meta.stardust < 40;
  el.gameOverModal.classList.remove("hidden");
}

function consumePowerCost(key, cost) {
  if (state.freePowers[key] > 0) {
    state.freePowers[key] -= 1;
    return true;
  }
  if (meta.stardust >= cost) {
    meta.stardust -= cost;
    saveMeta(meta);
    return true;
  }
  return false;
}

// Power-Ups
el.btnQuake.addEventListener("click", () => {
  if (state.gameOver || state.bodies.length === 0) return;
  if (!consumePowerCost("quake", 25)) return;
  applyQuakeImpulse(state.bodies);
  const frozenOne = state.bodies.find((b) => b.frozen);
  if (frozenOne) {
    frozenOne.frozen = false;
    spawnParticles(frozenOne.x, frozenOne.y, "#bae6fd", 14);
    addFloatingText(frozenOne.x, frozenOne.y - 10, "❄️ BUZ KIRILDI!", "#bae6fd", 14);
  }
  state.shakeTime = 0.35;
  sound.playQuake();
  addFloatingText(GAME_CONFIG.width / 2, 220, "SOLAR QUAKE!", "#fbbf24", 20);
  updateHUD();
});

el.btnLaser.addEventListener("click", () => {
  if (state.gameOver || state.bodies.length === 0) return;
  if (state.laserMode) return;
  state.laserMode = true;
  el.laserPrompt.classList.remove("hidden");
  updateHUD();
});

el.btnCancelLaser.addEventListener("click", () => {
  state.laserMode = false;
  el.laserPrompt.classList.add("hidden");
  updateHUD();
});

el.btnZeroG.addEventListener("click", () => {
  if (state.gameOver || state.zeroGTimer > 0) return;
  if (!consumePowerCost("zeroG", 30)) return;
  state.zeroGTimer = GAME_CONFIG.zeroGDurationMs / 1000;
  el.zeroGBanner.classList.remove("hidden");
  sound.playZeroG();
  updateHUD();
});

el.btnMagnet.addEventListener("click", () => {
  if (state.gameOver || state.magnetTimer > 0 || state.bodies.length < 2) return;
  if (!consumePowerCost("magnet", 35)) return;
  state.magnetTimer = GAME_CONFIG.magnetDurationMs / 1000;
  el.magnetBanner.classList.remove("hidden");
  sound.playMagnet();
  addFloatingText(GAME_CONFIG.width / 2, 220, "🧲 MIKNATIS!", "#f472b6", 19);
  updateHUD();
});

function continueByClearingTop() {
  state.continuedOnce = true;
  const sorted = [...state.bodies].sort((a, b) => a.y - b.y);
  const toRemove = new Set(sorted.slice(0, 3).map((b) => b.id));
  state.bodies = state.bodies.filter((b) => {
    if (toRemove.has(b.id)) {
      spawnParticles(b.x, b.y, "#22d3ee", 14);
      return false;
    }
    return true;
  });
  state.gameOver = false;
  state.dangerTimer = 0;
  el.gameOverModal.classList.add("hidden");
  updateHUD();
}

// Continue with Rewarded Ad
el.btnContinueRewarded.addEventListener("click", async () => {
  if (state.continuedOnce) return;
  const ok = meta.adsRemoved ? true : await ads.showRewardedAd("Üstteki 3 Gezegeni Temizle");
  if (ok) continueByClearingTop();
});

// Continue with Stardust
el.btnContinueAd.addEventListener("click", () => {
  if (state.continuedOnce || meta.stardust < 40) return;
  meta.stardust -= 40;
  saveMeta(meta);
  continueByClearingTop();
});

let restartCount = 0;

el.btnRestart.addEventListener("click", async () => {
  restartCount += 1;
  if (!meta.adsRemoved && restartCount % 2 === 0) {
    await ads.showInterstitial();
  }
  resetGame(state.mode);
});

document.querySelectorAll(".mode-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    const mode = pill.dataset.mode;
    if (!GAME_MODES[mode]) return;
    resetGame(mode);
  });
});

el.btnShareScore.addEventListener("click", async () => {
  const maxName = getPlanetSpec(state.maxTierThisRun, state.activeTheme).name;
  const playerTag = `${meta.playerAvatar || "🧑‍🚀"} ${meta.playerName || "Sen"}`;
  const text = `🪐 CODDIOM NEBULA DROP (${playerTag})\nSkor: ${state.score.toLocaleString("tr-TR")} | Seviye: ${state.level} | Rekor: ${getBestForMode().toLocaleString("tr-TR")}\nEn Büyük Cisim: ${maxName}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Nebula Drop", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      el.btnShareScore.textContent = "✅ Kopyalandı!";
      setTimeout(() => {
        el.btnShareScore.textContent = "📤 Skoru Paylaş";
      }, 1500);
    }
  } catch {
    // User cancelled share
  }
});

el.btnSound.addEventListener("click", () => {
  const muted = sound.toggleMute();
  el.btnSound.textContent = muted ? "🔇" : "🔊";
});

el.btnMusic.addEventListener("click", () => {
  const next = !(meta.musicEnabled !== false);
  meta.musicEnabled = next;
  saveMeta(meta);
  sound.setMusicEnabled(next);
  el.btnMusic.textContent = next ? "🎵" : "🔕";
});

// Modals
function renderDex() {
  el.dexGrid.innerHTML = PLANETS.map((base) => {
    const p = getPlanetSpec(base.tier, state.activeTheme);
    const unlocked = meta.unlockedTiers.includes(p.tier);
    return `
      <div class="dex-item ${unlocked ? "unlocked" : ""}">
        <div class="dex-dot" style="background:${unlocked ? p.color : "#1e293b"}; box-shadow:${unlocked ? `0 0 10px ${p.glow}` : "none"}"></div>
        <div><strong>${unlocked ? p.name : "???"}</strong></div>
        <div style="color:#94a3b8">Seviye ${p.tier + 1}</div>
      </div>
    `;
  }).join("");
}

function renderThemes() {
  el.themesList.innerHTML = Object.values(THEMES)
    .map((t) => {
      const unlocked = meta.unlockedThemes.includes(t.id);
      const isActive = state.activeTheme === t.id;
      let btnHtml = "";
      if (isActive) {
        btnHtml = `<button class="theme-action-btn active" disabled>Aktif ✓</button>`;
      } else if (unlocked) {
        btnHtml = `<button class="theme-action-btn equip" data-theme-id="${t.id}">Seç</button>`;
      } else {
        const disabled = meta.stardust < t.cost ? "disabled" : "";
        btnHtml = `<button class="theme-action-btn" data-theme-id="${t.id}" ${disabled}>✦ ${t.cost} Aç</button>`;
      }
      return `
        <div class="mission-row ${isActive ? "done" : ""}">
          <div>
            <div class="mission-title">${t.icon} ${t.name}</div>
            <div class="mission-prog">${t.desc}</div>
          </div>
          ${btnHtml}
        </div>
      `;
    })
    .join("");

  el.themesList.querySelectorAll("[data-theme-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.themeId;
      const theme = THEMES[id];
      if (!theme) return;
      if (!meta.unlockedThemes.includes(id)) {
        if (meta.stardust < theme.cost) return;
        meta.stardust -= theme.cost;
        meta.unlockedThemes.push(id);
      }
      applyTheme(id);
      updateHUD();
      renderThemes();
    });
  });
}

function renderMissions() {
  el.missionsList.innerHTML = meta.missions
    .map(
      (m) => `
    <div class="mission-row ${m.claimed ? "done" : ""}">
      <div>
        <div class="mission-title">${m.claimed ? "✅ " : ""}${m.title}</div>
        <div class="mission-prog">İlerleme: ${m.progress} / ${m.target}</div>
      </div>
      <div class="mission-reward">${m.claimed ? "Alındı" : `+${m.reward} ✦`}</div>
    </div>
  `
    )
    .join("");
}

function renderAchievements() {
  el.achievementsList.innerHTML = ACHIEVEMENTS.map((a) => {
    const done = meta.unlockedAchievements.includes(a.id);
    return `
      <div class="mission-row ${done ? "done" : ""}">
        <div>
          <div class="mission-title">${a.icon} ${a.title}</div>
          <div class="mission-prog">${a.desc}</div>
        </div>
        <div class="mission-reward">${done ? "Açıldı ✓" : `+${a.reward} ✦`}</div>
      </div>
    `;
  }).join("");
}

function renderLeaderboard() {
  const avatars = ["🧑‍🚀", "👽", "🤖", "🦊", "⚡", "👑"];
  el.playerNameInput.value = meta.playerName || "Sen";
  el.avatarPicker.innerHTML = avatars
    .map(
      (av) =>
        `<button class="avatar-btn ${(meta.playerAvatar || "🧑‍🚀") === av ? "active" : ""}" data-avatar="${av}">${av}</button>`
    )
    .join("");
  el.avatarPicker.querySelectorAll("[data-avatar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      meta.playerAvatar = btn.dataset.avatar;
      saveMeta(meta);
      renderLeaderboard();
    });
  });

  const s = meta.stats || { totalGames: 0, totalMerges: 0, maxCombo: 0, bigBangs: 0 };
  el.statsMiniGrid.innerHTML = `
    <div class="stats-mini-card"><span>OYUN</span><strong>${s.totalGames}</strong></div>
    <div class="stats-mini-card"><span>BİRLEŞME</span><strong>${s.totalMerges}</strong></div>
    <div class="stats-mini-card"><span>MAX KOMBO</span><strong>x${s.maxCombo}</strong></div>
    <div class="stats-mini-card"><span>BIG BANG</span><strong>${s.bigBangs}</strong></div>
  `;
  const list = getGalaxyLeaderboard(meta);
  el.leaderboardList.innerHTML = list
    .map(
      (row, idx) => `
      <div class="mission-row ${row.isPlayer ? "done" : ""}">
        <div>
          <div class="mission-title">#${idx + 1} ${row.badge} ${row.name}</div>
        </div>
        <div class="mission-reward">${row.score.toLocaleString("tr-TR")}</div>
      </div>
    `
    )
    .join("");
}

function setMissionsModalTab(tab) {
  el.tabMissions.classList.toggle("active", tab === "missions");
  el.tabAchievements.classList.toggle("active", tab === "achievements");
  el.tabLeaderboard.classList.toggle("active", tab === "leaderboard");
  el.missionsList.classList.toggle("hidden", tab !== "missions");
  el.achievementsList.classList.toggle("hidden", tab !== "achievements");
  el.leaderboardPanel.classList.toggle("hidden", tab !== "leaderboard");

  if (tab === "missions") {
    el.missionsSubDesc.textContent = "Görevleri tamamla, güçler ve temalar için Stardust (✦) kazan.";
  } else if (tab === "achievements") {
    el.missionsSubDesc.textContent = "Oyun içi özel hedeflere ulaşarak kalıcı başarım rozetlerini aç.";
  } else {
    el.missionsSubDesc.textContent = "Kariyer istatistiklerin ve CODDIOM Galaksi Liderlik Sıralaması.";
  }
}

el.tabMissions.addEventListener("click", () => setMissionsModalTab("missions"));
el.tabAchievements.addEventListener("click", () => {
  renderAchievements();
  setMissionsModalTab("achievements");
});
el.tabLeaderboard.addEventListener("click", () => {
  renderLeaderboard();
  setMissionsModalTab("leaderboard");
});

el.playerNameInput.addEventListener("input", () => {
  const val = el.playerNameInput.value.trim();
  meta.playerName = val || "Sen";
  saveMeta(meta);
  const rows = el.leaderboardList.querySelectorAll(".mission-row.done .mission-title");
  if (rows.length > 0) {
    const list = getGalaxyLeaderboard(meta);
    const idx = list.findIndex((r) => r.isPlayer);
    if (idx >= 0) {
      rows[0].textContent = `#${idx + 1} ${meta.playerAvatar || "🧑‍🚀"} ${meta.playerName}`;
    }
  }
});

el.btnRewardedStardust.addEventListener("click", async () => {
  const ok = await ads.showRewardedAd("+50 Stardust (✦)");
  if (ok) {
    meta.stardust += 50;
    saveMeta(meta);
    updateHUD();
    renderThemes();
    addFloatingText(GAME_CONFIG.width / 2, 160, "+50 ✦ EKLENDİ!", "#fbbf24", 18);
  }
});

el.btnRemoveAds.addEventListener("click", () => {
  meta.adsRemoved = !meta.adsRemoved;
  saveMeta(meta);
  el.btnRemoveAds.textContent = meta.adsRemoved ? "💎 Reklamsız Aktif ✓" : "💎 Reklamsız Mod";
  if (typeof ads.setBannerVisible === "function") {
    ads.setBannerVisible(!meta.adsRemoved, el.adBannerSlot);
  } else {
    el.adBannerSlot.classList.toggle("hidden", Boolean(meta.adsRemoved));
  }
});

el.btnDex.addEventListener("click", () => {
  renderDex();
  el.dexModal.classList.remove("hidden");
});

el.btnMissions.addEventListener("click", () => {
  renderMissions();
  renderAchievements();
  setMissionsModalTab("missions");
  el.missionsModal.classList.remove("hidden");
});

el.btnThemes.addEventListener("click", () => {
  el.btnRemoveAds.textContent = meta.adsRemoved ? "💎 Reklamsız Aktif ✓" : "💎 Reklamsız Mod";
  renderThemes();
  el.themesModal.classList.remove("hidden");
});

document.querySelectorAll(".close-sheet").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close).classList.add("hidden");
  });
});

// Canvas Pointer Controls
function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = GAME_CONFIG.width / rect.width;
  const scaleY = GAME_CONFIG.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

let isPointerDown = false;

canvas.addEventListener("pointerdown", (e) => {
  if (state.gameOver) return;
  const pt = getCanvasCoords(e.clientX, e.clientY);

  if (state.laserMode) {
    // Check if user tapped a planet
    let target = null;
    for (let i = state.bodies.length - 1; i >= 0; i--) {
      const b = state.bodies[i];
      const dx = pt.x - b.x;
      const dy = pt.y - b.y;
      if (dx * dx + dy * dy <= (b.radius + 8) * (b.radius + 8)) {
        target = b;
        break;
      }
    }
    if (target && consumePowerCost("laser", 35)) {
      state.bodies = state.bodies.filter((b) => b.id !== target.id);
      state.laserBeam = { x: target.x, y: target.y, life: 0.25 };
      spawnParticles(target.x, target.y, "#22d3ee", 22);
      sound.playLaser();
      state.laserMode = false;
      el.laserPrompt.classList.add("hidden");
      updateHUD();
    }
    return;
  }

  isPointerDown = true;
  state.aimX = clampAimX(pt.x, state.current);
});

el.btnHold.addEventListener("click", swapHold);

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyH" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
    swapHold();
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (state.gameOver || state.laserMode) return;
  const pt = getCanvasCoords(e.clientX, e.clientY);
  state.aimX = clampAimX(pt.x, state.current);
});

window.addEventListener("pointerup", () => {
  if (!isPointerDown) return;
  isPointerDown = false;
  dropCurrentPlanet();
});

// Main Loop
let lastTime = performance.now();

function tick(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (!state.gameOver && !state.introActive) {
    if (!state.canDrop) {
      state.dropCooldown -= dt;
      if (state.dropCooldown <= 0) state.canDrop = true;
    }

    if (state.mode === "rush") {
      state.rushTimeLeft = Math.max(0, state.rushTimeLeft - dt);
      const secs = Math.ceil(state.rushTimeLeft);
      const m = Math.floor(secs / 60);
      const s = String(secs % 60).padStart(2, "0");
      el.rushTimerPill.textContent = `⏱ ${m}:${s}`;
      if (state.rushTimeLeft <= 0) {
        triggerGameOver("timeout");
      }
    }

    if (state.feverTimer > 0) {
      state.feverTimer = Math.max(0, state.feverTimer - dt);
      if (state.feverTimer === 0) updateHUD();
    }

    if (state.zeroGTimer > 0) {
      state.zeroGTimer = Math.max(0, state.zeroGTimer - dt);
      el.zeroGTimer.textContent = `${state.zeroGTimer.toFixed(1)}s`;
      if (state.zeroGTimer === 0) el.zeroGBanner.classList.add("hidden");
    }

    if (state.magnetTimer > 0) {
      state.magnetTimer = Math.max(0, state.magnetTimer - dt);
      el.magnetTimer.textContent = `${state.magnetTimer.toFixed(1)}s`;
      if (state.magnetTimer === 0) el.magnetBanner.classList.add("hidden");
    }

    if (state.combo >= 2) {
      const elapsed = now - state.lastMergeAt;
      const remainRatio = Math.max(0, 1 - elapsed / GAME_CONFIG.comboWindowMs);
      if (remainRatio <= 0) {
        state.combo = 0;
        el.comboTimerTrack.classList.add("hidden");
        updateHUD();
      } else {
        el.comboTimerTrack.classList.remove("hidden");
        el.comboTimerFill.style.width = `${remainRatio * 100}%`;
      }
    } else {
      el.comboTimerTrack.classList.add("hidden");
    }

    if (state.shakeTime > 0) {
      state.shakeTime = Math.max(0, state.shakeTime - dt);
    }

    if (state.flashAlpha > 0) {
      state.flashAlpha = Math.max(0, state.flashAlpha - dt * 1.8);
    }

    if (state.hitStopTimer > 0) {
      state.hitStopTimer = Math.max(0, state.hitStopTimer - dt);
    } else {
      const params = getLevelParams(state.level);
      for (const obs of state.obstacles) {
        obs.phase += dt * obs.speed;
        obs.x = obs.baseX + Math.sin(obs.phase) * obs.amp;
      }

      if (params.shotTimerSec > 0 && state.canDrop && !state.laserMode) {
        state.shotTimer -= dt;
        if (state.shotTimer <= 0) {
          dropCurrentPlanet();
        }
      }

      const gravityScale = (state.zeroGTimer > 0 ? -0.45 : 1) * params.gravityMult;
      const mergePairs = stepPhysics(state.bodies, dt, {
        gravityScale,
        restitution: params.restitution,
        obstacles: state.obstacles,
        magnetActive: state.magnetTimer > 0,
        onSpark: (sx, sy) => spawnParticles(sx, sy, "#f8fafc", 4),
      });

      if (mergePairs.length > 0) {
        const mergedIds = new Set();
        for (const [a, b] of mergePairs) {
          mergedIds.add(a.id);
          mergedIds.add(b.id);
        }
        state.bodies = state.bodies.filter((b) => !mergedIds.has(b.id));
        for (const [a, b] of mergePairs) {
          handleMerge(a, b);
        }
      }
    }

    // Overflow danger check (ignore Zero-G and newly spawned bodies < 0.9s old)
    let anyAbove = false;
    if (state.zeroGTimer <= 0) {
      for (const b of state.bodies) {
        const isAbove = b.age > 0.9 && b.y - b.radius < state.dangerLineY;
        b.worried = isAbove;
        if (isAbove) anyAbove = true;
      }
    } else {
      for (const b of state.bodies) b.worried = false;
    }

    if (anyAbove) {
      state.dangerActive = true;
      state.dangerTimer += dt;
      const remain = Math.max(0, GAME_CONFIG.dangerGraceSeconds - state.dangerTimer);
      el.dangerTimer.textContent = `${remain.toFixed(1)}s`;
      el.dangerBanner.classList.remove("hidden");
      if (state.dangerTimer >= GAME_CONFIG.dangerGraceSeconds) {
        triggerGameOver();
      }
    } else {
      state.dangerActive = false;
      state.dangerTimer = 0;
      el.dangerBanner.classList.add("hidden");
    }
  }

  // Update particles, shockwaves & floating texts
  state.particles = state.particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    return p.life > 0;
  });

  state.shockwaves = state.shockwaves.filter((sw) => {
    sw.life -= dt;
    return sw.life > 0;
  });

  state.floatingTexts = state.floatingTexts.filter((ft) => {
    ft.y -= 28 * dt;
    ft.life -= dt;
    return ft.life > 0;
  });

  if (state.laserBeam) {
    state.laserBeam.life -= dt;
    if (state.laserBeam.life <= 0) state.laserBeam = null;
  }

  renderGame(ctx, state);
  requestAnimationFrame(tick);
}

function openIntroScreen() {
  state.introActive = true;
  const hasActiveRun = state.bodies.length > 0 && !state.gameOver;
  el.introStatsPill.textContent = `🏆 Rekor: ${meta.bestScore.toLocaleString("tr-TR")} • ✦ ${meta.stardust}${meta.loginStreak > 0 ? ` • 🔥 ${meta.loginStreak}. Gün` : ""}`;
  el.btnStartGame.textContent = hasActiveRun
    ? `▶ DEVAM ET (Skor: ${state.score.toLocaleString("tr-TR")})`
    : "🚀 OYUNA BAŞLA";
  el.btnNewGameIntro.classList.toggle("hidden", !hasActiveRun);
  el.introOverlay.classList.remove("hidden");
}

function startGameFromIntro(selectedMode = null) {
  state.introActive = false;
  el.introOverlay.classList.add("hidden");
  sound.ensureCtx();
  sound.playSwap();
  if (selectedMode) {
    resetGame(selectedMode);
  }
}

el.btnStartGame.addEventListener("click", () => startGameFromIntro(null));
el.btnNewGameIntro.addEventListener("click", () => startGameFromIntro("classic"));
el.btnBrandHome.addEventListener("click", openIntroScreen);
document.querySelectorAll("[data-intro-mode]").forEach((btn) => {
  btn.addEventListener("click", () => startGameFromIntro(btn.dataset.introMode));
});

if (!restoreClassicRunIfSaved()) {
  resetGame("classic");
}
openIntroScreen();

ads.init?.();
if (typeof ads.setBannerVisible === "function") {
  ads.setBannerVisible(!meta.adsRemoved, el.adBannerSlot);
} else {
  el.adBannerSlot.classList.toggle("hidden", Boolean(meta.adsRemoved));
}

if (!meta.onboardingSeen) {
  el.onboardingHint.classList.remove("hidden");
}

const loginBonus = claimDailyLogin(meta);
if (loginBonus) {
  updateHUD();
  addFloatingText(
    GAME_CONFIG.width / 2,
    210,
    `🔥 ${loginBonus.streak}. GÜN SERİSİ! +${loginBonus.reward} ✦`,
    "#fbbf24",
    16
  );
}

requestAnimationFrame(tick);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
