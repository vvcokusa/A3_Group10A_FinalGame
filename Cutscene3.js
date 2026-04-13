/*
  Cutscene3.js
  ─────────────────────────────────────────────
  Final resolution cutscene after Level 3 clears,
  before the win screen.

  Flow:
    ENTER      — Amaya skates in from the left
    ECHO_ENTER — Echo slides in from the right
    DIALOGUE   — Characters face each other and converse
    MERGE      — Echo glides toward Amaya and fades out
    FLASH      — Bright white flash fills the screen
    GOLDEN     — Flash fades; Amaya is now in golden skin
    HOLD       — Hold on the golden Amaya before done

  ── CHANGING THE DIALOGUE ─────────────────────
  Find the `this._lines` array in reset() and edit
  the `text` values. Each entry has:
    speaker — "Amaya" or "Echo"
    text    — the dialogue line (keep it short enough to fit the screen)
  You can add or remove lines freely — the cutscene
  will automatically loop through all of them.

  HOW TO INTEGRATE:
  ─────────────────────────────────────────────
  1. index.html — add BEFORE sketch (2).js:
       <script src="Cutscene3.js"></script>

  2. sketch (2).js globals — add:
       let cutscene3;

  3. setup() — add after cutscene2 = new Cutscene2():
       cutscene3 = new Cutscene3();

  4. In the PLAY state level-complete check, add:
       } else if (levelManager.currentIndex === 2) {
         cutscene3.start();
         state = "cutscene3";
       }

  5. In draw(), add BEFORE the "cutscene2" block:
       if (state === "cutscene3") {
         cutscene3.update();
         cutscene3.draw(allBgLayers[2]);
         if (cutscene3.isDone()) {
           state = "win";
         }
         return;
       }

  6. keyPressed() — add:
       if (state === "cutscene3" && keyCode === ENTER) {
         cutscene3.skip();
       }
*/

class Cutscene3 {
  constructor() {
    // ── Phase constants ──────────────────────
    this.ENTER      = 0;
    this.ECHO_ENTER = 1;
    this.DIALOGUE   = 2;
    this.MERGE      = 3;
    this.FLASH      = 4;
    this.GOLDEN     = 5;
    this.HOLD       = 6;

    this._done = false;

    // Build cave scenery once — stable across resets
    this._stalactites = [];
    this._crystalDefs = [];
    this._rocks       = [];
    this._buildScenery();

    this.reset();
  }

  // ── Public API ──────────────────────────────

  start()  { this.reset(); this._done = false; }
  skip()   { this._done = true; }
  isDone() { return this._done; }

  reset() {
    this.phase   = this.ENTER;
    this.phaseT  = 0;
    this.t       = 0;

    // ── Character positions ──────────────────
    // Amaya enters from off-screen left, stops at ~28% across
    this.amayaX        = -80;
    this.amayaTargetX  = width * 0.28;

    // Echo enters from off-screen right, stops at ~72% across
    this.echoX         = width + 80;
    this.echoTargetX   = width * 0.72;

    // Ground line — feet sit here
    this._groundLine = GROUND + 40;

    // ── Dialogue state ───────────────────────
    // ── EDIT THESE LINES TO CHANGE THE SCRIPT ──────────────────────────────
    // Each object: { speaker: "Amaya" | "Echo", text: "dialogue line" }
    // Keep lines short so they fit on screen without wrapping.
    this._lines = [
      { speaker: "Amaya", text: "I keep running. I don't even know what from anymore." },
      { speaker: "Echo",  text: "From me. From everything you buried."                 },
      { speaker: "Amaya", text: "You're not real."                                     },
      { speaker: "Echo",  text: "I'm the part of you that remembers."                  },
      { speaker: "Amaya", text: "...I'm tired of being afraid."                        },
      { speaker: "Echo",  text: "Then stop running."                                   },
      { speaker: "Amaya", text: "...okay."                                             },
    ];
    // ── END OF EDITABLE DIALOGUE ────────────────────────────────────────────

    this._lineIndex      = 0;
    this._lineTimer      = 0;
    this._lineDuration   = 180; // frames per line (~3 seconds at 60fps)
    this._fadeDuration   = 50;  // fade in + fade out within each line

    // ── Visual effects ───────────────────────
    this.flashA  = 0;   // white flash alpha 0-255
    this._done   = false;
  }

  // ── Called every frame ───────────────────────

  update() {
    this.t++;
    this.phaseT++;

    switch (this.phase) {
      case this.ENTER:      this._updateEnter();     break;
      case this.ECHO_ENTER: this._updateEchoEnter(); break;
      case this.DIALOGUE:   this._updateDialogue();  break;
      case this.MERGE:      this._updateMerge();     break;
      case this.FLASH:      this._updateFlash();     break;
      case this.GOLDEN:     this._updateGolden();    break;
      case this.HOLD:       this._updateHold();      break;
    }
  }

