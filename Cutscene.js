/*
  Cutscene.js
  ─────────────────────────────────────────────
  Plays the between-level manhole geyser cutscene
  after Level 1 is cleared, before the Level Clear
  screen appears.

  HOW TO INTEGRATE (see sketch (2).js changes below):
  ─────────────────────────────────────────────
  1. Add this file to index.html BEFORE sketch (2).js:
       <script src="Cutscene.js"></script>

  2. In sketch (2).js, add at the top with other globals:
       let cutscene;

  3. In setup(), after other objects are created:
       cutscene = new Cutscene();

  4. In the PLAY state, change:
       if (levelScore >= lvl.dodgeGoal) {
         state = "levelclear";
         levelClearTimer = 180;
         return;
       }
     TO:
       if (levelScore >= lvl.dodgeGoal) {
         if (levelManager.currentIndex === 0) {
           cutscene.start();
           state = "cutscene";
         } else {
           state = "levelclear";
           levelClearTimer = 180;
         }
         return;
       }

  5. In draw(), add this block BEFORE the levelclear block:
       if (state === "cutscene") {
         cutscene.update();
         cutscene.draw();
         if (cutscene.isDone()) {
           state = "levelclear";
           levelClearTimer = 180;
         }
         return;
       }

  6. In keyPressed(), add:
       if (state === "cutscene" && keyCode === ENTER) {
         cutscene.skip();
       }
*/

class Cutscene {
  constructor() {
    // Phase constants
    this.SKATE = 0;
    this.IDLE = 1;
    this.RUMBLE = 2;
    this.BURST = 3;
    this.LAUNCH = 4;
    this.HOLD = 5;
    this.DONE = 6;

    this._done = false;
    this.reset();
  }

  // ── Public API ──────────────────────────────

  start() {
    this.reset();
    this._done = false;
  }

  skip() {
    this._done = true;
  }

  isDone() {
    return this._done;
  }

  reset() {
    this.phase = this.SKATE;
    this.phaseT = 0;
    this.t = 0;

    // charY = bottom edge of the sprite = the ground line (GROUND + player.h)
    this.charX = -50;
    this.charY = GROUND + 40;

    this.lidY = GROUND + 40;
    this.lidVY = 0;
    this.waterH = 0;
    this.shake = 0;
    this.launchVY = 0;
    this.flashA = 0;

    this.manholeX = width / 2;
    this._done = false;
  }

  // ── Called every frame from draw() ──────────

  update() {
    this.t++;
    this.phaseT++;

    const mx = this.manholeX;
    const groundY = GROUND;

    if (this.phase === this.SKATE) {
      const dist = mx - this.charX;
      const speed = dist > 120 ? 5 : dist > 30 ? 2.5 : dist > 2 ? 0.8 : 0;
      this.charX += speed;
      // no vertical bob — keep feet flat on ground
      this.charY = groundY + 40;
      if (dist < 2) {
        this.charX = mx;
        this._setPhase(this.IDLE);
      }
    }

    if (this.phase === this.IDLE) {
      this.charX = mx;
      this.charY = groundY + 40;
      if (this.phaseT > 70) {
        this._setPhase(this.RUMBLE);
        this.shake = 2;
      }
    }

    if (this.phase === this.RUMBLE) {
      this.charX = mx + sin(this.t * 0.6) * 3;
      this.charY = groundY + 40; // stay on ground, shake handles visual movement
      this.shake = 2.5 + this.phaseT * 0.05;
      if (this.phaseT > 90) {
        this._setPhase(this.BURST);
        this.lidVY = -22;
        this.launchVY = -3;
        this.shake = 10;
      }
    }

    if (this.phase === this.BURST) {
      this.waterH = min(this.waterH + 16, GROUND * 0.8);
      this.lidY += this.lidVY;
      this.lidVY += 1.4;
      this.charY += this.launchVY;
      this.launchVY -= 0.4;
      if (this.phaseT > 18 && this.launchVY < 0) {
        this._setPhase(this.LAUNCH);
        this.launchVY = -22;
      }
    }

    if (this.phase === this.LAUNCH) {
      this.charY += this.launchVY;
      this.launchVY += 0.08;
      this.waterH = max(this.waterH - 6, 0);
      if (this.charY < -100) {
        this._setPhase(this.HOLD);
      }
    }

    if (this.phase === this.HOLD) {
      this.waterH = max(this.waterH - 4, 0);
      // White flash fades in
      this.flashA = min(this.flashA + 8, 255);
      if (this.phaseT > 60) {
        this._done = true;
      }
    }

    // Decay shake
    if (this.shake > 0) this.shake *= 0.85;
  }

