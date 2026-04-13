// ── Canvas ───────────────────────────────────
const CANVAS_W = 1280;
const CANVAS_H = 300;

// ── World heights ────────────────────────────
const GROUND = 230;
const PLATFORM_Y = 200;
const AIR_SPIKE_Y = 110;

// ── Intensity / boost constants ───────────────
const MAX_INTENSITY = 100;
const BOOST_DURATION = 200;
const MUSIC_FADE_TIME = 1.5; // seconds

// ── Asset variables ───────────────────────────
let allBgLayers = [[], [], []];
let layerOffsets = [];
let imgIdle;
let imgRun;
let imgBird;
let imgBat;
let imgBoost;
let imgCar;
let imgScaffolding;
let imgDoubleScaffolding;
let imgCloud;
let imgGarbage;
let imgPlane;
let raindrops = [];
let birds = [];
let bats = [];
let cars = [];
let planes = [];

// ── Game-state variables ─────────────────────
let state = "start";
let startScreen = "title";

let player;
let spikeManager;
let platformManager;
let hud;
let levelManager;
let cutscene;
let cutscene2;
let cutscene3;

let score = 0;
let levelScore = 0;
let intensity = 0;
let streak = 0;
let level2VisitCount = 0;
let carSpawnTimer = 0;

let boostActive = false;
let boostTimer = 0;

// ── Sound variables ───────────────────────────
let soundJump;
let soundDamage;
let soundBoost;
let bgMusicLevel1;
let bgMusicLevel2;
let bgMusicLevel3;
let currentMusic = null;

let hearts = 5;
let hitCooldown = 0;

let misses = 0;
let shakeActive = false;
let shakeSuccess = 0;

let levelClearTimer = 0;
let levelOneSecondPlatformSpikeSpawned = false;

// ── Narrative state variables ─────────────────
let narrativeTimer = 0;
let narrativeCharacterName = "Amaya";
let narrativeLines = [
  "Amaya skates through a new city alone,",
  "Blending into the crowd like she's practiced a thousand times.",
  "Running from something she can't quite name anymore...",
];
let lineDelay = 300;
let fadeDuration = 150;
let totalNarrativeTime;

let enterPromptAlpha = 255;

// ── p5 preload ────────────────────────────────
function preload() {
  levelManager = new LevelManager();

  for (let i = 0; i < levelManager.levels.length; i++) {
    allBgLayers[i] = levelManager.levels[i].bgLayers.map((l) =>
      loadImage(l.path),
    );
  }

  imgIdle = loadImage("assets/standing-skin.gif");
  imgRun = loadImage("assets/running-skin.gif");
  imgBoost = loadImage("assets/booster-skin.gif");
  imgBird = loadImage("assets/birdfly.png");
  imgBat = loadImage("assets/bat2.png");
  imgCar = loadImage("assets/car.png");
  imgScaffolding = loadImage("assets/scaffolding.png");
  imgDoubleScaffolding = loadImage("assets/double_scaffolding.png");
  imgCloud = loadImage("assets/Cloud_Tileset.png");
  imgGarbage = loadImage("assets/pile_garbage_big.png");
  imgPlane = loadImage("assets/plane-small.png");

  // Sound effects
  soundJump = loadSound("assets/jump.mp3");
  soundDamage = loadSound("assets/damage.mp3");
  soundBoost = loadSound("assets/boost.mp3");

  // Background music — declared at top, loaded here
  bgMusicLevel1 = loadSound("assets/level1_soundscape.mp3");
  bgMusicLevel2 = loadSound("assets/level2_soundscape.mp3");
  bgMusicLevel3 = loadSound("assets/level3_soundscape.mp3");
}

// ── p5 setup ─────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(60);

  player = new Player();
  spikeManager = new SpikeManager();
  platformManager = new PlatformManager();
  hud = new HUD();
  cutscene = new Cutscene();
  cutscene2 = new Cutscene2();
  cutscene3 = new Cutscene3();

  resetGame();
}