  // caveLayers = allBgLayers[2] passed from sketch (2).js
  draw(caveLayers) {
    push();

    // ── Cave background ──────────────────────
    this._drawCaveBg(caveLayers);

    // Subtle dark overlay so text is readable
    noStroke();
    fill(0, 120);
    rect(0, 0, width, height);

    // Ground line (cave floor tint)
    stroke(180, 50, 220, 80);
    line(0, this._groundLine, width, this._groundLine);
    noStroke();

    // ── Echo (draw behind Amaya) ─────────────
    if (this.phase < this.FLASH) {
      const echoAlpha = this.phase === this.MERGE
        ? constrain(map(abs(this.echoX - this.amayaX), 0, 150, 0, 255), 0, 255)
        : 255;
      this._drawEcho(this.echoX, echoAlpha);
    }

    // ── Amaya ────────────────────────────────
    if (this.phase !== this.FLASH) {
      const isGolden = this.phase === this.GOLDEN || this.phase === this.HOLD;
      const isMoving = this.phase === this.ENTER;
      this._drawAmaya(this.amayaX, isGolden, isMoving);
    }

    // ── Dialogue ────────────────────────────
    if (this.phase === this.DIALOGUE) {
      this._drawDialogue();
    }

    // ── White flash ──────────────────────────
    if (this.flashA > 0) {
      noStroke();
      fill(255, this.flashA);
      rect(0, 0, width, height);
    }

    // ── Skip hint ────────────────────────────
    noStroke();
    fill(255, 150);
    textAlign(RIGHT);
    textSize(11);
    text("ENTER — skip", width - 10, height - 8);
    textAlign(LEFT);

    pop();
  }

  // ── Phase updaters ───────────────────────────

  _updateEnter() {
    // Ease Amaya in from the left
    this.amayaX += (this.amayaTargetX - this.amayaX) * 0.08;
    if (abs(this.amayaTargetX - this.amayaX) < 1) {
      this.amayaX = this.amayaTargetX;
      this._setPhase(this.ECHO_ENTER);
    }
  }

  _updateEchoEnter() {
    // Ease Echo in from the right
    this.echoX += (this.echoTargetX - this.echoX) * 0.08;
    if (abs(this.echoTargetX - this.echoX) < 1) {
      this.echoX = this.echoTargetX;
      this._setPhase(this.DIALOGUE);
    }
  }

  _updateDialogue() {
    this._lineTimer++;
    if (this._lineTimer >= this._lineDuration) {
      this._lineTimer = 0;
      this._lineIndex++;
      if (this._lineIndex >= this._lines.length) {
        this._setPhase(this.MERGE);
      }
    }
  }

  _updateMerge() {
    // Echo glides toward Amaya
    this.echoX += (this.amayaX - this.echoX) * 0.04;
    if (abs(this.echoX - this.amayaX) < 6) {
      this._setPhase(this.FLASH);
    }
  }

  _updateFlash() {
    this.flashA = min(this.flashA + 12, 255);
    if (this.phaseT > 30) {
      this._setPhase(this.GOLDEN);
    }
  }

  _updateGolden() {
    // Flash fades out to reveal golden Amaya
    this.flashA = max(this.flashA - 8, 0);
    if (this.phaseT > 150) {
      this._setPhase(this.HOLD);
    }
  }

  _updateHold() {
    // Hold ~2 seconds then signal done
    if (this.phaseT > 120) {
      this._done = true;
    }
  }

  _setPhase(p) {
    this.phase  = p;
    this.phaseT = 0;
  }

  // ── Draw helpers ─────────────────────────────

  // Draw Amaya using the game sprite assets.
  // golden=true uses imgBoost (gold skin), isMoving uses imgRun.
  _drawAmaya(x, golden, isMoving) {
    const spriteW = 70;
    const spriteH = 70;
    const drawX   = round(x) - spriteW / 2;
    const drawY   = round(this._groundLine) - spriteH;

    let img;
    if (golden)       img = imgBoost;
    else if (isMoving) img = imgRun;
    else               img = imgIdle;

    if (img) {
      noTint();
      image(img, drawX, drawY, spriteW, spriteH);
    }
  }

  // Draw Echo as a dark purple silhouette tint of imgIdle.
  _drawEcho(x, alpha) {
    const spriteW = 70;
    const spriteH = 70;
    const drawX   = round(x) - spriteW / 2;
    const drawY   = round(this._groundLine) - spriteH;

    if (imgIdle) {
      // Dark purple tint to create the shadow/mirror look
      tint(80, 40, 160, alpha);
      image(imgIdle, drawX, drawY, spriteW, spriteH);
      noTint();
    }

    // Purple glow outline around Echo
    if (alpha > 0) {
      noFill();
      stroke(160, 100, 255, alpha * 0.5);
      strokeWeight(2);
      rect(drawX - 2, drawY - 2, spriteW + 4, spriteH + 4, 4);
      noStroke();
    }
  }