  draw() {
    const sx = this.shake > 0 ? random(-this.shake, this.shake) : 0;
    const sy = this.shake > 0 ? random(-this.shake * 0.5, this.shake * 0.5) : 0;

    push();
    translate(sx, sy);

    // Water geyser
    this._drawWater();

    // Manhole lid (hide once launched)
    if (this.phase < this.LAUNCH || this.phase === this.HOLD) {
      const lidOff = max(0, GROUND + 40 - this.lidY);
      this._drawManhole(lidOff);
    }

    // Character (hide during HOLD/flash)
    if (this.phase !== this.HOLD) {
      this._drawCharacter(this.charX, this.charY);
    }

    // White flash overlay
    if (this.flashA > 0) {
      noStroke();
      fill(255, this.flashA);
      rect(0, 0, width, height);
    }

    // Skip hint
    fill(255, 180);
    noStroke();
    textAlign(RIGHT);
    textSize(11);
    text("ENTER — skip", width - 10, height - 8);
    textAlign(LEFT);

    pop();
  }

  // ── Private helpers ─────────────────────────

  _setPhase(p) {
    this.phase = p;
    this.phaseT = 0;
  }

  _drawWater() {
    if (this.waterH <= 0) return;
    const mx = this.manholeX;
    const groundLine = GROUND + 40;
    const bw = 28;
    const step = 4;
    noStroke();
    for (let seg = 0; seg < this.waterH; seg += step) {
      const wobble = sin(this.t * 0.4 + seg * 0.15) * 3;
      fill(seg % 8 < 4 ? color(77, 184, 232) : color(42, 159, 216));
      rect(mx - bw / 2 + wobble, groundLine - seg - step, bw + step, step);
    }
    // Droplets
    fill(77, 184, 232);
    for (let d = 0; d < 6; d++) {
      const dx = mx + sin(this.t * 0.5 + d * 1.1) * 22;
      const dy = groundLine - this.waterH - d * 12 - 5;
      rect(dx - 2, dy, 4, 8);
    }
  }

  _drawManhole(lidOffsetY) {
    const mx = this.manholeX;
    const my = GROUND + 40;
    const rw = 36;
    const rh = 10;
    const ly = my - lidOffsetY;

    noStroke();
    // Shadow
    fill(30, 30, 30, 120);
    ellipse(mx + 2, my + 2, rw * 2, rh * 0.8);
    // Ring
    fill(85, 85, 85);
    ellipse(mx, my, rw * 2, rh * 0.8);
    // Hole darkness
    fill(20, 20, 20);
    ellipse(mx, my, (rw - 4) * 2, (rh - 2) * 0.8);
    // Lid body
    fill(100, 100, 100);
    ellipse(mx, ly, rw * 2, rh * 0.8);
    // Lid highlight
    fill(120, 120, 120);
    ellipse(mx, ly - 1, (rw - 2) * 2, (rh - 2) * 0.7);
    // Cross detail
    stroke(85);
    strokeWeight(2);
    line(mx - 24, ly, mx + 24, ly);
    line(mx, ly - 6, mx, ly + 6);
    noStroke();
  }

  // SKATE phase → running-skin.gif
  // IDLE / RUMBLE phases → standing-skin.gif
  // BURST / LAUNCH → running-skin.gif (being launched)
  // imgIdle and imgRun are the globals loaded in sketch (2).js preload()
  _drawCharacter(x, y) {
    // y = bottom edge of the sprite (ground line), x = horizontal centre
    const spriteW = 70;
    const spriteH = 70;
    const drawX = round(x) - spriteW / 2;
    const drawY = round(y) - spriteH; // top of sprite = bottom - height

    const isMoving =
      this.phase === this.SKATE ||
      this.phase === this.BURST ||
      this.phase === this.LAUNCH;

    const img = isMoving ? imgRun : imgIdle;

    if (img) {
      noTint();
      image(img, drawX, drawY, spriteW, spriteH);
    }
  }
}