// ── Music helpers ─────────────────────────────
function stopAllMusic() {
  if (bgMusicLevel1 && bgMusicLevel1.isPlaying()) bgMusicLevel1.stop();
  if (bgMusicLevel2 && bgMusicLevel2.isPlaying()) bgMusicLevel2.stop();
  if (bgMusicLevel3 && bgMusicLevel3.isPlaying()) bgMusicLevel3.stop();
  currentMusic = null;
}

function fadeOutCurrentMusic(duration = MUSIC_FADE_TIME) {
  if (!currentMusic) return;
  if (currentMusic.isPlaying && currentMusic.isPlaying()) {
    currentMusic.setVolume(0, duration);
    const stopped = currentMusic;
    setTimeout(
      () => {
        if (stopped.isPlaying && stopped.isPlaying()) stopped.stop();
      },
      duration * 1000 + 100,
    );
  }
  currentMusic = null;
}

function playLevelMusic(levelIndex) {
  let target = bgMusicLevel1;
  if (levelIndex === 1) target = bgMusicLevel2;
  else if (levelIndex === 2) target = bgMusicLevel3;
  if (!target || currentMusic === target) return;
  fadeOutCurrentMusic();
  currentMusic = target;
  target.setVolume(0);
  target.loop();
  target.setVolume(1, MUSIC_FADE_TIME);
}

// ── Full game reset (back to level 1) ────────
function resetGame() {
  levelManager.reset();

  player.reset();
  spikeManager.reset();
  platformManager.reset();

  score = 0;
  levelScore = 0;
  intensity = 0;
  streak = 0;

  boostActive = false;
  boostTimer = 0;

  hearts = 5;
  hitCooldown = 0;

  misses = 0;
  shakeActive = false;
  shakeSuccess = 0;
  levelOneSecondPlatformSpikeSpawned = false;
  level2VisitCount = 0;
  carSpawnTimer = 0;

  layerOffsets = [0, 0, 0, 0, 0];
  raindrops = [];
  birds = [];
  bats = [];
  cars = [];
  planes = [];

  startScreen = "title";
  stopAllMusic();
}

// ── Start a fresh level (keeps score + hearts) ─
function startNextLevel() {
  player.reset();
  spikeManager.reset();
  platformManager.reset();

  if (levelManager.currentIndex === 1) level2VisitCount++;

  hearts = 5;
  levelScore = 0;
  intensity = 0;
  streak = 0;
  boostActive = false;
  boostTimer = 0;
  hitCooldown = 0;
  shakeActive = false;
  shakeSuccess = 0;
  levelOneSecondPlatformSpikeSpawned = false;
  misses = 0;
  carSpawnTimer = 0;

  layerOffsets = [0, 0, 0, 0, 0];
  raindrops = [];
  birds = [];
  bats = [];
  cars = [];
  planes = [];
}

