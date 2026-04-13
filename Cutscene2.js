/*
  Cutscene2.js
  ─────────────────────────────────────────────
  Sky-to-cave cutscene after Level 2 clears.

  Flow:
    HOP     — character hops across 4 clouds
    LAST    — brief pause on final cloud
    CRUMBLE — cloud dissolves pixel by pixel
    PAUSE   — character hangs dramatically (~1.5s)
    FALL    — character drops off screen; sky stays clear
    BLACKOUT— ~1.5s delay, then darkness slams in fast
    REVEAL  — character re-enters falling through black,
              spotlight grows to reveal 8-bit cave below
    HOLD    — hold before done

  HOW TO INTEGRATE:
  ─────────────────────────────────────────────
  1. index.html — add BEFORE sketch (2).js:
       <script src="Cutscene2.js"></script>

  2. sketch (2).js globals — add:
       let cutscene2;

  3. setup() — add after cutscene = new Cutscene():
       cutscene2 = new Cutscene2();

  4. In draw(), PLAY state level-complete check:

       if (levelScore >= lvl.dodgeGoal) {
         if (levelManager.currentIndex === 0) {
           cutscene.start();
           state = "cutscene";
         } else if (levelManager.currentIndex === 1) {
           cutscene2.start();
           state = "cutscene2";
         } else {
           state = "levelclear";
           levelClearTimer = 180;
         }
         return;
       }

  5. In draw(), add BEFORE the "cutscene" block:

       if (state === "cutscene2") {
         cutscene2.update();
         cutscene2.draw(allBgLayers[2]);
         if (cutscene2.isDone()) {
           state = "levelclear";
           levelClearTimer = 180;
         }
         return;
       }

  6. keyPressed() — add:
       if (state === "cutscene2" && keyCode === ENTER) {
         cutscene2.skip();
       }
*/

class Cutscene2 {
  constructor() {
    this.HOP = 0;
    this.LAST = 1;
    this.CRUMBLE = 2;
    this.PAUSE = 3;
    this.FALL = 4;
    this.BLACKOUT = 5;
    this.REVEAL = 6;
    this.HOLD = 7;

    this._done = false;
    this._stalactites = [];
    this._crystals = [];
    this._rocks = [];
    this._buildScenery();
    this._clouds = [];
    this.reset();
  }

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
    this.phase = this.HOP;
    this.phaseT = 0;
    this.t = 0;
    this.charX = 0;
    this.charY = 0;
    this.charVX = 0;
    this.charVY = 0;
    this.jumping = false;
    this.currentCloud = 0;
    this.hopTarget = 1;
    this.crumbleT = 0;
    this.pauseT = 0;
    this.fallVY = 0;
    this.blackoutT = 0;
    this.shake = 0;
    this.darkA = 0;
    this.lightR = 0;
    this._done = false;

    const groundY = GROUND + 20;
    this._clouds = [
      { x: 40, y: groundY - 20, w: 130, h: 20, isFinal: false, pixels: null },
      { x: 210, y: groundY - 40, w: 110, h: 20, isFinal: false, pixels: null },
      { x: 370, y: groundY - 25, w: 120, h: 20, isFinal: false, pixels: null },
      { x: 540, y: groundY - 35, w: 110, h: 20, isFinal: true, pixels: null },
    ];
    this._clouds.forEach((cl) => this._initCloudPixels(cl));

