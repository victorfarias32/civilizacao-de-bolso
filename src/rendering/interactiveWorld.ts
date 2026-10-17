import { type Game } from "../simulation/model";
import { GROVE_SITES } from "../simulation/world";
import { appearance } from "./appearance";
type C = CanvasRenderingContext2D;
function r(c: C, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function ring(
  c: C,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  for (let i = 0; i < 28; i++) {
    const a = (i * Math.PI) / 14;
    r(c, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 2, 1, color);
  }
}
function tree(
  c: C,
  x: number,
  y: number,
  snow: boolean,
  autumn: boolean,
  dead: boolean,
) {
  r(c, x - 2, y - 16, 4, 19, "#66533b");
  r(c, x + 2, y - 12, 5, 2, "#776346");
  if (dead) {
    r(c, x - 11, y - 18, 12, 2, "#7e8066");
    r(c, x + 1, y - 24, 2, 13, "#77765e");
    r(c, x - 3, y - 21, 13, 2, "#696d59");
    return;
  }
  const dark = snow ? "#7e9c90" : autumn ? "#9a643e" : "#3e6847",
    mid = snow ? "#c0d2c5" : autumn ? "#c9944d" : "#638a51",
    light = snow ? "#e4ece0" : autumn ? "#e5be75" : "#a2b977";
  const oval = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
  ) => {
    for (let yy = -ry; yy <= ry; yy++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2)));
      r(c, cx - half, cy + yy, half * 2 + 1, 1, color);
    }
  };
  const lobes = [
    [-7, -25, 11, 8],
    [6, -27, 11, 8],
    [-11, -17, 9, 8],
    [9, -16, 10, 8],
    [0, -18, 13, 9],
  ];
  for (const [dx, dy, rx, ry] of lobes) oval(x + dx, y + dy, rx, ry, dark);
  for (const [dx, dy, rx, ry] of lobes)
    oval(x + dx, y + dy - 1, rx - 1, ry - 1, mid);
  oval(x + 3, y - 30, 9, 4, light);
  oval(x - 11, y - 20, 5, 3, light);
  oval(x + 10, y - 15, 6, 2, light);
  for (let i = 0; i < 27; i++) {
    const dx = ((i * 11) % 29) - 14,
      dy = -30 + ((i * 7) % 21);
    if ((dx / 16) ** 2 + ((dy + 22) / 12) ** 2 < 1)
      r(c, x + dx, y + dy, i % 4 === 0 ? 2 : 1, 1, i % 3 ? dark : light);
  }
  if (!snow && !autumn)
    for (const [dx, dy] of [
      [-7, -24],
      [8, -21],
      [-9, -14],
      [4, -12],
    ]) {
      r(c, x + dx, y + dy, 2, 2, "#dcc099");
      r(c, x + dx, y + dy, 1, 1, "#f0dcc1");
    }
}
export function drawInteractiveWorld(c: C, g: Game) {
  const a = appearance(g),
    snow = a.palette.snow;
  // Modest landmarks exist from the founding; developed district art replaces these foundations.
  if (g.destiny.scores.knowledge < 12) {
    ring(c, 139, 104, 17, 9, "#9da993");
    r(c, 132, 104, 17, 4, "#80694b");
    r(c, 139, 91, 2, 15, "#79623f");
    r(c, 137, 88, 12, 4, "#b3bc9c");
    r(c, 147, 87, 3, 6, "#678e91");
  }
  if (g.destiny.scores.voyage < 12) {
    for (let i = 0; i < 5; i++) {
      r(c, 109 + i * 5, 224, 4, 13, "#a48b5d");
      r(c, 109 + i * 5, 224, 4, 1, "#d4c092");
    }
    r(c, 110, 236, 2, 9, "#67553c");
    r(c, 130, 236, 2, 9, "#67553c");
  }
  r(c, 384, 90, 16, 4, "#849581");
  r(c, 388, 78, 9, 13, snow ? "#d2daca" : "#bac3a3");
  r(c, 389, 81, 6, 1, "#6c8a79");
  r(c, 389, 84, 5, 1, "#6c8a79");
  const p = g.world.grove;
  if (!p) return;
  const { x, y } = GROVE_SITES[p.site];
  r(
    c,
    x - 29,
    y - 9,
    59,
    29,
    a.extinct ? "#6b7257" : snow ? "#c6d2c1" : "#8e7951",
  );
  r(
    c,
    x - 27,
    y - 7,
    55,
    25,
    a.extinct ? "#85876a" : snow ? "#dce3d0" : "#b2a472",
  );
  for (let i = 0; i < 4; i++) {
    const xx = x + (i % 2 ? 27 : -28),
      yy = y + (i < 2 ? -10 : 18);
    r(c, xx, yy - 9, 2, 10, "#6f5e40");
    r(c, xx - 1, yy - 10, 4, 2, "#cdb480");
  }
  if (p.progress === 0) {
    for (let i = 0; i < 6; i++) r(c, x - 25 + i * 9, y + 5, 5, 1, "#e0cb94");
    r(c, x + 31, y + 6, 10, 5, "#9b8054");
    r(c, x + 32, y + 6, 8, 1, "#dbc194");
    return;
  }
  if (p.progress === 1) {
    for (const xx of [x - 23, x + 20]) {
      r(c, xx, y - 25, 3, 42, "#816543");
      r(c, xx - 1, y - 26, 5, 3, "#ceb37f");
    }
    r(c, x - 24, y - 24, 48, 3, "#b99b67");
    r(c, x - 23, y - 10, 47, 2, "#a99162");
    for (let i = 0; i < 3; i++) {
      r(c, x - 18 + i * 15, y + 2, 8, 5, "#766344");
      r(c, x - 17 + i * 15, y + 2, 6, 1, "#b29c70");
    }
    r(c, x + 30, y + 8, 7, 5, "#796246");
    return;
  }
  if (p.progress === 2) {
    for (let i = 0; i < 6; i++) {
      const xx = x - 18 + (i % 3) * 18,
        yy = y + (i < 3 ? -2 : 13);
      r(c, xx - 4, yy, 10, 3, "#715e3c");
      r(c, xx, yy - 7, 2, 9, "#517447");
      r(c, xx - 4, yy - 6, 5, 3, snow ? "#c4d7bf" : "#8eaf69");
      r(c, xx + 2, yy - 9, 4, 3, snow ? "#e0e7d1" : "#adc67d");
    }
    r(c, x + 31, y + 3, 7, 6, "#8c7450");
    r(c, x + 32, y + 1, 4, 3, "#b6c8b1");
    return;
  }
  for (const [dx, dy] of [
    [-17, 0],
    [17, 1],
    [0, 17],
  ])
    tree(c, x + dx, y + dy, snow, a.season === 2, a.extinct);
  r(c, x + 27, y + 9, 16, 3, "#b6a074");
  r(c, x + 29, y + 12, 2, 5, "#74613e");
  r(c, x + 39, y + 12, 2, 5, "#74613e");
  for (let i = 0; i < 12 && !a.extinct; i++) {
    const xx = x - 27 + ((i * 11) % 55),
      yy = y + 17 + (i % 3) * 3;
    r(c, xx, yy, 1, 3, a.palette.leaves[1]);
    r(c, xx - 1, yy, 3, 1, a.palette.flower);
  }
  if (g.world.discovery.choice === "study") {
    for (const dx of [-30, 27]) {
      r(c, x + dx, y - 14, 3, 29, "#6c8a8c");
      r(c, x + dx - 3, y - 16, 9, 4, "#9edbd8");
      r(c, x + dx - 1, y - 15, 4, 1, "#dae9d4");
    }
    r(c, x + 28, y + 4, 8, 5, "#547985");
    r(c, x + 29, y + 5, 6, 2, "#b3dbd3");
  }
  if (g.world.discovery.choice === "protect") {
    for (const dx of [-28, 27]) {
      r(c, x + dx, y - 17, 2, 32, "#756148");
      r(c, x + dx - 2, y - 18, 6, 6, "#d1b376");
      r(c, x + dx - 1, y - 17, 4, 4, "#f0d997");
    }
    ring(c, x, y + 10, 31, 14, "#b4c296");
  }
}
export function drawWorldActivity(c: C, g: Game, t: number) {
  const d = g.world.discovery,
    p = g.world.grove;
  if (p && d.appearedAt !== null && g.ending !== "extinction") {
    const { x, y } = GROVE_SITES[p.site];
    for (let i = 0; i < 9; i++) {
      const angle = (i * Math.PI * 2) / 9 + t / 2600,
        rx = 14 + (i % 3) * 5;
      r(
        c,
        x + Math.cos(angle) * rx,
        y - 4 + Math.sin(angle) * 9,
        2,
        2,
        i % 2 ? "#f0d6ee" : "#b3e0ce",
      );
    }
    ring(
      c,
      x,
      y + 7,
      20 + Math.sin(t / 750) * 3,
      7,
      d.choice === "study" ? "#8dcdd2" : "#cebddf",
    );
  }
  const v = g.world.voyage;
  if (
    v &&
    g.status === "running" &&
    (v.returnedAt === null || g.cycle - v.returnedAt < 2)
  ) {
    const phase = v.returnedAt !== null ? 1 : (t / 18000) % 1,
      y = 125 + phase * 130,
      x = 187 - y * 0.27 + 24 * Math.sin(y * 0.024) + 10 * Math.cos(y * 0.061);
    r(c, x - 11, y, 24, 5, "#7b5e3c");
    r(c, x - 7, y + 5, 15, 2, "#a7804b");
    r(c, x, y - 21, 2, 23, "#68543b");
    for (let i = 0; i < 5; i++)
      r(c, x + 2, y - 20 + i * 3, 3 + i * 2, 3, "#e8d8a4");
    r(c, x - 8, y - 1, 5, 2, "#b99b5e");
  }
}
