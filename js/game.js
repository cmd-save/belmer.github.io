/* ----------------------------------------------------------------------------
   Perfect Stack — vanilla JS canvas game.
   Tap, click, or press space to place the moving block on the stack.
   Overhang is trimmed; a near-perfect drop snaps into alignment.
   Best score persists in localStorage ("perfectStackBestScore").
---------------------------------------------------------------------------- */
(() => {
  'use strict';

  const canvas = document.getElementById('stack-game');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // --- Tunables (per PRD) ---------------------------------------------------
  const STORAGE_KEY = 'perfectStackBestScore';
  const INITIAL_SPEED = 2;      // px per frame
  const SPEED_STEP = 0.15;      // added after each successful placement
  const MAX_SPEED = 8;          // px per frame cap
  const PERFECT_PX = 5;         // snap threshold
  const BLOCK_H = 26;           // block height in px
  const PAD_BOTTOM = 26;        // gap under the base block
  const RESTART_GUARD_MS = 250; // ignore input right after game over

  // --- State ------------------------------------------------------------------
  let state = 'start';          // 'start' | 'playing' | 'gameOver'
  let blocks = [];              // settled blocks: { x, w, row }
  let moving = null;            // { x, w, row, dir, speed }
  let score = 0;
  let best = 0;
  let newBest = false;
  let perfectFlash = 0;         // frames left on the "Perfect!" label
  let gameOverAt = 0;
  let W = 0;
  let H = 0;

  try { best = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; } catch (e) {}

  // --- Theme colours (read from the site's CSS variables) ---------------------
  let theme = { ink: '#37352f', ink65: 'rgba(55,53,47,.65)', ink50: 'rgba(55,53,47,.5)', bg: '#ffffff' };
  const readTheme = () => {
    const cs = getComputedStyle(document.documentElement);
    theme = {
      ink: cs.getPropertyValue('--ink').trim() || theme.ink,
      ink65: cs.getPropertyValue('--ink-65').trim() || theme.ink65,
      ink50: cs.getPropertyValue('--ink-50').trim() || theme.ink50,
      bg: cs.getPropertyValue('--card-bg').trim() || theme.bg,
    };
  };
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // Block colour: a gentle hue ramp so every layer is distinct in both themes.
  const blockColor = (row) => `hsl(${(200 + row * 14) % 360} 48% 56%)`;

  // --- Sizing ------------------------------------------------------------------
  const resize = () => {
    const prevW = W;
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Keep the stack proportional when the canvas width changes.
    if (prevW > 0 && prevW !== W) {
      const r = W / prevW;
      blocks.forEach((b) => { b.x *= r; b.w *= r; });
      if (moving) { moving.x *= r; moving.w *= r; }
    }
  };

  // Camera: slide the view down once the stack climbs past ~60% of the canvas.
  const cameraOffset = () => {
    const topRow = (moving ? moving.row : blocks.length - 1) + 1;
    return Math.max(0, topRow * BLOCK_H + PAD_BOTTOM - H * 0.62);
  };
  const rowY = (row, cam) => H - PAD_BOTTOM - (row + 1) * BLOCK_H + cam;

  // --- Game lifecycle ------------------------------------------------------------
  const baseBlock = () => {
    const w = Math.min(W * 0.5, 260);
    return { x: (W - w) / 2, w, row: 0 };
  };

  const spawnMoving = () => {
    const top = blocks[blocks.length - 1];
    const fromLeft = blocks.length % 2 === 1;
    moving = {
      x: fromLeft ? 0 : W - top.w,
      w: top.w,
      row: top.row + 1,
      dir: fromLeft ? 1 : -1,
      speed: Math.min(MAX_SPEED, INITIAL_SPEED + score * SPEED_STEP),
    };
  };

  const startGame = () => {
    blocks = [baseBlock()];
    score = 0;
    newBest = false;
    perfectFlash = 0;
    spawnMoving();
    state = 'playing';
  };

  const endGame = () => {
    state = 'gameOver';
    moving = null;
    gameOverAt = performance.now();
    if (score > best) {
      best = score;
      newBest = true;
      try { localStorage.setItem(STORAGE_KEY, String(best)); } catch (e) {}
    }
  };

  const placeBlock = () => {
    const prev = blocks[blocks.length - 1];
    const left = Math.max(moving.x, prev.x);
    const right = Math.min(moving.x + moving.w, prev.x + prev.w);
    const overlap = right - left;

    if (overlap <= 0) { endGame(); return; }

    if (Math.abs(moving.x - prev.x) <= PERFECT_PX) {
      // Perfect placement: snap into alignment, keep the full width.
      moving.x = prev.x;
      moving.w = prev.w;
      perfectFlash = 45;
    } else {
      // Trim the overhang; only the overlapping section survives.
      moving.x = left;
      moving.w = overlap;
    }

    blocks.push({ x: moving.x, w: moving.w, row: moving.row });
    score += 1;
    spawnMoving();
  };

  // --- Input ---------------------------------------------------------------------
  const act = () => {
    if (state === 'start') startGame();
    else if (state === 'playing') placeBlock();
    else if (performance.now() - gameOverAt > RESTART_GUARD_MS) startGame();
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    act();
  });
  canvas.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault(); // keep the page from scrolling
      act();
    }
  });

  // --- Render ----------------------------------------------------------------------
  const drawBlocks = (cam) => {
    blocks.forEach((b) => {
      ctx.fillStyle = blockColor(b.row);
      ctx.fillRect(b.x, rowY(b.row, cam), b.w, BLOCK_H - 2);
    });
    if (moving) {
      ctx.fillStyle = blockColor(moving.row);
      ctx.fillRect(moving.x, rowY(moving.row, cam), moving.w, BLOCK_H - 2);
    }
  };

  const font = (px, weight) =>
    `${weight || 400} ${px}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const drawCenteredText = (lines) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach(([text, size, weight, color, y]) => {
      ctx.font = font(size, weight);
      ctx.fillStyle = color;
      ctx.fillText(text, W / 2, y);
    });
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    const cam = cameraOffset();
    drawBlocks(cam);

    if (state === 'start') {
      const lines = [
        ['Perfect Stack', 30, 700, theme.ink, H * 0.3],
        ['Tap or press space to stack', 15, 400, theme.ink65, H * 0.3 + 34],
      ];
      if (best > 0) lines.push([`Best: ${best}`, 14, 400, theme.ink50, H * 0.3 + 58]);
      drawCenteredText(lines);
    } else if (state === 'playing') {
      drawCenteredText([
        [String(score), 40, 700, theme.ink, 44],
        [`Best: ${best}`, 13, 400, theme.ink50, 74],
      ]);
      if (perfectFlash > 0) {
        ctx.globalAlpha = Math.min(1, perfectFlash / 30);
        drawCenteredText([['Perfect!', 18, 700, theme.ink65, 102]]);
        ctx.globalAlpha = 1;
        perfectFlash -= 1;
      }
    } else {
      const lines = [
        ['Game Over', 28, 700, theme.ink, H * 0.26],
        [`Score: ${score}`, 17, 500, theme.ink65, H * 0.26 + 34],
        [`Best: ${best}`, 14, 400, theme.ink50, H * 0.26 + 58],
      ];
      if (newBest) lines.push(['New Best Score!', 16, 700, theme.ink, H * 0.26 + 86]);
      lines.push(['Tap or press space to try again', 14, 400, theme.ink65, H * 0.26 + (newBest ? 114 : 90)]);
      drawCenteredText(lines);
    }
  };

  // --- Main loop ------------------------------------------------------------------
  const tick = () => {
    if (state === 'playing' && moving) {
      moving.x += moving.dir * moving.speed;
      if (moving.x <= 0) { moving.x = 0; moving.dir = 1; }
      if (moving.x + moving.w >= W) { moving.x = W - moving.w; moving.dir = -1; }
    }
    draw();
    requestAnimationFrame(tick);
  };

  resize();
  blocks = [baseBlock()]; // show the base block behind the start screen
  window.addEventListener('resize', resize);
  requestAnimationFrame(tick);
})();