    const first = this._clouds[0];
    this.charX = first.x + first.w / 2;
    this.charY = first.y;
  }

  update() {
    this.t++;
    this.phaseT++;
    if (this.shake > 0) this.shake *= 0.85;
    switch (this.phase) {
      case this.HOP:
        this._updateHop();
        break;
      case this.LAST:
        this._updateLast();
        break;
      case this.CRUMBLE:
        this._updateCrumble();
        break;
      case this.PAUSE:
        this._updatePause();
        break;
      case this.FALL:
        this._updateFall();
        break;
      case this.BLACKOUT:
        this._updateBlackout();
        break;
      case this.REVEAL:
        this._updateReveal();
        break;
      case this.HOLD:
        this._updateHold();
        break;
    }
  }

  draw(caveLayers) {
    const sx = this.shake > 0 ? random(-this.shake, this.shake) : 0;
    const sy = this.shake > 0 ? random(-this.shake * 0.4, this.shake * 0.4) : 0;
    push();
    translate(sx, sy);

    if (this.phase >= this.REVEAL) {
      this._drawCaveScene(caveLayers);
    } else {
      this._drawSkyBg();
    }

    if (this.phase <= this.CRUMBLE) {
      for (const cl of this._clouds) this._drawCloud(cl);
    }

    const isMoving =
      this.jumping ||
      this.phase === this.FALL ||
      this.phase === this.REVEAL ||
      (this.phase === this.CRUMBLE && this.crumbleT > 12);

    if (this.phase !== this.BLACKOUT) {
      this._drawCharacter(this.charX, this.charY, isMoving);
    }

    if (this.phase === this.PAUSE && floor(this.t / 18) % 2 === 0) {
      noStroke();
      fill(255, 255, 200, 220);
      rect(round(this.charX) - 13, round(this.charY) - 60, 26, 18, 3);
      fill(40);
      textAlign(CENTER, CENTER);
      textSize(12);
      text("...", round(this.charX), round(this.charY) - 51);
    }

    if (this.darkA > 0) {
      noStroke();
      fill(0, this.darkA);
      rect(0, 0, width, height);
      // Show spotlight + character during both REVEAL and HOLD
      if (
        (this.phase === this.REVEAL || this.phase === this.HOLD) &&
        this.lightR > 0
      ) {
        this._drawSpotlight(this.charX, this.charY - 20, this.lightR);
        this._drawCharacter(this.charX, this.charY, this.phase === this.REVEAL);
      }
    }

    noStroke();
    fill(255, 150);
    textAlign(RIGHT);
    textSize(11);
    text("ENTER — skip", width - 10, height - 8);
    textAlign(LEFT);

    pop();
  }

  _updateHop() {
    if (!this.jumping && this.phaseT > 30) {
      const tgt = this._clouds[this.hopTarget];
      if (!tgt) {
        this._setPhase(this.LAST);
        return;
      }
      this.charVX = (tgt.x + tgt.w / 2 - this.charX) / 26;
      this.charVY = -10;
      this.jumping = true;
    }
    if (this.jumping) {
      this.charX += this.charVX;
      this.charVY += 0.62;
      this.charY += this.charVY;
      const tgt = this._clouds[this.hopTarget];
      if (
        this.charVY > 0 &&
        this.charX > tgt.x + 4 &&
        this.charX < tgt.x + tgt.w - 4 &&
        this.charY >= tgt.y - 4
      ) {
        this.charY = tgt.y;
        this.charVX = 0;
        this.charVY = 0;
        this.jumping = false;
        this.currentCloud = this.hopTarget;
        this.hopTarget++;
        this.phaseT = 0;
        this.shake = 4;
        if (this.currentCloud === this._clouds.length - 1)
          this._setPhase(this.LAST);
      }
    }
  }

  _updateLast() {
    if (this.phaseT > 45) this._setPhase(this.CRUMBLE);
  }

  _updateCrumble() {
    this.crumbleT++;
    const cl = this._clouds[this.currentCloud];
    for (const px of cl.pixels) {
      if (!px.alive) continue;
      if (this.crumbleT > px.delay) {
        px.fallVY += 0.85;
        px.fallY += px.fallVY;
        if (px.fallY > CANVAS_H + 20) px.alive = false;
      }
    }
    this.charY += 0.7;
    if (this.crumbleT > 22) this._setPhase(this.PAUSE);
  }

  _updatePause() {
    this.pauseT++;
    this.charY += 0.12;
    if (this.pauseT > 90) {
      this._setPhase(this.FALL);
      this.fallVY = 0;
    }
  }

  _updateFall() {
    this.fallVY += 1.1;
    this.charY += this.fallVY;
    // Sky stays clear while character falls — no darkening yet
    if (this.charY > CANVAS_H + 80) {
      this._setPhase(this.BLACKOUT);
      this.blackoutT = 0;
    }
  }

  _updateBlackout() {
    // ~1.5s pause (90 frames) before darkness slams in
    this.blackoutT++;
    if (this.blackoutT > 90) this.darkA = min(this.darkA + 20, 255);
    if (this.darkA >= 255) {
      this._setPhase(this.REVEAL);
      this.charX = width / 2;
      this.charY = -60;
      this.fallVY = 14; // very fast entry
    }
  }

  _updateReveal() {
    // Strong gravity — character plummets fast
    this.fallVY += 2.5;
    this.charY += this.fallVY;

    // Spotlight grows as they fall
    this.lightR = min(this.lightR + 3.5, 120);

    // Land exactly on the game ground line
    const groundLine = GROUND + 40;
    if (this.charY >= groundLine) {
      this.charY = groundLine;
      this.fallVY = 0;
      this.shake = 8; // hard landing shake
      this._setPhase(this.HOLD);
    }
  }

  _updateHold() {
    // Decay landing shake
    if (this.shake > 0) this.shake *= 0.85;
    // 3-4 seconds at 60fps = ~210 frames
    if (this.phaseT > 210) this._done = true;
  }

  _setPhase(p) {
    this.phase = p;
    this.phaseT = 0;
  }

  _buildScenery() {
    // Stalactites — stable between resets
    this._stalactites = [];
    for (let i = 0; i < 14; i++) {
      this._stalactites.push({
        x: 20 + i * 50 + floor(random(0, 10)),
        h: floor(random(20, 55)),
        w: floor(random(6, 16)),
      });
    }
    // Crystals — y values are negative offsets from bottom of screen
    this._crystalDefs = [
      { x: 40, yOff: 28, w: 8, h: 20, r: 212, g: 160, b: 200 },
      { x: 65, yOff: 20, w: 6, h: 14, r: 192, g: 136, b: 176 },
      { x: 160, yOff: 32, w: 10, h: 26, r: 136, g: 184, b: 224 },
      { x: 185, yOff: 22, w: 7, h: 16, r: 96, g: 144, b: 200 },
      { x: 200, yOff: 18, w: 5, h: 12, r: 96, g: 144, b: 200 },
      { x: 310, yOff: 28, w: 8, h: 22, r: 240, g: 176, b: 184 },
      { x: 330, yOff: 18, w: 6, h: 14, r: 232, g: 152, b: 152 },
      { x: 430, yOff: 24, w: 7, h: 18, r: 144, g: 216, b: 176 },
      { x: 450, yOff: 16, w: 5, h: 12, r: 120, g: 200, b: 152 },
      { x: 540, yOff: 30, w: 9, h: 22, r: 212, g: 160, b: 200 },
      { x: 600, yOff: 26, w: 8, h: 20, r: 136, g: 184, b: 224 },
      { x: 635, yOff: 18, w: 6, h: 14, r: 96, g: 144, b: 200 },
      { x: 672, yOff: 22, w: 7, h: 16, r: 144, g: 216, b: 176 },
    ];
    // Rocks
    this._rocks = [];
    for (let i = 0; i < 10; i++) {
      this._rocks.push({
        x: floor(random(0, 680)),
        yOff: floor(random(8, 22)),
        w: floor(random(20, 50)),
        h: floor(random(10, 20)),
      });
    }
  }

  _initCloudPixels(cl) {
    const cols = ceil(cl.w / 4);
    const rows = ceil(cl.h / 4);
    cl.pixels = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cl.pixels.push({
          c,
          r,
          alive: true,
          fallVY: 0,
          fallY: 0,
          delay: floor(random(0, 14)),
        });
      }
    }
  }

  _drawSkyBg() {
    background(100, 145, 200);
    noStroke();
    fill(180, 210, 240, 70);
    rect(0, height * 0.45, width, height * 0.55);
    fill(255, 255, 255, 45);
    rect(80, 50, 120, 18);
    rect(88, 42, 104, 8);
    rect(300, 35, 100, 16);
    rect(308, 27, 84, 8);
    rect(500, 55, 130, 20);
    rect(508, 47, 114, 8);
  }

  _drawCloud(cl) {
    const crumbling = cl.isFinal && this.phase === this.CRUMBLE;
    if (crumbling && cl.pixels) {
      noStroke();
      for (const px of cl.pixels) {
        if (!px.alive) continue;
        fill(px.r === 0 ? color(237, 234, 224) : color(208, 205, 184));
        rect(cl.x + px.c * 4, cl.y + px.r * 4 + px.fallY, 4, 4);
      }
    } else if (this.phase < this.CRUMBLE || !cl.isFinal) {
      noStroke();
      fill(208, 205, 184);
      rect(cl.x, cl.y + 4, cl.w, cl.h - 4);
      fill(237, 234, 224);
      rect(cl.x + 4, cl.y, cl.w - 8, 8);
      fill(176, 173, 156);
      rect(cl.x, cl.y + cl.h - 4, cl.w, 4);
    }
  }

  _drawCaveScene(caveLayers) {
    // Use the real game cave bg layers if available
    if (caveLayers && caveLayers.length > 0 && caveLayers[0]) {
      background(13, 11, 26);
      for (const img of caveLayers) {
        if (!img) continue;
        const imgW = img.width || width;
        image(img, 0, 0, imgW + 2, CANVAS_H);
      }
      return;
    }

    // Fallback: hand-drawn 8-bit cave matching the dark navy/purple screenshot
    noStroke();
    background(13, 11, 26);

    // Back-wall lighter opening
    fill(30, 26, 56);
    rect(180, 55, 340, 180);
    fill(42, 36, 72);
    rect(220, 75, 260, 140);

    // Left cave wall
    fill(20, 16, 42);
    rect(0, 0, 160, CANVAS_H);
    fill(26, 21, 48);
    rect(20, 35, 130, CANVAS_H - 35);

    // Right cave wall
    fill(20, 16, 42);
    rect(540, 0, 160, CANVAS_H);
    fill(26, 21, 48);
    rect(560, 20, 130, CANVAS_H - 20);

    // Stalactites
    for (const s of this._stalactites) {
      fill(26, 21, 48);
      rect(s.x - s.w / 2, 0, s.w, s.h);
      fill(13, 11, 26);
      rect(s.x - s.w / 2 + 4, 0, 4, s.h - 4);
      fill(37, 31, 62);
      rect(s.x - 2, s.h - 4, 4, 4);
    }

    // Ground
    fill(17, 15, 34);
    rect(0, CANVAS_H - 24, width, 24);
    fill(10, 9, 22);
    rect(0, CANVAS_H - 12, width, 12);

    // Ground rocks
    for (const r of this._rocks) {
      fill(30, 26, 56);
      rect(r.x, CANVAS_H - r.yOff, r.w, r.h);
      fill(42, 36, 72);
      rect(r.x + 4, CANVAS_H - r.yOff, r.w - 8, 4);
    }

    // Crystals
    for (const cr of this._crystalDefs) {
      fill(cr.r, cr.g, cr.b);
      rect(cr.x, CANVAS_H - cr.yOff, cr.w, cr.h);
      fill(255, 255, 255, 100);
      rect(cr.x + floor(cr.w / 2) - 2, CANVAS_H - cr.yOff, 2, 6);
      fill(0, 80);
      rect(cr.x, CANVAS_H - cr.yOff + cr.h - 4, cr.w, 4);
    }
  }

  _drawCharacter(x, y, isMoving) {
    const spriteW = 70;
    const spriteH = 70;
    const drawX = round(x) - spriteW / 2;
    const drawY = round(y) - spriteH;
    const img = isMoving ? imgRun : imgIdle;
    if (img) {
      noTint();
      image(img, drawX, drawY, spriteW, spriteH);
    }
  }

  _drawSpotlight(cx, cy, r) {
    noStroke();
    for (let ring = r; ring > 0; ring -= 5) {
      const frac = 1 - ring / r;
      fill(lerpColor(color(0, 0), color(160, 120, 60, 50), frac));
      ellipse(round(cx), round(cy), ring * 2, ring * 2);
    }
  }
}