// ── Main draw loop ────────────────────────────
function draw() {
  background(245);

  const lvl = levelManager.current;

  // ── Parallax background layers ────────────
  const layers = allBgLayers[levelManager.currentIndex];
  for (let i = 0; i < layers.length; i++) {
    const img = layers[i];
    const layerSpeed = lvl.bgLayers[i].speed;

    if (state === "play" || state === "narrative") {
      let baseSpeed;
      if (state === "play") {
        baseSpeed = map(intensity, 0, MAX_INTENSITY, 0.5, 2);
        if (shakeActive) baseSpeed *= 1.25;
      } else {
        baseSpeed = 1.5;
      }
      layerOffsets[i] -= baseSpeed * layerSpeed;
    }

    if (img) {
      let imgW = img.width;
      let x = layerOffsets[i] % imgW;
      if (x > 0) x -= imgW;
      for (let j = 0; j * imgW < width + imgW; j++) {
        image(img, x + j * imgW, 0, imgW + 2, CANVAS_H);
      }
    }
  }

  // ── Per-level bg tint ─────────────────────
  if (lvl.bgTint && state === "play") {
    noStroke();
    fill(...lvl.bgTint);
    rect(0, 0, width, height);
  }

  // ── Dark blue shake overlay ───────────────
  if (shakeActive) {
    noStroke();
    fill(10, 20, 80, 140);
    rect(0, 0, width, height);
  }

  updateAndDrawRain();

  // Ground line
  stroke(...lvl.groundStroke);
  line(0, GROUND + player.h, width, GROUND + player.h);
  noStroke();

  // ══════════════════════════════════════════
  //  NARRATIVE SCREEN
  // ══════════════════════════════════════════
  if (state === "narrative") {
    narrativeTimer++;

    player.update(0, MAX_INTENSITY, platformManager.platforms, lvl);
    platformManager.update(2.0, lvl);
    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    player.draw(false, imgRun);

    hud.draw(
      0,
      0,
      MAX_INTENSITY,
      hearts,
      0,
      false,
      false,
      0,
      lvl.dodgeGoal,
      levelManager.currentIndex + 1,
      levelManager.totalLevels,
    );

    drawNarrativeScreen();

    if (narrativeTimer > totalNarrativeTime) {
      player.x = 90;
      intensity = 0;
      playLevelMusic(0); // start level 1 music after narrative
      state = "play";
    }
    return;
  }

  // ══════════════════════════════════════════
  //  START SCREEN
  // ══════════════════════════════════════════
  if (state === "start") {
    enterPromptAlpha = 127 + 127 * sin(millis() * 0.002);

    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    player.draw(false, imgIdle);

    if (startScreen === "title") {
      fill(0, 0, 0, 200);
      rect(0, 0, width, height);

      textAlign(CENTER);
      fill(255, 220, 50);
      textSize(100);
      textStyle(BOLD);
      text("Between Floors", width / 2, height / 2 - 50);

      fill(255, 180, 80);
      textSize(16);
      textStyle(ITALIC);
      text(
        "Finding balance between control and chaos",
        width / 2,
        height / 2 - 5,
      );

      textStyle(NORMAL);
      fill(255);
      textSize(18);
      text("LEVELS", width / 2, height / 2 + 35);
      textSize(14);
      text("1. Fractured Skylines", width / 2, height / 2 + 53);
      text("2. Sky", width / 2, height / 2 + 68);
      text("3. Cave", width / 2, height / 2 + 83);

      stroke(255, 255, 255, 80);
      line(width / 2 - 120, height / 2 + 95, width / 2 + 120, height / 2 + 95);
      noStroke();

      fill(255, 180, 80, enterPromptAlpha);
      textSize(16);
      text("ENTER — Start Game", width / 2, height / 2 + 113);

      fill(180);
      textSize(13);
      text("I — Instructions", width / 2, height / 2 + 128);
    }

    if (startScreen === "instructions") {
      fill(0, 0, 0, 200);
      rect(0, 0, width, height);

      textAlign(CENTER);
      fill(255, 220, 50);
      textSize(22);
      textStyle(BOLD);
      text("HOW TO PLAY", width / 2, 52);
      textStyle(NORMAL);

      stroke(255, 255, 255, 60);
      line(width / 2 - 140, 62, width / 2 + 140, 62);
      noStroke();

      fill(160, 210, 255);
      textSize(13);
      text("CONTROLS", width / 2, 82);

      fill(255);
      textSize(13);
      text(
        "SPACE — Jump     |     R — Restart     |     DOUBLE SPACE — Double Jump",
        width / 2,
        100,
      );

      stroke(255, 255, 255, 40);
      line(width / 2 - 120, 112, width / 2 + 120, 112);
      noStroke();

      fill(160, 210, 255);
      textSize(13);
      text("RULES", width / 2, 130);

      fill(255);
      textSize(12);
      text("Dodge obstacles by jumping over them.", width / 2, 150);
      text("Dodge 20 obstacles to clear each level!", width / 2, 168);

      fill(255, 130, 130);
      text(
        "Each Level has unique obstacles (Cars, Planes, Spikes) and more!",
        width / 2,
        186,
      );

      fill(255);
      text(
        "Clear 5 obstacles in a row to activate a JUMP BOOST!",
        width / 2,
        204,
      );
      text(
        "If you hit an obstacle you enter SHAKE MODE! Clear 5 obstacles to recover.",
        width / 2,
        222,
      );
      text(
        "You have 5 hearts. Hit an obstacle and lose 1 heart. Reach 0 and it's game over.",
        width / 2,
        240,
      );

      fill(180);
      textSize(12);
      text("B — Back to Title     |     ENTER — Start Game", width / 2, 270);
    }

    return;
  }

  // ══════════════════════════════════════════
  //  LEVEL INTRO SCREEN
  // ══════════════════════════════════════════
  if (state === "levelintro") {
    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    player.draw(false, imgIdle);

    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textSize(44);
    textStyle(BOLD);
    text(
      "Level " + (levelManager.currentIndex + 1),
      width / 2,
      height / 2 - 40,
    );

    textSize(28);
    text(
      levelManager.current.name.replace(/^Level \d+\s*—\s*/, ""),
      width / 2,
      height / 2,
    );

    textStyle(NORMAL);
    fill(255);
    textSize(14);
    text(levelManager.current.message, width / 2, height / 2 + 30);

    fill(180);
    textSize(13);
    text("ENTER — Begin Level", width / 2, height / 2 + 70);

    return;
  }

  // ══════════════════════════════════════════
  //  CUTSCENE 3 — final resolution (after Level 3)
  // ══════════════════════════════════════════
  if (state === "cutscene3") {
    cutscene3.update();
    cutscene3.draw(allBgLayers[2]);
    if (cutscene3.isDone()) {
      state = "win";
    }
    return;
  }

  // ══════════════════════════════════════════
  //  CUTSCENE 2 — sky to cave (after Level 2)
  // ══════════════════════════════════════════
  if (state === "cutscene2") {
    cutscene2.update();
    cutscene2.draw(allBgLayers[2]);
    if (cutscene2.isDone()) {
      advanceLevel();
    }
    return;
  }

  // ══════════════════════════════════════════
  //  CUTSCENE 1 — manhole geyser (after Level 1)
  // ══════════════════════════════════════════
  if (state === "cutscene") {
    cutscene.update();
    cutscene.draw();
    if (cutscene.isDone()) {
      advanceLevel();
    }
    return;
  }

  // ══════════════════════════════════════════
  //  LEVEL CLEAR SCREEN
  // ══════════════════════════════════════════
  if (state === "levelclear") {
    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    player.draw(false, imgRun);

    fill(0, 0, 0, 170);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textStyle(BOLD);
    textSize(36);
    text("LEVEL CLEAR!", width / 2, height / 2 - 30);
    textStyle(NORMAL);

    fill(255);
    textSize(15);
    text(lvl.message, width / 2, height / 2 + 5);

    fill(180);
    textSize(13);
    text(
      "ENTER — Continue   |   R — Restart from Level 1",
      width / 2,
      height / 2 + 35,
    );

    levelClearTimer--;
    if (levelClearTimer <= 0) advanceLevel();

    return;
  }

  // ══════════════════════════════════════════
  //  WIN SCREEN
  // ══════════════════════════════════════════
  if (state === "win") {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textStyle(BOLD);
    textSize(42);
    text("YOU WIN!", width / 2, height / 2 - 30);
    textStyle(NORMAL);

    fill(255);
    textSize(16);
    text(
      "Total score: " + score + " obstacles dodged",
      width / 2,
      height / 2 + 10,
    );

    fill(180);
    textSize(13);
    text("R — Play Again", width / 2, height / 2 + 40);

    return;
  }

  // ══════════════════════════════════════════
  //  PLAY SCREEN
  // ══════════════════════════════════════════
  if (state === "play") {
    intensity = constrain(intensity + 0.04, 0, MAX_INTENSITY);

    if (boostActive) {
      boostTimer--;
      if (boostTimer <= 0) boostActive = false;
    }

    if (hitCooldown > 0) hitCooldown--;

    let gameSpeed =
      lvl.baseSpeed + map(intensity, 0, MAX_INTENSITY, 0, lvl.maxSpeedBonus);
    if (shakeActive) gameSpeed *= 1.25;

    player.update(intensity, MAX_INTENSITY, platformManager.platforms, lvl);

    // Spikes only in Level 3
    if (levelManager.currentIndex === 2) {
      spikeManager.update(gameSpeed, intensity, MAX_INTENSITY, lvl);
    } else {
      spikeManager.spikes = [];
    }

    platformManager.update(gameSpeed, lvl);

    // ── Car spawning (Level 1) ────────────────
    if (levelManager.currentIndex === 0) {
      carSpawnTimer--;
      if (carSpawnTimer <= 0) {
        const lastCar = cars.length > 0 ? cars[cars.length - 1] : null;
        if (!lastCar || lastCar.x < width - 180) {
          spawnCar();
          carSpawnTimer = floor(random(55, 85));
        }
      }
      updateAndDrawCars();
    }

    // ── Birds (level 2 only) ──────────────
    if (levelManager.currentIndex === 1) {
      if (frameCount % floor(random(180, 300)) === 0) {
        spawnBird();
      }
      updateAndDrawBirds();
    }

    // ── Birds and Planes (level 2 only) ──────────────
    if (levelManager.currentIndex === 1) {
      // Spawn birds
      if (frameCount % floor(random(180, 300)) === 0) {
        spawnBird();
      }

      // Spawn planes (Adjusted frequency for more planes)
      if (frameCount % floor(random(120, 300)) === 0) {
        spawnPlane();
      }

      updateAndDrawBirds();
      updateAndDrawPlanes();
    }

    // Bats (level 3 only)
    if (levelManager.currentIndex === 2) {
      // Spawns a bat roughly every 2-3 seconds
      if (frameCount % floor(random(120, 200)) === 0) {
        spawnBat();
      }
      updateAndDrawBats();
    }

    checkNearMiss();
    checkScore();
    checkCollision();
    checkGarbageCollision();

    if (levelManager.currentIndex === 1) {
      // Level 2 check
      if (frameCount % floor(random(180, 300)) === 0) {
        spawnBird();
      }
      updateAndDrawBirds();
    }

    // ── Level complete check ──────────────────
    if (levelScore >= lvl.dodgeGoal) {
      if (levelManager.currentIndex === 0) {
        cutscene.start();
        state = "cutscene";
      } else if (levelManager.currentIndex === 1) {
        cutscene2.start();
        state = "cutscene2";
      } else if (levelManager.currentIndex === 2) {
        cutscene3.start();
        state = "cutscene3";
      } else {
        state = "levelclear";
        levelClearTimer = 180;
      }
      return;
    }

    push();
    if (shakeActive) translate(random(-4, 4), random(-4, 4));

    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    if (levelManager.currentIndex === 2) {
      spikeManager.draw(intensity, MAX_INTENSITY);
    }

    // Flicker on hit cooldown
    if (hitCooldown > 0) {
      if (frameCount % 4 < 2) {
        player.draw(boostActive, boostActive ? imgBoost : imgRun);
      }
    } else {
      player.draw(boostActive, boostActive ? imgBoost : imgRun);
    }

    pop();

    drawSpotlight();

    player.draw(boostActive, boostActive ? imgBoost : imgRun);

    hud.draw(
      score,
      intensity,
      MAX_INTENSITY,
      hearts,
      streak,
      boostActive,
      shakeActive,
      levelScore,
      lvl.dodgeGoal,
      levelManager.currentIndex + 1,
      levelManager.totalLevels,
    );
  }

  // ══════════════════════════════════════════
  //  LOSE SCREEN
  // ══════════════════════════════════════════
  if (state === "lose") {
    platformManager.draw(
      lvl.platformColor,
      imgScaffolding,
      imgDoubleScaffolding,
      imgCloud,
      imgGarbage,
    );
    spikeManager.draw(intensity, MAX_INTENSITY);
    player.draw(false, imgRun);
    fill(0, 0, 0, 120);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255);
    textSize(28);
    text("GAME OVER", width / 2, height / 2 - 10);
    textSize(18);
    text(
      "Score: " + score + "   |   Press R to Retry Level",
      width / 2,
      height / 2 + 22,
    );
  }
}

