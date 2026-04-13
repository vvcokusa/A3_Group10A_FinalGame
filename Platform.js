/*
  Platform.js
  ─────────────────────────────────────────────
  A single scrolling platform.

  draw() accepts an optional colOverride array
  [r, g, b] from the level config so platform
  colour changes per level. Falls back to the
  original pink if nothing is passed.
*/
/*class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.standTimer = 0;
    this.alpha = 255;
    this.isFading = false;
    this.fadeTimer = 0;
    this.toRemove = false;
    this.color = [222, 153, 182]; // default pink
    this.isWarm = true; // default is warm
  }

  update() {
    // Only fade if not the default pink color (level 1), but now we have isFading flag
    if (this.isFading && this.standTimer > 0) {
      this.toRemove = true;
    }
  }

  // colOverride — optional [r,g,b] from PlatformManager / level config
  draw(colOverride) {
    if (colOverride) {
      this.color = colOverride;
      this.isWarm = this.color[0] > this.color[1] && this.color[0] > this.color[2];
      // Disable fading for level 1 (pink color)
      if (colOverride[0] === 222 && colOverride[1] === 153 && colOverride[2] === 182) {
        this.isFading = false;
      }
    }
    const [r, g, b] = this.color;
    fill(r, g, b, this.alpha);
    noStroke();
    rect(this.x, this.y, this.w, this.h, 4);

    // Subtle top highlight
    fill(
      min(r + 30, 255),
      min(g + 30, 255),
      min(b + 30, 255),
      this.alpha
    );
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }
}
*/

class Platform {
  constructor(x, y, w, h, behavior = null, spriteMode = "rect") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.age = 0;
    this.alpha = 255;
    this.dissolveTimer = null;
    this.dissolveDuration = null;
    this.behavior = behavior || "fade_respawn";
    this.spriteMode = spriteMode;
  }

  // colOverride — optional [r,g,b] array from PlatformManager / level config
  draw(colOverride, imgScaffold, imgDoubleScaffold, imgCloud, imgGarbage) {
  console.log(
    "DRAW TEST",
    this.spriteMode,
    !!imgScaffold,
    !!imgDoubleScaffold,
    !!imgCloud,
    !!imgGarbage
  );

  const [r, g, b] = colOverride || [222, 153, 182];
  const alpha =
    this.dissolveTimer != null
      ? map(this.dissolveTimer, 0, this.dissolveDuration, 0, 255)
      : this.alpha;

  push();
  tint(255, alpha);

  if (this.spriteMode === "scaffolding" && imgScaffold) {
  image(imgScaffold, this.x, this.y + 10, this.w, 80);

  if (this.hasGarbage && imgGarbage) {
    image(
      imgGarbage,
      this.x + this.garbageOffsetX,
      this.y - 24,
      56,
      56
    );
  }
} else if (
  this.spriteMode === "double_scaffolding" &&
  imgDoubleScaffold
) {
  image(imgDoubleScaffold, this.x, this.y - 50, this.w, 140);
} else if (
  (this.spriteMode === "cloud" || this.spriteMode === "cloud_floor") &&
  imgCloud
) {
  const SRC_X = 0;
  const SRC_Y = 49;
  const SRC_W = 80;
  const SRC_H = 79;
  const VISUAL_H = 20;

  let drawn = 0;
  while (drawn < this.w) {
    const pieceW = min(SRC_W, this.w - drawn);
    image(
      imgCloud,
      this.x + drawn,
      this.y,
      pieceW,
      VISUAL_H,
      SRC_X,
      SRC_Y,
      SRC_W,
      SRC_H
    );
    drawn += pieceW;
  }
} else {
    noStroke();
    fill(r, g, b, alpha);
    rect(this.x, this.y, this.w, this.h, 4);

    fill(min(r + 30, 255), min(g + 30, 255), min(b + 30, 255), alpha);
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }

  pop();
}
}
