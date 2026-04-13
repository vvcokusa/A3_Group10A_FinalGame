/*
  SpikeManager.js
  ─────────────────────────────────────────────
  Manages the full list of Spike objects:
  spawning, moving, culling, and drawing.

  update() now accepts the current level config
  object from LevelManager so spawn rate and
  air-spike chance scale per level.
*/
/*
class SpikeManager {
  constructor() {
    this.spikes = [];
    this.currentSpeed = 7;
  }

  reset() {
    this.spikes = [];
    this.currentSpeed = 7;
  }

  // lvl — current level config from LevelManager
  update(speed, intensity, maxIntensity, lvl) {
    this.currentSpeed = speed;

    // Use per-level spawn rate range
    const minRate = lvl ? lvl.spawnRateMin : 70;
    const maxRate = lvl ? lvl.spawnRateMax : 100;
    const spawnRate = map(intensity, 0, maxIntensity, maxRate, minRate);

    if (frameCount % floor(spawnRate) === 0) this._spawn(lvl);

    for (const s of this.spikes) s.x -= speed;
    this.spikes = this.spikes.filter((s) => s.x + s.w > 0);
  }

  _spawn(lvl) {
    const airChance = lvl ? lvl.airSpikeChance : 0.35;
    if (random() < airChance) {
      this._spawnAir();
    } else {
      this._spawnGround();
    }
  }

  _spawnGround() {
    const groundBase = GROUND + 40;
    const h = random(40, 55);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, groundBase - h, w, h, "ground"));

    if (random() < 0.3) {
      const h2 = h - random(10, 15);
      this.spikes.push(
        new Spike(width + 20 + w, groundBase - h2, w, h2, "ground"),
      );
    }
  }

  _spawnAir() {
    const h = random(50, 70);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, AIR_SPIKE_Y, w, h, "air"));
  }

  draw(intensity, maxIntensity) {
    for (const s of this.spikes) s.draw(intensity, maxIntensity);
  }
} */

/*
  Spike.js
  ─────────────────────────────────────────────
  A single spike obstacle. Supports two types:

  "ground" — sits on the floor, tip points UP.
             Player must jump over it.

  "air"    — hangs from above, tip points DOWN.
             Dangerous when the player is on a
             platform; safe when on the ground.
             Drawn in red so it reads differently.

  The bounding box (x, y, w, h) works for both:
    ground: y = top of spike, y+h = base on floor
    air:    y = top (near screen top), y+h = tip

  Collision logic lives in sketch.js.
*/

class Spike {
  constructor(x, y, w, h, type = "ground") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type; // "ground" | "air"

    // Flags set by sketch.js collision checks
    this.scored = false;
    this.nearMiss = false;
  }

  // ── Draw ─────────────────────────────────────
  // Both types pulse with intensity for visual feedback
  draw(intensity, maxIntensity) {
    noStroke();

    const pulse = sin(frameCount * 0.1);
    const scale = map(intensity, 0, maxIntensity, 0, 0.4);
    const visualHeight = this.h * (1 + pulse * scale);

    if (this.type === "ground") {
      // light grey triangle, tip pointing UP
      fill(140);
      triangle(
        this.x,
        this.y + this.h, // bottom-left
        this.x + this.w / 2,
        this.y + this.h - visualHeight, // tip (up)
        this.x + this.w,
        this.y + this.h, // bottom-right
      );
    } else {
      // Dark blue triangle, tip pointing DOWN — hangs from above
      fill(2, 21, 28); // #02151C
      triangle(
        this.x,
        this.y, // top-left
        this.x + this.w / 2,
        this.y + visualHeight, // tip (down)
        this.x + this.w,
        this.y, // top-right
      );
    }
  }
}

  class SpikeManager {
  constructor() {
    this.spikes = [];
    this.currentSpeed = 7;
    this.levelOneClusterSpawned = false;
  }

  reset() {
    this.spikes = [];
    this.currentSpeed = 7;
    this.levelOneClusterSpawned = false;
  }

  // lvl — current level config from LevelManager
  update(speed, intensity, maxIntensity, lvl) {
    this.currentSpeed = speed;

    // Use per-level spawn rate range
    const minRate = lvl ? lvl.spawnRateMin : 70;
    const maxRate = lvl ? lvl.spawnRateMax : 100;
    const spawnRate = map(intensity, 0, maxIntensity, maxRate, minRate);

    if (frameCount % floor(spawnRate) === 0) this._spawn(lvl);

    for (const s of this.spikes) s.x -= speed;
    this.spikes = this.spikes.filter((s) => s.x + s.w > 0);
  }

  _spawn(lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";

    if (
      isLevelOne &&
      !this.levelOneClusterSpawned &&
      frameCount > 240 &&
      frameCount % 420 === 0
    ) {
      this._spawnMidairCluster();
      this.levelOneClusterSpawned = true;
      return;
    }

    const airChance = lvl ? lvl.airSpikeChance : 0.35;
    if (random() < airChance) {
      this._spawnAir();
    } else {
      this._spawnGround();
    }
  }

  _spawnMidairCluster() {
    const y = 150;
    const h = random(55, 65);
    const w = random(28, 34);
    const gap = 10;
    const startX = width + 20;

    for (let i = 0; i < 3; i++) {
      this.spikes.push(new Spike(startX + i * (w + gap), y, w, h, "air"));
    }
  }

  _spawnGround() {
    const groundBase = GROUND + 40;
    const h = random(40, 55);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, groundBase - h, w, h, "ground"));

    if (random() < 0.3) {
      const h2 = h - random(10, 15);
      this.spikes.push(
        new Spike(width + 20 + w, groundBase - h2, w, h2, "ground"),
      );
    }
  }

  _spawnAir() {
    const h = random(50, 70);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, AIR_SPIKE_Y, w, h, "air"));
  }

  spawnAirSpikeAt(x, y, w, h) {
    this.spikes.push(new Spike(x, y, w, h, "air"));
  }

  draw(intensity, maxIntensity) {
    for (const s of this.spikes) s.draw(intensity, maxIntensity);
  }
}