// ── Advance to next level or trigger win ─────
function advanceLevel() {
  const advanced = levelManager.advance();
  if (advanced) {
    startNextLevel();
    playLevelMusic(levelManager.currentIndex); // switch music when level changes
    state = "levelintro";
  } else {
    state = "win";
  }
}

// ── Bat spawning ──────────────────────────────
function spawnBat() {
  bats.push({
    x: width + 50,
    y: random(30, 150),
    speed: random(5, 8),
    frame: 0,
    frameTimer: 0,
    frameRate: 6,
  });
}

function updateAndDrawBats() {
  for (let b of bats) {
    b.frameTimer++;
    if (b.frameTimer >= b.frameRate) {
      b.frame = (b.frame + 1) % 5;
      b.frameTimer = 0;
    }
    b.x -= b.speed;
    let wobble = sin(frameCount * 0.1) * 3;
    let sx = b.frame * 30;
    image(imgBat, b.x, b.y + wobble, 30, 30, sx, 0, 30, 30);

    const overlapX = player.x + player.w > b.x + 5 && player.x < b.x + 25;
    const overlapY = player.y + player.h > b.y + 5 && player.y < b.y + 25;
    if (overlapX && overlapY && hitCooldown <= 0) {
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        hitCooldown = 60;
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) state = "lose";
      } else if (!boostActive) {
        shakeActive = true;
        shakeSuccess = 0;
        hitCooldown = 60;
      }
    }
  }
  bats = bats.filter((b) => b.x > -50);
}

