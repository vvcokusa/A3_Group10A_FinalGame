/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Spawns, scrolls, and culls elevated platforms.

  draw() now accepts an optional platformColor
  array [r,g,b] passed from the level config so
  platform colour changes between levels.
*/

/*
class PlatformManager {
  constructor() {
    this.platforms = [];
    this.respawnList = [];
    this._spawnTimer = 0;
    this.spawnCounter = 0;
    this._resetSpawnTimer();
  }

  reset() {
    this.platforms = [];
    this.respawnList = [];
    this._resetSpawnTimer();
  }

  update(speed) {
    for (const p of this.platforms) {
      p.update();
      p.x -= speed;
    }
    // Remove platforms marked for removal and add to respawn list
    this.platforms = this.platforms.filter((p) => {
      if (p.toRemove) {
        this.respawnList.push({ x: p.x, timer: 120 });
        return false;
      }
      return p.x + p.w > 0;
    });

    // Update respawn timers
    for (let i = this.respawnList.length - 1; i >= 0; i--) {
      this.respawnList[i].timer--;
      if (this.respawnList[i].timer <= 0) {
        this._spawnPlatformAtOffset(random(-100, 100));
        this.respawnList.splice(i, 1);
      }
    }

    this._spawnTimer -= speed;
    if (this._spawnTimer <= 0) {
      this._spawnPlatform();
      this._resetSpawnTimer();
    }
  }

  // platformColor — optional [r,g,b] array from level config
  draw(platformColor) {
    for (const p of this.platforms) p.draw(platformColor);
  }

  _spawnPlatform() {
    const w = random(160, 250);
    const p = new Platform(width + 40, PLATFORM_Y, w, 14);
    this.spawnCounter++;
    if (this.spawnCounter % 2 === 1) {
      p.isFading = true;
      p.color = [222, 153, 182]; // pink for fading
    } else {
      p.isFading = false;
      p.color = [180, 180, 180]; // gray for non-fading
    }
    this.platforms.push(p);
  }

  _spawnPlatformAtOffset(offset) {
    const w = random(160, 250);
    const p = new Platform(width + 40 + offset, PLATFORM_Y, w, 14);
    this.spawnCounter++;
    if (this.spawnCounter % 2 === 1) {
      p.isFading = true;
      p.color = [222, 153, 182]; // pink for fading
    } else {
      p.isFading = false;
      p.color = [180, 180, 180]; // gray for non-fading
    }
    this.platforms.push(p);
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}


class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0;
    this._resetSpawnTimer();
    this.removedPlatforms = [];
  }

  reset() {
    this.platforms = [];
    this.removedPlatforms = [];
    this._resetSpawnTimer();
  }

  update(speed, lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";
    const driftFactor = isLevelTwo && shakeActive ? 2.5 : 1;
    const driftX = isLevelTwo ? sin(frameCount * 0.02) * 0.8 * driftFactor : 0;

    for (const p of this.platforms) {
      p.x -= speed;
      if (isLevelTwo) p.x += driftX;
      if (p.dissolveTimer != null) {
        p.dissolveTimer--;
        p.alpha = map(p.dissolveTimer, 0, p.dissolveDuration, 0, 255);
      }
      p.age++;
    }

    // Handle platform removal and respawning
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const isOffScreen = p.x + p.w <= 0;
      const hasReachedFadeEnd = isLevelOne && p.age >= 120;

      if (p.dissolveTimer != null && p.dissolveTimer <= 0) {
        this.platforms.splice(i, 1);
      } else if (isOffScreen) {
        this.platforms.splice(i, 1);
      } else if (hasReachedFadeEnd) {
        // Platform reached end of fade lifecycle
        if (p.behavior === "fade_respawn") {
          // Mark for respawn
          this.removedPlatforms.push({
            platform: p,
            removalTime: frameCount,
            originalWidth: p.w,
          });
          this.platforms.splice(i, 1);
        } else if (p.behavior === "fade_only") {
          // Keep the platform but cap its alpha at ~0.3 so it's semi-visible
          p.alpha = 80; // semi-transparent but playable
          p.age = 120; // prevent further age increases
        }
      }
    }

    // Check if removed platforms should respawn (120 frames later)
    if (isLevelOne) {
      for (let i = this.removedPlatforms.length - 1; i >= 0; i--) {
        const removed = this.removedPlatforms[i];
        const timeSinceRemoval = frameCount - removed.removalTime;
        if (timeSinceRemoval >= 120) {
          // Respawn at a slightly different x position
          const newX = width + 40 + random(-80, 80);
          removed.platform.x = newX;
          removed.platform.age = 0;
          removed.platform.alpha = 255;
          this.platforms.push(removed.platform);
          this.removedPlatforms.splice(i, 1);
        }
      }
    } else {
      this.platforms = this.platforms.filter((p) => p.x + p.w > 0);
    }

    this._spawnTimer -= speed;
    if (this._spawnTimer <= 0) {
      this._spawnPlatform(lvl);
      this._resetSpawnTimer();
    }
  }

  // platformColor — optional [r,g,b] array from level config
  draw(platformColor) {
    for (const p of this.platforms) p.draw(platformColor);
  }

  _spawnPlatform(lvl) {
    const w = random(160, 250);
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";
    // For level 1, randomly choose behavior: 50% fade-only, 50% fade-respawn
    const behavior =
      isLevelOne && random() < 0.5 ? "fade_only" : "fade_respawn";

    let y = PLATFORM_Y;
    if (isLevelTwo) {
      const cloudYs = [170, 185, 200];
      y = random(cloudYs);
    }

    this.platforms.push(new Platform(width + 40, y, w, 14, behavior));
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}
  */
