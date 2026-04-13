class LevelManager {
  constructor() {
    this.levels = [
      // ── Level 1 — The City ──────────────────
      {
        name: "Level 1 — Fractured Skylines",
        dodgeGoal: 20,
        bgLayers: [
          { path: "assets/city 1.png", speed: 0.1 },
          { path: "assets/city 2.png", speed: 0.25 },
          { path: "assets/city 3.png", speed: 0.5 },
          { path: "assets/city 4.png", speed: 0.75 },
          { path: "assets/city 5.png", speed: 1.0 },
        ],
        bgTint: null,
        groundStroke: [40, 40, 40],
        airSpikeChance: 0.35,
        baseSpeed: 4,
        maxSpeedBonus: 1,
        spawnRateMin: 70,
        spawnRateMax: 100,
        platformColor: [222, 153, 182],
        hasPlatforms: true,
        message: "You survived Fractured Skylines! Heading deeper...",
      },

      // ── Level 2 — Sky ─────────────────
      {
        name: "Level 2 — Sky",
        dodgeGoal: 20,
        bgLayers: [
          { path: "assets/cloud 1.png", speed: 0.1 },
          { path: "assets/cloud 2.png", speed: 0.25 },
          { path: "assets/cloud 3.png", speed: 0.5 },
          { path: "assets/cloud 4.png", speed: 0.75 },
          { path: "assets/cloud 5.png", speed: 1.0 },
        ],
        bgTint: [10, 20, 70, 100],
        groundStroke: [80, 120, 200],
        airSpikeChance: 0.5,
        baseSpeed: 5,
        maxSpeedBonus: 1.5,
        spawnRateMin: 60,
        spawnRateMax: 90,
        platformColor: [200, 200, 255],
        hasPlatforms: true,
        message:
          "You've cleared the cityscape, but one final challenge awaits...",
      },

      // ── Level 3 — Cave ──────────────────
      {
        name: "Level 3 — Cave",
        dodgeGoal: 20,
        bgLayers: [
          { path: "assets/cave 1.png", speed: 0.1 },
          { path: "assets/cave 2.png", speed: 0.25 },
          { path: "assets/cave 3.png", speed: 0.5 },
          { path: "assets/cave 4.png", speed: 0.75 },
          { path: "assets/cave 5.png", speed: 1.0 },
        ],
        bgTint: [5, 0, 20, 180],
        groundStroke: [180, 50, 220],
        airSpikeChance: 0.6,
        baseSpeed: 6,
        maxSpeedBonus: 2,
        spawnRateMin: 50,
        spawnRateMax: 80,
        platformColor: [150, 100, 200],
        hasPlatforms: true,
        message: "You've cleared the sky but now you must face the darkness...",
      },
    ];

    this.currentIndex = 0;
  }

  get current() {
    return this.levels[this.currentIndex];
  }

  get totalLevels() {
    return this.levels.length;
  }

  hasNext() {
    return this.currentIndex < this.levels.length - 1;
  }

  advance() {
    if (this.hasNext()) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  reset() {
    this.currentIndex = 0;
  }
}