// ── Bird spawning ─────────────────────────────
function spawnBird() {
  birds.push({
    x: width + 50,
    y: random(50, 225),
    speed: random(4, 6),
    frame: 0,
    frameTimer: 0,
    frameRate: 6,
  });
}

function updateAndDrawBirds() {
  for (let b of birds) {
    b.frameTimer++;
    if (b.frameTimer >= b.frameRate) {
      b.frame = (b.frame + 1) % 6;
      b.frameTimer = 0;
    }
    b.x -= b.speed;
    let sx = b.frame * 32;
    push();
    translate(b.x + 32, b.y);
    scale(-1, 1);
    image(imgBird, 0, 0, 32, 32, sx, 0, 32, 32);
    pop();

    const overlapX = player.x + player.w > b.x + 4 && player.x < b.x + 28;
    const overlapY = player.y + player.h > b.y + 4 && player.y < b.y + 28;
    if (overlapX && overlapY && hitCooldown <= 0) {
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        hitCooldown = 60;
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) state = "lose";
      } else if (!boostActive) {
        shakeActive = true;
        shakeSuccess = 0;
        hitCooldown = 60;
      }
    }
  }
  birds = birds.filter((b) => b.x > -50);
}

// ── Car spawning (Level 1) ────────────────────
function spawnCar() {
  cars.push({
    x: width + 60,
    y: GROUND,
    w: 90,
    h: 36,
    speed: random(5, 8),
    scored: false,
  });
}

