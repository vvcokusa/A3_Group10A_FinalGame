/*
  HUD.js
  ─────────────────────────────────────────────
  Draws all on-screen UI:
    • Score counter
    • Heart display
    • Mania Meter (replaces streak counter)
    • Level name + progress bar (spikes toward goal)
    • Centered flashing BOOST ACTIVE! banner
 
  Call HUD.draw() once per frame AFTER cam.end()
  so it renders on top of the world in screen space.
*/

class HUD {
  draw(
    score,
    intensity,
    maxIntensity,
    hearts,
    streak,
    boostActive,
    shakeActive,
    levelScore,
    dodgeGoal,
    currentLevel,
    totalLevels,
  ) {
    // ── UI Setup ─────────────────────────────
    rectMode(CORNER);
    noStroke();

    // ── Top Left Panel (Score & Hearts) ──────
    // Subtle "Glass" background
    fill(0, 0, 0, 60);
    rect(5, 5, 180, 75, 8);

    // Score
    fill(255);
    textAlign(LEFT);
    textSize(14);
    textStyle(BOLD);
    text("SCORE: " + score, 15, 25);

    // Hearts (Pixelated)
    for (let i = 0; i < 5; i++) {
      let x = 15 + i * 32;
      let y = 38;
      let isFull = i < hearts;
      this.drawPixelHeart(x, y, isFull);
    }

    // ── Mania Meter (Streak) ──────────────────
    const meterX = 15;
    const meterY = 62;
    const meterW = 160;
    const meterH = 10;

    // Track
    fill(40, 40, 40, 180);
    rect(meterX, meterY, meterW, meterH, 4);

    if (shakeActive) {
      // DANGER MODE
      const pulse = 0.5 + 0.5 * sin(frameCount * 0.2);
      fill(255 * pulse, 50, 50);
      rect(meterX, meterY, meterW, meterH, 4);
    } else if (boostActive) {
      // BOOST MODE
      fill(255, 215, 0);
      rect(meterX, meterY, meterW, meterH, 4);
    } else {
      // NORMAL MODE
      const fillW = map(streak, 0, 5, 0, meterW);
      fill(0, 255, 150);
      if (fillW > 0) rect(meterX, meterY, fillW, meterH, 4);
    }

    /*// ── Top Right Panel (Level Progress) ──────
    fill(0, 0, 0, 60);
    rect(width - 175, 5, 170, 60, 8);

    textAlign(RIGHT);
    fill(255);
    textSize(12);
    text("LEVEL " + currentLevel + " / " + totalLevels, width - 15, 22);*/

    /*// Progress Bar
    const barW = 150;
    const barH = 8;
    const barX = width - barW - 15;
    const barY = 30;

    fill(40, 40, 40, 180);
    rect(barX, barY, barW, barH, 4);

    const progress = constrain(levelScore / dodgeGoal, 0, 1);
    fill(100, 255, 100);
    rect(barX, barY, barW * progress, barH, 4);

    fill(200);
    textSize(10);
    text(levelScore + " / " + dodgeGoal + "Objects", width - 15, 52);

    // ── Centered Boost Banner ────────────────
    if (boostActive) {
      this.drawBoostBanner();
    }*/

    // Reset styles for rest of game
    textStyle(NORMAL);
    textAlign(LEFT);
  }

  // Helper to draw a pixel-art heart manually
  drawPixelHeart(x, y, full) {
    push();
    translate(x, y);
    let pSize = 3; // Size of each "pixel" square

    if (full) {
      fill(255, 50, 80); // Bright Red
    } else {
      fill(60, 60, 60, 150); // Ghostly Grey
    }

    noStroke();
    // Simple pixel heart coordinates (relative to x,y)
    // Top bumps
    rect(pSize, 0, pSize, pSize);
    rect(pSize * 2, 0, pSize, pSize);
    rect(pSize * 4, 0, pSize, pSize);
    rect(pSize * 5, 0, pSize, pSize);
    // Middle row
    rect(0, pSize, pSize * 7, pSize);
    // Lower rows tapering down
    rect(0, pSize * 2, pSize * 7, pSize);
    rect(pSize, pSize * 3, pSize * 5, pSize);
    rect(pSize * 2, pSize * 4, pSize * 3, pSize);
    rect(pSize * 3, pSize * 5, pSize, pSize);
    pop();
  }

  drawBoostBanner() {
    push();
    const flash = 180 + 75 * sin(frameCount * 0.15);
    const bannerX = width / 2;
    const bannerY = height / 2 - 40;

    rectMode(CENTER);
    // Main dark pill
    fill(0, 0, 0, 150);
    rect(bannerX, bannerY, 280, 50, 10);

    // Golden border
    stroke(255, 215, 0, flash);
    strokeWeight(3);
    noFill();
    rect(bannerX, bannerY, 280, 50, 10);

    // Text
    noStroke();
    textAlign(CENTER, CENTER);
    fill(255, 215, 0, flash);
    textSize(32);
    textStyle(BOLD);
    text("BOOST ACTIVE!", bannerX, bannerY);
    pop();
  }
}
