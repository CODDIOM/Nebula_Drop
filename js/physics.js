import { GAME_CONFIG, PLANETS } from "./config.js";

let nextBodyId = 1;

export function createBody(tier, x, y, vx = 0, vy = 0, isQuantum = false, isFrozen = false) {
  const radius = isQuantum ? GAME_CONFIG.quantumRadius : PLANETS[tier].radius;
  return {
    id: nextBodyId++,
    tier: isQuantum ? -1 : tier,
    isQuantum,
    frozen: Boolean(!isQuantum && isFrozen),
    x,
    y,
    vx,
    vy,
    radius,
    mass: radius * radius,
    angle: Math.random() * Math.PI * 2,
    angVel: isQuantum ? 2.5 : 0,
    merging: false,
    age: 0,
    scalePop: 1.28, // Spawn/merge pop animation
    worried: false,
    happyTimer: isQuantum ? 0 : 0.65,
    blinkTimer: 1.5 + Math.random() * 3.5,
    isBlinking: false,
  };
}

export function stepPhysics(bodies, dt, options = {}) {
  const { gravityScale = 1, restitution = 0.22, obstacles = [], magnetActive = false, onSpark = null } = options;
  const subSteps = GAME_CONFIG.subSteps;
  const subDt = dt / subSteps;
  const minX = GAME_CONFIG.wallPad;
  const maxX = GAME_CONFIG.width - GAME_CONFIG.wallPad;
  const maxY = GAME_CONFIG.height - GAME_CONFIG.floorPad;
  const minY = GAME_CONFIG.wallPad;

  const mergePairs = [];
  const mergedIds = new Set();

  // Optional Magnet pull between nearby same-tier non-frozen planets
  if (magnetActive) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.merging || a.frozen || a.isQuantum) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.merging || b.frozen || b.isQuantum || a.tier !== b.tier) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const maxRange = 175 + a.radius + b.radius;
        if (distSq > 4 && distSq < maxRange * maxRange) {
          const dist = Math.sqrt(distSq);
          const pull = 420 * dt;
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx += nx * pull;
          a.vy += ny * pull;
          b.vx -= nx * pull;
          b.vy -= ny * pull;
        }
      }
    }
  }

  for (let s = 0; s < subSteps; s++) {
    // 1. Integrate velocities & positions
    for (const b of bodies) {
      if (b.merging) continue;
      b.vy += GAME_CONFIG.gravity * gravityScale * subDt;

      // Mild air damping
      b.vx *= 0.9992;
      b.vy *= 0.9992;
      b.angVel *= 0.996;

      b.x += b.vx * subDt;
      b.y += b.vy * subDt;
      b.angle += b.angVel * subDt;

      if (s === 0) {
        b.age += dt;
        if (b.scalePop > 1) {
          b.scalePop = Math.max(1, b.scalePop - dt * 2.8);
        }
        if (b.happyTimer > 0) {
          b.happyTimer = Math.max(0, b.happyTimer - dt);
        }
        b.blinkTimer -= dt;
        if (b.blinkTimer <= 0) {
          if (b.isBlinking) {
            b.isBlinking = false;
            b.blinkTimer = 2.0 + Math.random() * 3.8;
          } else {
            b.isBlinking = true;
            b.blinkTimer = 0.12;
          }
        }
      }

      // Wall collisions
      if (b.x - b.radius < minX) {
        b.x = minX + b.radius;
        b.vx = Math.abs(b.vx) * 0.35;
      } else if (b.x + b.radius > maxX) {
        b.x = maxX - b.radius;
        b.vx = -Math.abs(b.vx) * 0.35;
      }

      // Floor collision
      if (b.y + b.radius > maxY) {
        b.y = maxY - b.radius;
        if (b.vy > 0) b.vy = -b.vy * 0.28;
        b.vx *= 0.94;
        b.angVel = b.vx / b.radius;
      }

      // Ceiling collision during Zero-G
      if (gravityScale < 0 && b.y - b.radius < minY) {
        b.y = minY + b.radius;
        if (b.vy < 0) b.vy = -b.vy * 0.3;
      }
    }

    // 2. Circle-circle collisions + merge detection
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.merging) continue;

      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.merging) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.radius + b.radius;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist * minDist) {
          // Same tier (when neither is frozen) OR Quantum Joker orb -> queue merge
          const normalMerge = !a.frozen && !b.frozen && a.tier === b.tier;
          const canMerge = a.isQuantum || b.isQuantum || normalMerge;
          if (canMerge && !mergedIds.has(a.id) && !mergedIds.has(b.id)) {
            a.merging = true;
            b.merging = true;
            mergedIds.add(a.id);
            mergedIds.add(b.id);
            mergePairs.push([a, b]);
            continue;
          }

          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          const totalMass = a.mass + b.mass;
          const ratioA = b.mass / totalMass;
          const ratioB = a.mass / totalMass;

          // Positional correction
          const correction = overlap * 0.85;
          a.x -= nx * correction * ratioA;
          a.y -= ny * correction * ratioA;
          b.x += nx * correction * ratioB;
          b.y += ny * correction * ratioB;

          // Relative velocity along normal
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            if (velAlongNormal < -210 && onSpark && s === 0) {
              const cx = a.x + nx * a.radius;
              const cy = a.y + ny * a.radius;
              onSpark(cx, cy);
            }
            const jImpulse = (-(1 + restitution) * velAlongNormal) / (1 / a.mass + 1 / b.mass);
            const ix = jImpulse * nx;
            const iy = jImpulse * ny;

            a.vx -= ix / a.mass;
            a.vy -= iy / a.mass;
            b.vx += ix / b.mass;
            b.vy += iy / b.mass;

            // Tangential friction -> spin
            const tx = -ny;
            const ty = nx;
            const vt = rvx * tx + rvy * ty;
            const friction = 0.08;
            a.angVel += (vt * friction) / a.radius;
            b.angVel -= (vt * friction) / b.radius;
          }
        }
      }
    }

    // 3. Body vs static/moving Cosmic Bumper obstacles
    for (const obs of obstacles) {
      for (const b of bodies) {
        if (b.merging) continue;
        const dx = b.x - obs.x;
        const dy = b.y - obs.y;
        const minDist = b.radius + obs.radius;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;
          b.x += nx * (minDist - dist);
          b.y += ny * (minDist - dist);
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            const bounce = 1.55;
            b.vx -= bounce * vn * nx;
            b.vy -= bounce * vn * ny;
          }
        }
      }
    }
  }

  return mergePairs;
}

export function applyQuakeImpulse(bodies) {
  for (const b of bodies) {
    if (b.merging) continue;
    b.vx += (Math.random() - 0.5) * 420;
    b.vy -= 180 + Math.random() * 220;
  }
}