function updateAndDrawCars() {
  for (let c of cars) {
    c.x -= c.speed;
    if (imgCar) {
      image(imgCar, c.x, c.y, c.w, c.h);
    } else {
      fill(40, 80, 180);
      rect(c.x, c.y, c.w, c.h, 6);
    }

    const overlapX = player.x + player.w > c.x + 8 && player.x < c.x + c.w - 8;
    const overlapY = player.y + player.h > c.y + 6 && player.y < c.y + c.h - 4;
    if (overlapX && overlapY && hitCooldown <= 0) {
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        hitCooldown = 60;
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) state = "lose";
      } else if (!boostActive) {
        shakeActive = true;
        shakeSuccess = 0;
        hitCooldown = 60;
      }
    }

    if (!c.scored && c.x + c.w < player.x) {
      c.scored = true;
      score++;
      levelScore++;
      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }
      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          streak = 0;
          if (soundBoost) soundBoost.play();
        }
      }
    }
  }
  cars = cars.filter((c) => c.x + c.w > 0);
}

// ── Plane spawning (Level 2) ──────────────────
function spawnPlane() {
  planes.push({
    x: width + 100,
    y: random(-20, 80),
    speed: random(7, 10),
    w: 160,
    h: 160,
    scored: false,
  });
}

function updateAndDrawPlanes() {
  for (let p of planes) {
    p.x -= p.speed;
    image(imgPlane, p.x, p.y, p.w, p.h);

    const overlapX =
      player.x + player.w > p.x + 40 && player.x < p.x + p.w - 40;
    const overlapY =
      player.y + player.h > p.y + 40 && player.y < p.y + p.h - 40;
    if (overlapX && overlapY && hitCooldown <= 0) {
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        hitCooldown = 60;
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) state = "lose";
      } else if (!boostActive) {
        shakeActive = true;
        shakeSuccess = 0;
        hitCooldown = 60;
      }
    }

    if (!p.scored && p.x + p.w < player.x) {
      p.scored = true;
      score++;
      levelScore++;
      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }
      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          streak = 0;
          if (soundBoost) soundBoost.play();
        }
      }
    }
  }
  planes = planes.filter((p) => p.x + p.w > -100);
}