/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Level 2 overhaul:
    • Ground floor replaced by a dense "cloud_floor" layer at y=255.
      Spawns frequently (timer 80-120px). 10% chance of a gap each spawn.
    • Three elevated cloud tiers at fixed heights: y=200 / y=155 / y=115.
      Each tier uses its own independent spawn timer.
    • cloud_floor platforms are tagged layer="floor" so Player.js and
      sketch.js can detect fall-through separately from normal death.

  Level 1: scaffolding, overlap-checked, fade mechanic unchanged.
  Level 3: scaffolding / double_scaffolding 50/50, overlap-checked.


class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0;
    this._resetSpawnTimer();
    this.removedPlatforms = [];

    // Level 2 — separate timers for floor and each elevated tier
    this._floorTimer = 0;
    this._tierTimers = [0, 0, 0]; // low / mid / high
    this._resetFloorTimer();
    this._resetTierTimers();
  }

  reset() {
    this.platforms = [];
    this.removedPlatforms = [];
    this._resetSpawnTimer();
    this._floorTimer = 0;
    this._tierTimers = [0, 0, 0];
    this._resetFloorTimer();
    this._resetTierTimers();
  }

  // Called from sketch.js after reset() when entering Level 2,
  // because width is available there (after createCanvas).
  preloadLevel2(screenWidth) {
    // ── Starter floor cloud — covers full screen width ────────────────
    // Gives the player ~3s of safe ground at speed=5px/frame.
    const starterW = screenWidth;
    this.platforms.push(
      new Platform(0, 255, starterW, 14, "fade_respawn", "cloud_floor"),
    );

    // ── Pre-place floor clouds immediately after the starter ──────────
    // These fill the gap that would otherwise appear when the starter
    // scrolls off before the dynamic timer fires. We place enough to
    // cover another full screen width beyond the starter, with natural
    // small gaps (one in five skipped randomly).
    let nextX = starterW + 10;
    while (nextX < starterW + screenWidth) {
      if (random() > 0.15) {
        // 85% spawn, 15% gap in pre-placed section
        const w = floor(random(100, 160));
        this.platforms.push(
          new Platform(nextX, 255, w, 14, "fade_respawn", "cloud_floor"),
        );
        nextX += w + floor(random(8, 20)); // small gap between clouds
      } else {
        nextX += floor(random(60, 100)); // larger gap
      }
    }

    // ── Elevated tiers already on screen ─────────────────────────────
    this.platforms.push(
      new Platform(screenWidth * 0.35, 200, 120, 14, "fade_respawn", "cloud"),
    );
    this.platforms.push(
      new Platform(screenWidth * 0.55, 155, 120, 14, "fade_respawn", "cloud"),
    );
    this.platforms.push(
      new Platform(screenWidth * 0.75, 115, 120, 14, "fade_respawn", "cloud"),
    );

    // ── Set timers small so dynamic spawning starts immediately ───────
    // _floorTimer counts down by speed (~5) each frame.
    // Setting it to 100 means the first dynamic floor cloud spawns
    // within ~20 frames, seamlessly continuing the pre-placed section.
    this._floorTimer = 100;
    this._tierTimers = [180, 260, 340]; // staggered so tiers don't all appear at once
  }

  update(speed, lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";
    const isLevelThree = lvl && lvl.name === "Level 3 — Cave";

    const driftFactor = isLevelTwo && shakeActive ? 2.5 : 1;
    const driftX = isLevelTwo ? sin(frameCount * 0.02) * 0.8 * driftFactor : 0;

    for (const p of this.platforms) {
      p.x -= speed;
      if (isLevelTwo) p.x += driftX;
      // cloud_floor platforms never dissolve — skip timer entirely
      if (p.dissolveTimer != null && p.spriteMode !== "cloud_floor") {
        p.dissolveTimer--;
        p.alpha = map(p.dissolveTimer, 0, p.dissolveDuration, 0, 255);
      }
      p.age++;
    }

    // ── Remove / fade / respawn ───────────────
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const isOffScreen = p.x + p.w <= 0;
      const hasReachedFadeEnd = isLevelOne && p.age >= 120;

      // cloud_floor platforms are never deleted by dissolveTimer — only by scrolling off screen
      if (
        p.dissolveTimer != null &&
        p.dissolveTimer <= 0 &&
        p.spriteMode !== "cloud_floor"
      ) {
        this.platforms.splice(i, 1);
      } else if (isOffScreen) {
        this.platforms.splice(i, 1);
      } else if (hasReachedFadeEnd) {
        if (p.behavior === "fade_respawn") {
          this.removedPlatforms.push({
            platform: p,
            removalTime: frameCount,
            originalWidth: p.w,
          });
          this.platforms.splice(i, 1);
        } else if (p.behavior === "fade_only") {
          p.alpha = 80;
          p.age = 120;
        }
      }
    }

    // Level 1 respawn with overlap check
    if (isLevelOne) {
      for (let i = this.removedPlatforms.length - 1; i >= 0; i--) {
        const removed = this.removedPlatforms[i];
        if (frameCount - removed.removalTime >= 120) {
          const newX = width + 40 + random(-80, 80);
          if (!this._overlaps(newX, removed.platform.w, 60, null)) {
            removed.platform.x = newX;
            removed.platform.age = 0;
            removed.platform.alpha = 255;
            this.platforms.push(removed.platform);
            this.removedPlatforms.splice(i, 1);
          }
        }
      }
    } else {
      this.platforms = this.platforms.filter((p) => p.x + p.w > 0);
    }

    // ── Spawn ─────────────────────────────────
    if (isLevelTwo) {
      this._updateLevel2Spawn(speed);
    } else {
      this._spawnTimer -= speed;
      if (this._spawnTimer <= 0) {
        this._spawnPlatform(lvl);
        this._resetSpawnTimer();
      }
    }
  }

  // ── Level 2 spawn — floor + 3 tiers independently ──
  _updateLevel2Spawn(speed) {
    // Floor clouds — dense, 10-20% gap chance
    this._floorTimer -= speed;
    if (this._floorTimer <= 0) {
      const gapChance = random(0.1, 0.2); // between 10% and 20% each spawn
      if (random() > gapChance) {
        const w = floor(random(100, 160));
        this.platforms.push(
          new Platform(width + 40, 255, w, 14, "fade_respawn", "cloud_floor"),
        );
      }
      this._resetFloorTimer();
    }

    // Elevated tiers — low / mid / high
    const tierYs = [200, 155, 115];
    for (let t = 0; t < 3; t++) {
      this._tierTimers[t] -= speed;
      if (this._tierTimers[t] <= 0) {
        const w = 120;
        const y = tierYs[t];
        this.platforms.push(
          new Platform(width + 40, y, w, 14, "fade_respawn", "cloud"),
        );
        this._tierTimers[t] = random(320, 520); // each tier independent
      }
    }
  }

  draw(platformColor, imgScaffold, imgDoubleScaffold, imgCloud) {
    for (const p of this.platforms) {
      p.draw(platformColor, imgScaffold, imgDoubleScaffold, imgCloud);
    }
  }

  // ── Helper: does (spawnX, w) overlap any platform on the same y layer? ──
  // layer=null checks all platforms; layer="floor" / "cloud" checks only that type.
  _overlaps(spawnX, w, minGap = 60, layer = null) {
    for (const existing of this.platforms) {
      if (layer !== null && existing.spriteMode !== layer) continue;
      if (
        existing.x < spawnX + w + minGap &&
        existing.x + existing.w > spawnX - minGap
      )
        return true;
    }
    return false;
  }

  _spawnPlatform(lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelThree = lvl && lvl.name === "Level 3 — Cave";

    let w, spriteMode, behavior, y;
    const spawnX = width + 40;

    if (isLevelOne) {
      w = 200;
      spriteMode = "scaffolding";
      behavior = random() < 0.5 ? "fade_only" : "fade_respawn";
      y = PLATFORM_Y;
      if (this._overlaps(spawnX, w)) {
        this._resetSpawnTimer();
        return;
      }
    } else if (isLevelThree) {
      w = 200;
      spriteMode = random() < 0.5 ? "scaffolding" : "double_scaffolding";
      behavior = "fade_respawn";
      y = PLATFORM_Y;
      if (this._overlaps(spawnX, w)) {
        this._resetSpawnTimer();
        return;
      }
    } else {
      w = random(160, 250);
      spriteMode = "rect";
      behavior = "fade_respawn";
      y = PLATFORM_Y;
    }

    this.platforms.push(new Platform(spawnX, y, w, 14, behavior, spriteMode));
  }

  // ── Timers ────────────────────────────────────
  // Floor spawns every ~110px of scroll — dense but not wall-to-wall
  _resetFloorTimer() {
    this._floorTimer = random(80, 130);
  }
  _resetTierTimers() {
    this._tierTimers = [random(300, 500), random(380, 560), random(420, 620)];
  }
  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}
