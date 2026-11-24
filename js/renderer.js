import { GAME_CONFIG, getPlanetSpec } from "./config.js";

export function drawQuantumOrb(ctx, x, y, radius, angle = 0, options = {}) {
  const { scale = 1, alpha = 1 } = options;
  const now = performance.now() * 0.004;
  const hue = (now * 60) % 360;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.shadowColor = `hsl(${hue}, 95%, 65%)`;
  ctx.shadowBlur = 18;

  const grad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, 2, 0, 0, radius);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, `hsl(${hue}, 95%, 70%)`);
  grad.addColorStop(0.85, `hsl(${(hue + 90) % 360}, 90%, 55%)`);
  grad.addColorStop(1, `hsl(${(hue + 180) % 360}, 85%, 35%)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Rotating prism ring
  ctx.save();
  ctx.rotate(angle + now);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.18, radius * 0.42, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Center star symbol
  ctx.fillStyle = "#0f172a";
  ctx.font = `900 ${Math.round(radius * 0.9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", 0, 1);

  ctx.restore();
}

export function drawPlanet(ctx, tier, x, y, radius, angle = 0, options = {}) {
  const {
    themeId = "cosmic",
    worried = false,
    blinking = false,
    happy = false,
    surprised = false,
    scale = 1,
    alpha = 1,
  } = options;
  const spec = getPlanetSpec(tier, themeId);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer glow
  ctx.shadowColor = spec.glow;
  ctx.shadowBlur = spec.isBlackHole ? 20 : 12;

  // Saturn back ring
  if (spec.hasRing) {
    ctx.save();
    ctx.rotate(-0.28);
    ctx.strokeStyle = "rgba(253, 224, 71, 0.72)";
    ctx.lineWidth = Math.max(4, radius * 0.14);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.45, radius * 0.36, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Body gradient
  const grad = ctx.createRadialGradient(
    -radius * 0.32,
    -radius * 0.32,
    radius * 0.12,
    0,
    0,
    radius
  );

  if (spec.isBlackHole) {
    grad.addColorStop(0, "#020617");
    grad.addColorStop(0.72, "#0f172a");
    grad.addColorStop(1, "#6366f1");
  } else {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.28, spec.glow);
    grad.addColorStop(0.85, spec.color);
    grad.addColorStop(1, "#0f172a");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Subtle surface details (rotated)
  ctx.save();
  ctx.rotate(angle);
  if (themeId === "cyber") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = Math.max(1.2, radius * 0.045);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.55, 0);
    ctx.lineTo(-radius * 0.25, -radius * 0.3);
    ctx.lineTo(radius * 0.3, -radius * 0.3);
    ctx.moveTo(radius * 0.55, 0.1 * radius);
    ctx.lineTo(radius * 0.2, radius * 0.35);
    ctx.stroke();
  } else if (themeId === "kawaii") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(-radius * 0.32, -radius * 0.32, radius * 0.08, 0, Math.PI * 2);
    ctx.arc(radius * 0.34, -radius * 0.26, radius * 0.08, 0, Math.PI * 2);
    ctx.arc(0, radius * 0.42, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (spec.isEarth) {
    ctx.fillStyle = "rgba(74, 222, 128, 0.55)";
    ctx.beginPath();
    ctx.arc(-radius * 0.28, -radius * 0.15, radius * 0.28, 0, Math.PI * 2);
    ctx.arc(radius * 0.25, radius * 0.22, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (spec.isBlackHole) {
    ctx.strokeStyle = "rgba(165, 180, 252, 0.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 1.4);
    ctx.stroke();
  } else if (!spec.isStar) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.arc(-radius * 0.3, radius * 0.25, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(radius * 0.32, -radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Cute expressive face (kept upright)
  const eyeOffsetX = radius * 0.26;
  const eyeY = -radius * 0.06;
  const eyeR = Math.max(2, radius * 0.085);
  const faceColor = spec.isBlackHole ? "#e0e7ff" : "#0f172a";

  ctx.fillStyle = faceColor;
  ctx.strokeStyle = faceColor;
  ctx.lineCap = "round";

  if (worried) {
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeY, eyeR * 1.25, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeY, eyeR * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, radius * 0.05);
    ctx.beginPath();
    ctx.arc(0, radius * 0.25, radius * 0.16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (happy) {
    // Cheerful ^_^ eyes
    ctx.lineWidth = Math.max(1.6, radius * 0.055);
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeY + eyeR * 0.3, eyeR * 1.15, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeY + eyeR * 0.3, eyeR * 1.15, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, radius * 0.08, radius * 0.22, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  } else if (surprised) {
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeY, eyeR * 1.15, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeY, eyeR * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.4, radius * 0.05);
    ctx.beginPath();
    ctx.arc(0, radius * 0.2, radius * 0.11, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    if (blinking) {
      ctx.lineWidth = Math.max(1.5, radius * 0.05);
      ctx.beginPath();
      ctx.moveTo(-eyeOffsetX - eyeR, eyeY);
      ctx.lineTo(-eyeOffsetX + eyeR, eyeY);
      ctx.moveTo(eyeOffsetX - eyeR, eyeY);
      ctx.lineTo(eyeOffsetX + eyeR, eyeY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile
    ctx.lineWidth = Math.max(1.4, radius * 0.045);
    ctx.beginPath();
    ctx.arc(0, radius * 0.08, radius * 0.18, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  }

  // Saturn front ring
  if (spec.hasRing) {
    ctx.save();
    ctx.rotate(-0.28);
    ctx.strokeStyle = "rgba(254, 240, 138, 0.92)";
    ctx.lineWidth = Math.max(4, radius * 0.14);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.45, radius * 0.36, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawIceOverlay(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(186, 230, 253, 0.92)";
  ctx.fillStyle = "rgba(125, 211, 252, 0.25)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * (radius + 2);
    const py = Math.sin(a) * (radius + 2);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = `800 ${Math.max(10, Math.round(radius * 0.45))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e0f2fe";
  ctx.fillText("❄️", 0, -radius * 0.55);
  ctx.restore();
}

function drawBumper(ctx, obs) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.shadowColor = "#f43f5e";
  ctx.shadowBlur = 14;

  const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, obs.radius);
  grad.addColorStop(0, "#fda4af");
  grad.addColorStop(0.55, "#e11d48");
  grad.addColorStop(1, "#4c0519");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, obs.radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function getPredictedDropY(bodies, obstacles, x, r) {
  const { height, floorPad, dropY } = GAME_CONFIG;
  let landingY = height - floorPad - r;
  for (const b of bodies) {
    if (b.merging) continue;
    const dx = Math.abs(x - b.x);
    const sumR = r + b.radius;
    if (dx < sumR) {
      const contactY = b.y - Math.sqrt(sumR * sumR - dx * dx);
      if (contactY >= dropY) {
        landingY = Math.min(landingY, contactY);
      }
    }
  }
  for (const obs of obstacles) {
    const dx = Math.abs(x - obs.x);
    const sumR = r + obs.radius;
    if (dx < sumR) {
      const contactY = obs.y - Math.sqrt(sumR * sumR - dx * dx);
      if (contactY >= dropY) {
        landingY = Math.min(landingY, contactY);
      }
    }
  }
  return landingY;
}

const BG_STARS = Array.from({ length: 42 }, (_, i) => ({
  x: ((i * 97) % 390) + 5,
  y: ((i * 151) % 590) + 5,
  r: 0.7 + (i % 3) * 0.55,
  speed: 8 + (i % 5) * 6,
  phase: i * 0.8,
}));

export function renderGame(ctx, state) {
  const { width, height, wallPad, floorPad, dropY } = GAME_CONFIG;
  const dangerLineY = state.dangerLineY || GAME_CONFIG.dangerLineY;
  ctx.clearRect(0, 0, width, height);

  // Animated parallax starfield (warp speed during Fever, upward drift during Zero-G)
  const nowSec = performance.now() * 0.001;
  const speedMult = state.feverTimer > 0 ? 5.5 : state.zeroGTimer > 0 ? -1.8 : 1;
  ctx.save();
  for (const st of BG_STARS) {
    const sy = ((st.y + nowSec * st.speed * speedMult) % height + height) % height;
    const twinkle = 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(nowSec * 2.4 + st.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = state.feverTimer > 0 ? "#fde047" : "#e2e8f0";
    if (state.feverTimer > 0) {
      ctx.fillRect(st.x, sy, st.r * 1.4, st.r * 7);
    } else {
      ctx.beginPath();
      ctx.arc(st.x, sy, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  if (state.shakeTime > 0) {
    const mag = 5 * (state.shakeTime / 0.35);
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  // Fever border glow
  if (state.feverTimer > 0) {
    ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
    ctx.lineWidth = 6;
    ctx.strokeRect(wallPad, wallPad, width - wallPad * 2, height - wallPad - floorPad);
  }

  // Danger line
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = state.dangerActive ? "rgba(244, 63, 94, 0.9)" : "rgba(244, 63, 94, 0.32)";
  ctx.lineWidth = state.dangerActive ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(wallPad, dangerLineY);
  ctx.lineTo(width - wallPad, dangerLineY);
  ctx.stroke();
  ctx.restore();

  // Aim trajectory + landing ghost ring + pending planet
  if (!state.gameOver && !state.laserMode && state.canDrop) {
    const isQ = state.current.isQuantum;
    const r = isQ ? GAME_CONFIG.quantumRadius : getPlanetSpec(state.current.tier, state.activeTheme).radius;
    const landingY = getPredictedDropY(state.bodies, state.obstacles || [], state.aimX, r);

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = isQ ? "rgba(251, 191, 36, 0.55)" : "rgba(34, 211, 238, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(state.aimX, dropY + r);
    ctx.lineTo(state.aimX, Math.max(dropY + r, landingY - r));
    ctx.stroke();

    // Predicted landing target circle
    ctx.strokeStyle = isQ ? "rgba(251, 191, 36, 0.48)" : "rgba(34, 211, 238, 0.34)";
    ctx.beginPath();
    ctx.arc(state.aimX, landingY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (isQ) {
      drawQuantumOrb(ctx, state.aimX, dropY, r, 0, { alpha: 0.96 });
    } else {
      drawPlanet(ctx, state.current.tier, state.aimX, dropY, r, 0, {
        themeId: state.activeTheme,
        alpha: 0.95,
      });
      if (state.current.isFrozen) {
        drawIceOverlay(ctx, state.aimX, dropY, r);
      }
    }

    if (state.shotTimer > 0 && state.shotTimer <= 4.0) {
      ctx.save();
      ctx.font = "800 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f43f5e";
      ctx.fillText(`⏱ ${state.shotTimer.toFixed(1)}s`, state.aimX, Math.max(16, dropY - r - 8));
      ctx.restore();
    }
  }

  // Magnetic tether visual lines when Magnet power-up is active
  if (state.magnetTimer > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(244, 114, 182, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < state.bodies.length; i++) {
      const a = state.bodies[i];
      if (a.merging || a.frozen || a.isQuantum) continue;
      for (let j = i + 1; j < state.bodies.length; j++) {
        const b = state.bodies[j];
        if (b.merging || b.frozen || b.isQuantum || a.tier !== b.tier) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const maxR = 175 + a.radius + b.radius;
        if (dx * dx + dy * dy < maxR * maxR) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // Cosmic Bumper Obstacles
  for (const obs of state.obstacles || []) {
    drawBumper(ctx, obs);
  }

  // Physics bodies
  for (const b of state.bodies) {
    if (b.merging) continue;
    if (b.isQuantum) {
      drawQuantumOrb(ctx, b.x, b.y, b.radius, b.angle, { scale: b.scalePop });
    } else {
      drawPlanet(ctx, b.tier, b.x, b.y, b.radius, b.angle, {
        themeId: state.activeTheme,
        worried: b.worried,
        blinking: b.isBlinking,
        happy: b.happyTimer > 0,
        surprised: !b.worried && b.vy > 260 && b.age < 0.7,
        scale: b.scalePop,
      });
      if (b.frozen) {
        drawIceOverlay(ctx, b.x, b.y, b.radius);
      }
    }
  }

  // Shockwave rings
  for (const sw of state.shockwaves) {
    const progress = 1 - sw.life / sw.maxLife;
    const currentR = sw.startRadius + (sw.maxRadius - sw.startRadius) * progress;
    ctx.save();
    ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife) * 0.85;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = Math.max(1.5, 5 * (1 - progress));
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, currentR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Laser beam effect
  if (state.laserBeam) {
    const lb = state.laserBeam;
    ctx.save();
    ctx.globalAlpha = lb.life / 0.25;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(lb.x, lb.y);
    ctx.stroke();
    ctx.restore();
  }

  // Floating texts
  for (const ft of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
    ctx.font = `800 ${ft.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = ft.color;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Big Bang / Epic Merge flash
  if (state.flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = state.flashAlpha;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}

export function renderSlotPreview(canvas, item, themeId = "cosmic") {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!item) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (item.isQuantum) {
    drawQuantumOrb(ctx, canvas.width / 2, canvas.height / 2, 14, 0);
    return;
  }
  const spec = getPlanetSpec(item.tier, themeId);
  const fitR = Math.min(16, spec.radius * 0.62);
  drawPlanet(ctx, item.tier, canvas.width / 2, canvas.height / 2, fitR, 0, { themeId });
  if (item.isFrozen) {
    drawIceOverlay(ctx, canvas.width / 2, canvas.height / 2, fitR);
  }
}