// ── Rain effect ───────────────────────────────
function updateAndDrawRain() {
  if (!shakeActive) {
    raindrops = [];
    return;
  }
  for (let i = 0; i < 5; i++) {
    raindrops.push({
      x: random(width),
      y: random(-20, 0),
      speed: random(8, 14),
      len: random(10, 20),
      alpha: random(100, 200),
    });
  }
  for (let d of raindrops) {
    d.y += d.speed;
    d.x -= 1.5;
    stroke(150, 180, 255, d.alpha);
    strokeWeight(1);
    line(d.x, d.y, d.x + 2, d.y + d.len);
  }
  raindrops = raindrops.filter((d) => d.y < height);
}

// ── Narrative helpers ─────────────────────────
function resetNarrative() {
  narrativeTimer = 0;
  totalNarrativeTime =
    (narrativeLines.length - 1) * lineDelay + fadeDuration * 2;
  layerOffsets = [0, 0, 0, 0, 0];
}

function getFadeAlpha(timer, startFrame, duration) {
  let elapsed = timer - startFrame;
  if (elapsed < 0) return 0;
  if (elapsed < duration) return map(elapsed, 0, duration, 0, 255);
  if (elapsed < duration * 2)
    return map(elapsed, duration, duration * 2, 255, 0);
  return 0;
}

function drawNarrativeScreen() {
  textAlign(CENTER, CENTER);
  fill(255, 220, 155);
  textSize(32);
  textStyle(BOLD);
  text(narrativeCharacterName, width / 2, 60);

  textSize(18);
  textStyle(NORMAL);
  for (let i = 0; i < narrativeLines.length; i++) {
    let startFrame = i * lineDelay;
    let alpha = getFadeAlpha(narrativeTimer, startFrame, fadeDuration);
    fill(255, alpha);
    text(narrativeLines[i], width / 2, 120 + i * 30);
  }
}

// ── Collision: spikes ─────────────────────────
function checkCollision() {
  if (hitCooldown > 0) return;
  for (const s of spikeManager.spikes) {
    const overlapX = player.x + player.w > s.x + 4 && player.x < s.x + s.w - 4;
    if (!overlapX) continue;
    let hit = false;
    if (s.type === "ground") {
      if (player.y + player.h > s.y + 8) hit = true;
    } else {
      const spikeBase = s.y + s.h;
      if (player.y < spikeBase - 8 && player.y + player.h > s.y) hit = true;
    }
    if (hit) {
      hitCooldown = 15;
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) {
          state = "lose";
          return;
        }
      } else {
        shakeActive = true;
        shakeSuccess = 0;
        boostActive = false;
        boostTimer = 0;
      }
      streak = 0;
      return;
    }
  }
}