  // Draw the current dialogue line with speaker name
  _drawDialogue() {
    if (this._lineIndex >= this._lines.length) return;
    const line = this._lines[this._lineIndex];

    // Compute fade alpha within the line duration
    const elapsed = this._lineTimer;
    let a;
    if (elapsed < this._fadeDuration) {
      a = map(elapsed, 0, this._fadeDuration, 0, 1);
    } else if (elapsed > this._lineDuration - this._fadeDuration) {
      a = map(elapsed, this._lineDuration - this._fadeDuration, this._lineDuration, 1, 0);
    } else {
      a = 1;
    }
    if (a <= 0) return;

    const isAmaya   = line.speaker === "Amaya";
    const speakerX  = isAmaya ? this.amayaX : this.echoX;
    const speakerCol = isAmaya ? color(240, 168, 64) : color(144, 112, 208);

    // Measure text width to size the pill
    textSize(13);
    const textW = max(textWidth(line.text), textWidth(line.speaker)) + 24;
    const boxX  = constrain(speakerX - textW / 2, 10, width - textW - 10);
    const boxY  = this._groundLine - 95;
    const boxH  = 44;

    // Dark pill background
    noStroke();
    fill(0, 0, 0, a * 180);
    rect(boxX, boxY, textW, boxH, 6);

    // Speaker name
    fill(red(speakerCol), green(speakerCol), blue(speakerCol), a * 255);
    textSize(12);
    textStyle(BOLD);
    textAlign(LEFT);
    text(line.speaker, boxX + 10, boxY + 16);

    // Dialogue line
    fill(255, 255, 255, a * 255);
    textSize(13);
    textStyle(NORMAL);
    text(line.text, boxX + 10, boxY + 34);

    // Reset text style
    textStyle(NORMAL);
  }

  // Draw cave background — use real game layers if available,
  // otherwise fall back to the hand-drawn version.
  _drawCaveBg(caveLayers) {
    if (caveLayers && caveLayers.length > 0 && caveLayers[0]) {
      background(13, 11, 26);
      for (const img of caveLayers) {
        if (!img) continue;
        const imgW = img.width || width;
        image(img, 0, 0, imgW + 2, CANVAS_H);
      }
      return;
    }

    // Fallback hand-drawn cave
    noStroke();
    background(13, 11, 26);
    fill(30, 26, 56);  rect(180, 55, 340, 180);
    fill(42, 36, 72);  rect(220, 75, 260, 140);
    fill(20, 16, 42);  rect(0, 0, 160, CANVAS_H);
    fill(26, 21, 48);  rect(20, 35, 130, CANVAS_H - 35);
    fill(20, 16, 42);  rect(540, 0, 160, CANVAS_H);
    fill(26, 21, 48);  rect(560, 20, 130, CANVAS_H - 20);

    for (const s of this._stalactites) {
      fill(26, 21, 48); rect(s.x - s.w / 2, 0, s.w, s.h);
      fill(13, 11, 26); rect(s.x - s.w / 2 + 4, 0, 4, s.h - 4);
      fill(37, 31, 62); rect(s.x - 2, s.h - 4, 4, 4);
    }

    fill(17, 15, 34); rect(0, CANVAS_H - 24, width, 24);
    fill(10, 9, 22);  rect(0, CANVAS_H - 12, width, 12);

    for (const r of this._rocks) {
      fill(30, 26, 56); rect(r.x, CANVAS_H - r.yOff, r.w, r.h);
      fill(42, 36, 72); rect(r.x + 4, CANVAS_H - r.yOff, r.w - 8, 4);
    }

    for (const cr of this._crystalDefs) {
      fill(cr.r, cr.g, cr.b);
      rect(cr.x, CANVAS_H - cr.yOff, cr.w, cr.h);
      fill(255, 255, 255, 100);
      rect(cr.x + floor(cr.w / 2) - 2, CANVAS_H - cr.yOff, 2, 6);
      fill(0, 80);
      rect(cr.x, CANVAS_H - cr.yOff + cr.h - 4, cr.w, 4);
    }
  }

  _buildScenery() {
    this._stalactites = [];
    for (let i = 0; i < 14; i++) {
      this._stalactites.push({
        x: 20 + i * 50 + floor(random(0, 10)),
        h: floor(random(20, 55)),
        w: floor(random(6, 16)),
      });
    }

    this._crystalDefs = [
      { x: 40,  yOff: 28, w: 8,  h: 20, r: 212, g: 160, b: 200 },
      { x: 65,  yOff: 20, w: 6,  h: 14, r: 192, g: 136, b: 176 },
      { x: 160, yOff: 32, w: 10, h: 26, r: 136, g: 184, b: 224 },
      { x: 310, yOff: 28, w: 8,  h: 22, r: 240, g: 176, b: 184 },
      { x: 430, yOff: 24, w: 7,  h: 18, r: 144, g: 216, b: 176 },
      { x: 540, yOff: 30, w: 9,  h: 22, r: 212, g: 160, b: 200 },
      { x: 600, yOff: 26, w: 8,  h: 20, r: 136, g: 184, b: 224 },
      { x: 672, yOff: 22, w: 7,  h: 16, r: 144, g: 216, b: 176 },
    ];

    this._rocks = [];
    for (let i = 0; i < 10; i++) {
      this._rocks.push({
        x:    floor(random(0, 680)),
        yOff: floor(random(8, 22)),
        w:    floor(random(20, 50)),
        h:    floor(random(10, 20)),
      });
    }
  }
}