*/

/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Level 1 — Fractured Skylines:
    Scaffolding platforms (scaffolding.png) at PLATFORM_Y.
    50% fade_only / 50% fade_respawn. Overlap-checked.

  Level 2 — Sky:
    Dense "cloud_floor" layer at y=255 (never disappears).
    Three independent elevated cloud tiers: y=200 / 155 / 115.
    Elevated clouds dissolve when landed on.
    Call preloadLevel2() from startNextLevel() after createCanvas.

  Level 3 — Cave:
    50% scaffolding / 50% double_scaffolding at PLATFORM_Y.
    Overlap-checked.

  draw() passes sprite images through to Platform.draw().
*/

class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0;
    this.removedPlatforms = [];

    // Level 2 independent timers
    this._floorTimer = 0;
    this._tierTimers = [0, 0, 0, 0];

    this._resetSpawnTimer();
    this._resetFloorTimer();
    this._resetTierTimers();
  }

  reset() {
    this.platforms = [];
    this.removedPlatforms = [];
    this._resetSpawnTimer();
    this._floorTimer = 0;
    this._tierTimers = [0, 0, 0, 0];
    this._resetFloorTimer();
    this._resetTierTimers();
  }

  // ── Level 2 pre-load ─────────────────────────
  // Call once from startNextLevel() when entering Level 2.
  preloadLevel2(screenWidth) {
    // ── Gapless cloud floor — two screen widths so it never runs out ──
    this.platforms.push(
  new Platform(0, 255, 260, 14, "fade_respawn", "cloud_floor"),
);

    // ── Pre-place clouds on 4 elevated tiers ─────────────────────────
    // Tiers from lowest to highest: 215, 185, 155, 120
    const tierYs = [215, 170, 125];
    const tierGaps = [420, 500, 580]; // spacing between clouds per tier

    for (let t = 0; t < tierYs.length; t++) {
      let x = screenWidth * 0.15 + t * 55; // stagger each tier's start
      while (x < screenWidth * 1.8) {
        const w = floor(random(120, 170));
        this.platforms.push(
          new Platform(x, tierYs[t], w, 14, "fade_respawn", "cloud"),
        );
        x += w + tierGaps[t] + floor(random(-30, 30));
      }
    }

    // Prime timers so dynamic spawning starts immediately
    this._floorTimer = 80;
    this._tierTimers = [220, 320, 420];
  }

  // ── Main update ──────────────────────────────
  update(speed, lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";

    // Gentle horizontal drift in Level 2
    const driftFactor = isLevelTwo && shakeActive ? 2.5 : 1;
    const driftX = isLevelTwo ? sin(frameCount * 0.02) * 0.8 * driftFactor : 0;

    for (const p of this.platforms) {
      p.x -= speed;
      if (isLevelTwo) p.x += driftX;

      // cloud_floor platforms never dissolve
      if (p.dissolveTimer != null && p.spriteMode !== "cloud_floor") {
        p.dissolveTimer--;
        p.alpha = map(p.dissolveTimer, 0, p.dissolveDuration, 0, 255);
      }
      p.age++;
    }

    // ── Remove / fade / respawn ───────────────
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const isOffScreen = p.x + p.w <= 0;
      const hasReachedFadeEnd = isLevelOne && p.age >= 120;

      if (
        p.dissolveTimer != null &&
        p.dissolveTimer <= 0 &&
        p.spriteMode !== "cloud_floor"
      ) {
        this.platforms.splice(i, 1);
      } else if (isOffScreen) {
        this.platforms.splice(i, 1);
      } else if (hasReachedFadeEnd) {
        if (p.behavior === "fade_respawn") {
          this.removedPlatforms.push({
            platform: p,
            removalTime: frameCount,
            originalWidth: p.w,
          });
          this.platforms.splice(i, 1);
        } else if (p.behavior === "fade_only") {
          p.alpha = 80;
          p.age = 120;
        }
      }
    }

    // ── Level 1: respawn queued platforms ─────
    if (isLevelOne) {
      for (let i = this.removedPlatforms.length - 1; i >= 0; i--) {
        const removed = this.removedPlatforms[i];
        if (frameCount - removed.removalTime >= 120) {
          const newX = width + 40 + random(-80, 80);
          if (!this._overlaps(newX, removed.platform.w, 60, null)) {
            removed.platform.x = newX;
            removed.platform.age = 0;
            removed.platform.alpha = 255;
            this.platforms.push(removed.platform);
            this.removedPlatforms.splice(i, 1);
          }
        }
      }
    }

    // ── Spawn ─────────────────────────────────
    if (isLevelTwo) {
      this._updateLevel2Spawn(speed);
    } else {
      this._spawnTimer -= speed;
      if (this._spawnTimer <= 0) {
        this._spawnPlatform(lvl);
        this._resetSpawnTimer();
      }
    }
  }

  // ── Level 2: gapless floor + 4 independent cloud tiers ─────────────
  _updateLevel2Spawn(speed) {
    // Floor — always spawn, no gaps, so the player always has ground
    this._floorTimer -= speed;
    if (this._floorTimer <= 0) {
      const w = floor(random(160, 220));
      this.platforms.push(
        new Platform(width + 40, 255, w, 14, "fade_respawn", "cloud_floor"),
      );
      this._resetFloorTimer();
    }

    // 4 elevated tiers: low → high
    const tierYs = [215, 170, 125];
    const tierGaps = [420, 500, 580];
    for (let t = 0; t < 3; t++) {
      this._tierTimers[t] -= speed;
      if (this._tierTimers[t] <= 0) {
        const w = floor(random(120, 170));
        this.platforms.push(
          new Platform(width + 40, tierYs[t], w, 14, "fade_respawn", "cloud"),
        );
        this._tierTimers[t] = tierGaps[t] + random(-30, 30);
      }
    }
  }

  // ── Platform spawn for Levels 1 & 3 ─────────
  _spawnPlatform(lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelThree = lvl && lvl.name === "Level 3 — Cave";
    const spawnX = width + 40;
    const w = 200;

      if (isLevelOne) {
      const behavior = "solid";
      if (this._overlaps(spawnX, w)) {
        this._resetSpawnTimer();
        return;
      }

      const p = new Platform(spawnX, PLATFORM_Y, w, 14, behavior, "scaffolding");

      p.hasGarbage = random() < 0.75;
      p.garbageOffsetX = random(20, w - 70);

      // bigger garbage hitbox
      p.garbageW = 46;
      p.garbageH = 46;

      this.platforms.push(p);
    } else if (isLevelThree) {
      // 50% scaffolding / 50% double_scaffolding on Level 3
      const spriteMode = random() < 0.5 ? "scaffolding" : "double_scaffolding";
      if (this._overlaps(spawnX, w)) {
        this._resetSpawnTimer();
        return;
      }
      this.platforms.push(
        new Platform(spawnX, PLATFORM_Y, w, 14, "fade_respawn", spriteMode),
      );
    } else {
      // Fallback rect (should not normally be reached)
      this.platforms.push(
        new Platform(
          spawnX,
          PLATFORM_Y,
          random(160, 250),
          14,
          "fade_respawn",
          "rect",
        ),
      );
    }
  }

  // ── Draw ─────────────────────────────────────
  draw(platformColor, imgScaffold, imgDoubleScaffold, imgCloud, imgGarbage) {
  for (const p of this.platforms) {
    p.draw(
      platformColor,
      imgScaffold,
      imgDoubleScaffold,
      imgCloud,
      imgGarbage
    );
  }
}

  // ── Overlap guard ─────────────────────────────
  _overlaps(spawnX, w, minGap = 60, layer = null) {
    for (const existing of this.platforms) {
      if (layer !== null && existing.spriteMode !== layer) continue;
      if (
        existing.x < spawnX + w + minGap &&
        existing.x + existing.w > spawnX - minGap
      )
        return true;
    }
    return false;
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
  _resetFloorTimer() {
    this._floorTimer = random(80, 130);
  }
  _resetTierTimers() {
    this._tierTimers = [
      random(200, 280),
      random(240, 320),
      random(280, 360),
      random(320, 400),
    ];
  }
}