function drawSpotlight() {
  if (levelManager.currentIndex !== 2) return;
  if (state !== "play") return;

  const cx = player.x + 35;
  const cy = player.y + 15;
  const radius = 120;

  const ctx = drawingContext;

  push();
  noStroke();

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.96)";
  ctx.beginPath();

  // whole screen
  ctx.rect(0, 0, width, height);

  // cut-out circle
  ctx.moveTo(cx + radius, cy);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);

  // fill only outside the circle
  ctx.fill("evenodd");
  ctx.restore();

  pop();
}

// ── Collision: garbage on platforms ───────────
function checkGarbageCollision() {
  if (hitCooldown > 0) return;
  if (levelManager.currentIndex !== 0) return;
  for (const p of platformManager.platforms) {
    if (!p.hasGarbage) continue;
    const gx = p.x + p.garbageOffsetX;
    const gy = p.y - 32;
    const gw = p.garbageW || 46;
    const gh = p.garbageH || 46;
    const overlapX = player.x + player.w > gx + 6 && player.x < gx + gw - 6;
    const overlapY = player.y + player.h > gy + 6 && player.y < gy + gh - 6;
    if (overlapX && overlapY) {
      if (shakeActive) {
        hearts = max(0, hearts - 1);
        hitCooldown = 60;
        if (soundDamage) soundDamage.play();
        if (hearts <= 0) {
          state = "lose";
        }
      } else if (!boostActive) {
        shakeActive = true;
        shakeSuccess = 0;
        hitCooldown = 60;
      }
      streak = 0;
      return;
    }
  }
}

// ── Scoring: spikes ───────────────────────────
function checkScore() {
  for (const s of spikeManager.spikes) {
    if (!s.scored && s.x + s.w < player.x) {
      score++;
      levelScore++;
      s.scored = true;
      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }
      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          streak = 0;
          if (soundBoost) soundBoost.play();
        }
      }
    }
  }
}

// ── Near-miss ─────────────────────────────────
function checkNearMiss() {
  for (const s of spikeManager.spikes) {
    if (s.type !== "ground") continue;
    const closeX = s.x < player.x + player.w + 10 && s.x + s.w > player.x - 10;
    const closeY = abs(player.y + player.h - s.y) < 10;
    if (closeX && closeY && !s.nearMiss) {
      intensity = constrain(intensity + 10, 0, MAX_INTENSITY);
      s.nearMiss = true;
    }
  }
}

// ── Key input ─────────────────────────────────
function keyPressed() {
  if (state === "start") {
    if (keyCode === ENTER) {
      // userStartAudio() unlocks Web Audio after a user gesture — required by browsers
      userStartAudio();
      startScreen = "title";
      resetNarrative();
      state = "narrative";
    }
    if (key === "i" || key === "I") startScreen = "instructions";
    if ((key === "b" || key === "B") && startScreen === "instructions") {
      startScreen = "title";
    }
  }

  if (state === "levelintro" && keyCode === ENTER) {
    state = "play";
  }

  if (state === "cutscene" && keyCode === ENTER) cutscene.skip();
  if (state === "cutscene2" && keyCode === ENTER) cutscene2.skip();
  if (state === "cutscene3" && keyCode === ENTER) cutscene3.skip();

  if (state === "levelclear" && keyCode === ENTER) advanceLevel();

  if (state === "play" && key === " ") {
    player.jump(boostActive);
    if (soundJump) soundJump.play();
  }

  if (
    (state === "lose" ||
      state === "play" ||
      state === "win" ||
      state === "levelclear") &&
    (key === "r" || key === "R")
  ) {
    if (state === "win") {
      resetGame();
      state = "play";
    } else {
      startNextLevel();
      playLevelMusic(levelManager.currentIndex);
      state = "play";
    }
  }
}
