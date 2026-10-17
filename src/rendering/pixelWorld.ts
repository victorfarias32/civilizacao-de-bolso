import { drawProjects, drawDestination } from "./scenarios";
import { type Game, type Person, living } from "../simulation/model";
import { appearance, type Appearance } from "./appearance";

export const WIDTH = 480,
  HEIGHT = 320;
type Ctx = CanvasRenderingContext2D;
const shirts = [
  "#b35249",
  "#d0a85b",
  "#5391a2",
  "#ab6e95",
  "#d6c7a0",
  "#6f9763",
];
const darkShirts = [
  "#763e3a",
  "#967841",
  "#375d79",
  "#744563",
  "#9b906d",
  "#496640",
];
export const hash = (x: number, y: number, seed: number) => {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + 17, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
};
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function line(
  c: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1,
) {
  x0 = Math.round(x0);
  x1 = Math.round(x1);
  y0 = Math.round(y0);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1,
    dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    rect(c, x0, y0, width, width, color);
    if (x0 === x1 && y0 === y1) break;
    const e = err * 2;
    if (e >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}
function disk(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  step = 2,
) {
  for (let row = -ry; row <= ry; row += step) {
    const half = Math.floor(
      rx * Math.sqrt(Math.max(0, 1 - (row * row) / (ry * ry))),
    );
    rect(c, x - half, y + row, half * 2 + 1, step, color);
  }
}
function poly(c: Ctx, points: number[][], color: string) {
  const min = Math.min(...points.map((p) => p[1])),
    max = Math.max(...points.map((p) => p[1]));
  for (let y = Math.ceil(min); y <= max; y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2)
      rect(
        c,
        Math.ceil(xs[i]),
        y,
        Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1,
        1,
        color,
      );
  }
}
function surface() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return canvas;
}
export function riverX(y: number) {
  return 187 - y * 0.27 + 24 * Math.sin(y * 0.024) + 10 * Math.cos(y * 0.061);
}
function riverWidth(a: Appearance) {
  return a.dry ? 9 : a.season === 1 ? 20 : 26;
}
const homePosition = (i: number) => ({
  x: 216 + (i % 5) * 40,
  y: 98 + Math.floor(i / 5) * 49,
});

function stone(c: Ctx, x: number, y: number, n: number, snow: boolean) {
  disk(c, x + 2, y + 2, 8, 4, "#273d3e");
  poly(
    c,
    [
      [x - 7, y],
      [x - 4, y - 7],
      [x + 3, y - 9],
      [x + 8, y - 3],
      [x + 7, y + 2],
      [x - 3, y + 4],
    ],
    "#687c79",
  );
  poly(
    c,
    [
      [x - 6, y - 1],
      [x - 3, y - 6],
      [x + 3, y - 7],
      [x + 6, y - 3],
      [x, y],
    ],
    snow ? "#d6dfd6" : "#a6ad94",
  );
  rect(c, x + 3, y - 2, 3, 2, "#465c61");
  if (n % 2) rect(c, x - 1, y - 5, 2, 2, "#c4c8a8");
}
function flower(c: Ctx, x: number, y: number, color: string) {
  rect(c, x, y, 1, 4, "#4b693b");
  rect(c, x - 1, y - 2, 3, 1, color);
  rect(c, x, y - 3, 1, 3, color);
  rect(c, x, y - 2, 1, 1, "#f4df93");
}
function fence(c: Ctx, x: number, y: number, length: number, snow: boolean) {
  rect(c, x, y + 3, length, 2, "#564b35");
  rect(c, x, y + 7, length, 2, "#9d8151");
  for (let i = 0; i <= length; i += 8) {
    rect(c, x + i, y, 3, 12, "#665139");
    rect(c, x + i, y, 2, 8, snow ? "#e1e5d7" : "#c1a574");
  }
}
function treeSprite(
  a: Appearance,
  kind: number,
  variant: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 52;
  canvas.height = 65;
  const c = canvas.getContext("2d")!,
    p = a.palette;
  const leaves = a.extinct
    ? ["#354d48", "#53695a", "#72846b", "#95a18b"]
    : a.dry && !p.snow
      ? ["#4c4833", "#73623d", "#96804b", "#b6a15f"]
      : p.leaves;
  disk(c, 27, 60, 17, 4, "#263e3d55");
  rect(c, 23, 35, 7, 25, "#3a3a2c");
  rect(c, 24, 35, 3, 23, "#876943");
  rect(c, 27, 46, 2, 13, "#b19462");
  rect(c, 25, 48, 2, 3, "#493a2a");
  if (kind === 1) {
    for (let tier = 0; tier < 4; tier++) {
      const y = 9 + tier * 10,
        w = 10 + tier * 5;
      poly(
        c,
        [
          [26, y - 8],
          [26 - w, y + 15],
          [26 + w, y + 15],
        ],
        leaves[0],
      );
      poly(
        c,
        [
          [26, y - 6],
          [27 - w, y + 11],
          [26 + w - 3, y + 11],
        ],
        leaves[1],
      );
      poly(
        c,
        [
          [26, y - 5],
          [26 - w + 4, y + 6],
          [26 + w - 6, y + 7],
        ],
        p.snow ? leaves[3] : leaves[2],
      );
      line(c, 23 - w / 2, y + 7, 26, y - 1, p.snow ? "#f2f1df" : leaves[3], 2);
    }
  } else if (p.snow) {
    for (const [dx, dy] of [
      [-15, -19],
      [15, -23],
      [-11, -33],
      [11, -40],
    ]) {
      line(c, 26, 46, 26 + dx, 46 + dy, "#514e40", 3);
      line(c, 26 + dx, 46 + dy, 27 + dx, 40 + dy, "#675d49", 2);
      rect(c, 22 + dx, 44 + dy, 9, 2, "#ebeddf");
    }
    disk(c, 24, 36, 5, 2, "#e4e8db");
    rect(c, 22, 57, 10, 3, "#e0e6d6");
  } else {
    const blossoming =
      a.season === 0 && variant % 3 === 0 && !a.dry && !a.extinct;
    const colors = blossoming
      ? ["#65434d", "#b97788", "#dea7b7", "#f1cbd0"]
      : leaves;
    const lobes = [
      [15, 29, 12, 13],
      [35, 29, 13, 14],
      [24, 17, 15, 13],
      [25, 36, 20, 14],
    ];
    lobes.forEach(([x, y, rx, ry]) => disk(c, x, y, rx + 1, ry + 1, colors[0]));
    lobes.forEach(([x, y, rx, ry], i) =>
      disk(c, x - 1, y - 3, rx - 1, ry - 2, colors[(i % 2) + 1]),
    );
    disk(c, 22, 13, 10, 6, colors[3]);
    disk(c, 12, 25, 7, 5, colors[2]);
    disk(c, 32, 23, 8, 6, colors[3]);
    disk(c, 25, 35, 11, 5, colors[2]);
    for (let i = 0; i < 28; i++) {
      const h = hash(i, variant, 7),
        x = 10 + (h % 30),
        y = 12 + ((h >>> 7) % 28);
      if ((x - 26) ** 2 / 400 + (y - 26) ** 2 / 300 < 1)
        rect(c, x, y, 2 + (h % 2), 1, colors[h % 4]);
    }
    if (a.season === 1 && variant % 2 === 0 && !a.dry)
      for (const [x, y] of [
        [17, 27],
        [33, 32],
        [26, 19],
      ]) {
        rect(c, x, y, 3, 3, "#c8654b");
        rect(c, x, y, 1, 1, "#f2c771");
      }
  }
  return canvas;
}
function house(c: Ctx, g: Game, a: Appearance, index: number) {
  const b = g.buildings[index],
    { x, y } = homePosition(index),
    p = a.palette;
  disk(c, x + 17, y + 35, 23, 5, "#223e3744");
  rect(c, x - 1, y + 29, 35, 10, "#575b51");
  for (let i = 0; i < 6; i++) {
    rect(
      c,
      x + i * 6,
      y + 31 + (i % 2) * 3,
      5,
      3,
      p.snow ? "#9daead" : "#8c8e77",
    );
    rect(c, x + i * 6, y + 31 + (i % 2) * 3, 4, 1, "#b7b69b");
  }
  if (b.progress < 4 && !a.extinct) {
    rect(c, x + 1, y + 9, 3, 25, "#5b4835");
    rect(c, x + 29, y + 9, 3, 25, "#5b4835");
    line(c, x, y + 10, x + 16, y - 2, "#bc9b69", 2);
    line(c, x + 16, y - 2, x + 32, y + 10, "#bc9b69", 2);
    rect(c, x + 1, y + 17, 31, 2, "#997950");
    rect(c, x + 3, y + 31, 24, 2, "#c0a16c");
    for (let n = 0; n < b.progress; n++)
      rect(c, x + 5 + n * 6, y + 21, 5, 9, "#bd9e69");
    rect(c, x + 33, y + 27, 9, 4, "#7d603e");
    return;
  }
  if (a.extinct || b.integrity < 50) {
    rect(c, x + 2, y + 19, 29, 15, "#7d7b64");
    rect(c, x + 3, y + 18, 8, 12, "#a6a186");
    rect(c, x + 22, y + 23, 7, 10, "#999780");
    rect(c, x + 11, y + 26, 9, 9, "#354239");
    for (let n = 0; n < 8; n++) {
      const h = hash(n, index, g.seed);
      rect(
        c,
        x - 2 + (h % 36),
        y + 31 + ((h >>> 6) % 8),
        4,
        2,
        n % 2 ? "#a29b7f" : "#606c5b",
      );
    }
    line(c, x + 1, y + 15, x + 15, y + 9, "#69523d", 2);
    rect(c, x + 1, y + 16, 8, 3, "#947653");
    if (a.extinct)
      for (let n = 0; n < 7; n++) {
        const xx = x + (hash(n, index, 4) % 30);
        line(c, xx, y + 36, xx + 3, y + 20, "#547357");
        rect(c, xx, y + 24, 4, 2, "#829568");
      }
    if (p.snow) rect(c, x + 3, y + 16, 8, 2, "#eff0e2");
    return;
  }
  const wood = g.era === "community" ? "#654b37" : "#796044";
  rect(c, x + 1, y + 12, 31, 22, "#665b43");
  rect(c, x + 3, y + 14, 27, 19, p.snow ? "#b8bfa6" : "#d5c497");
  rect(c, x + 4, y + 25, 25, 1, "#aa9771");
  rect(c, x + 3, y + 14, 3, 20, wood);
  rect(c, x + 27, y + 14, 3, 20, wood);
  rect(c, x + 13, y + 22, 8, 13, "#413e32");
  rect(c, x + 14, y + 23, 6, 11, "#735b3d");
  rect(c, x + 15, y + 23, 1, 11, "#af8b58");
  rect(c, x + 19, y + 29, 1, 1, "#e1c681");
  for (const wx of [7, 23]) {
    rect(c, x + wx - 1, y + 21, 6, 7, "#5a543b");
    rect(c, x + wx, y + 22, 4, 4, a.legacy || p.snow ? "#f4ce80" : "#82b4b0");
    rect(c, x + wx + 1, y + 22, 1, 4, "#b3a477");
    rect(c, x + wx, y + 26, 4, 1, "#e4d3a3");
  }
  poly(
    c,
    [
      [x - 3, y + 14],
      [x + 4, y - 2],
      [x + 29, y - 2],
      [x + 36, y + 14],
      [x + 33, y + 20],
      [x, y + 20],
    ],
    "#3e3d32",
  );
  poly(
    c,
    [
      [x - 1, y + 13],
      [x + 5, y],
      [x + 28, y],
      [x + 34, y + 13],
      [x + 31, y + 18],
      [x + 2, y + 18],
    ],
    a.season === 2 ? "#ac603e" : "#a74f3b",
  );
  for (let row = 0; row < 5; row++) {
    const yy = y + 2 + row * 3,
      left = x + 5 - row,
      right = x + 28 + row;
    for (let xx = left; xx < right; xx += 6) {
      rect(
        c,
        xx + (row % 2) * 2,
        yy,
        5,
        2,
        (xx + row) % 3 ? "#c77b4c" : "#965138",
      );
      rect(c, xx + (row % 2) * 2, yy + 2, 5, 1, "#723f32");
    }
  }
  rect(c, x + 4, y - 2, 25, 2, "#db9d63");
  rect(c, x + 2, y + 18, 30, 2, "#6e4935");
  rect(c, x + 1, y + 20, 32, 1, "#d5a16b");
  rect(c, x + 23, y - 5, 5, 9, "#5e5a4d");
  rect(c, x + 24, y - 5, 3, 8, "#a29a7d");
  rect(c, x + 22, y - 6, 7, 2, "#d3c4a2");
  if (p.snow) {
    poly(
      c,
      [
        [x + 5, y - 2],
        [x + 28, y - 2],
        [x + 33, y + 10],
        [x + 27, y + 8],
        [x + 22, y + 11],
        [x + 15, y + 7],
        [x + 9, y + 10],
        [x, y + 13],
      ],
      "#d9e4df",
    );
    rect(c, x + 4, y - 3, 23, 2, "#f5f3e7");
    rect(c, x, y + 19, 32, 2, "#eef0df");
    rect(c, x + 2, y + 21, 1, 4, "#b8d2d4");
    rect(c, x + 29, y + 21, 1, 3, "#b8d2d4");
  }
  if (a.repairs.includes(b.id)) {
    rect(c, x + 6, y + 8, 8, 5, p.snow ? "#f5f1dd" : "#dfb275");
    line(c, x + 8, y + 9, x + 12, y + 12, "#f4cf8b");
  }
  if (b.integrity < 75) {
    line(c, x + 25, y + 7, x + 21, y + 13, "#553f32");
    rect(c, x + 7, y + 15, 4, 2, "#5c4935");
  }
  if (a.shelter) {
    rect(c, x - 2, y + 20, 38, 3, "#687763");
    rect(c, x - 2, y + 23, 2, 12, "#6d563a");
    rect(c, x + 34, y + 23, 2, 12, "#6d563a");
  }
  if (a.sickIds.size) {
    rect(c, x + 4, y + 24, 5, 8, "#856a9d");
    rect(c, x + 5, y + 25, 3, 2, "#e0cfe2");
  }
  if (a.birth && index === 0) {
    rect(c, x + 34, y + 19, 8, 2, "#d498b1");
    rect(c, x + 37, y + 17, 2, 8, "#f1d5c5");
    rect(c, x + 30, y + 33, 10, 5, "#bda6a3");
    rect(c, x + 31, y + 33, 8, 3, "#e8cfbb");
  }
  if (a.community) {
    rect(c, x - 1, y + 22, 4, 3, "#e0b95c");
    rect(c, x, y + 21, 2, 1, "#f7d483");
  }
}
export interface PixelScene {
  ground: HTMLCanvasElement;
  props: HTMLCanvasElement;
  appearance: Appearance;
  lamps: { x: number; y: number }[];
  homes: { x: number; y: number }[];
  occluders: { x: number; y: number; image: HTMLCanvasElement }[];
}
export function createScene(g: Game): PixelScene {
  const ground = surface(),
    props = surface(),
    c = ground.getContext("2d")!,
    o = props.getContext("2d")!,
    a = appearance(g),
    p = a.palette,
    lamps: { x: number; y: number }[] = [];
  const grass = a.extinct
    ? ["#47594c", "#5b6a54", "#707b5f", "#899170"]
    : a.dry && !p.snow
      ? ["#75603e", "#8a7348", "#a78b55", "#b59a62"]
      : p.grass;
  rect(c, 0, 0, WIDTH, HEIGHT, grass[1]);
  for (let y = 0; y < HEIGHT; y += 2)
    for (let x = 0; x < WIDTH; x += 2) {
      const n = hash(x >> 1, y >> 1, g.seed);
      if (n % 7 === 0)
        rect(
          c,
          x,
          y,
          2 + (n % 2),
          2,
          grass[(hash(x >> 4, y >> 4, g.seed) + (n % 2)) % 3],
        );
      if (n % 137 === 0 && !p.snow) {
        rect(c, x, y - 2, 1, 4, grass[0]);
        rect(c, x - 1, y - 1, 3, 1, grass[3]);
      }
    }
  for (let x = 0; x < WIDTH; x += 2) {
    const edge =
      31 + Math.round(9 * Math.sin(x * 0.045) + 4 * Math.sin(x * 0.12));
    rect(c, x, 0, 2, edge, "#52695e");
    rect(c, x, edge - 11, 2, 9, "#697f6a");
    rect(c, x, edge - 4, 2, 3, "#334e48");
    rect(c, x, edge, 2, 5, p.snow ? "#9aaeb0" : "#3b513e");
    if (hash(x, 0, g.seed) % 4 === 0) rect(c, x, edge - 8, 1, 7, "#9b9e7a");
    if (p.snow) rect(c, x, 0, 2, edge - 12, "#c8d8d1");
  }
  const width = riverWidth(a);
  for (let y = 0; y < HEIGHT; y++) {
    const x = Math.round(riverX(y)),
      w = width + Math.round(3 * Math.sin(y * 0.13));
    rect(
      c,
      x - w - 7,
      y,
      w * 2 + 14,
      1,
      p.snow ? "#e5e8dc" : a.dry ? "#bbaa78" : "#a0a06c",
    );
    rect(c, x - w - 3, y, w * 2 + 6, 1, p.snow ? "#9bb5b7" : "#587d6a");
    rect(c, x - w, y, w * 2, 1, p.water[0]);
    rect(c, x - w + 2, y, w * 2 - 4, 1, p.water[1]);
    rect(c, x - 5, y, w, 1, p.water[2]);
    if (p.snow) {
      rect(c, x - w + 1, y, w * 2 - 2, 1, p.water[2]);
      if (y % 17 < 2) rect(c, x - 10, y, 14, 1, p.water[3]);
    }
  }
  for (let i = 0; i < 75; i++) {
    const y = 40 + (hash(i, 2, g.seed) % 278),
      x = riverX(y) + (i % 2 ? 1 : -1) * (width + 6 + (hash(i, 8, g.seed) % 9));
    if (i % 4 === 0) stone(c, x, y, i, p.snow);
    else {
      line(c, x, y, x - 1, y - 5, p.snow ? "#b0bfac" : "#8d9256");
      line(c, x + 2, y, x + 3, y - 7, p.snow ? "#c6ccbb" : "#b2a46a");
      if (i % 3 === 0) rect(c, x + 3, y - 8, 2, 3, "#6b6041");
    }
  }
  const pathColor = p.snow ? "#a5b5b2" : p.soil;
  const path = (x: number, y: number, w: number, h: number) => {
    rect(c, x, y, w, h, p.snow ? "#b5c5c1" : "#6b6744");
    rect(c, x + 1, y + 1, w - 2, h - 2, pathColor);
    for (let yy = y + 2; yy < y + h - 2; yy += 3)
      for (let xx = x + 2; xx < x + w - 2; xx += 4) {
        const n = hash(xx, yy, g.seed);
        if (n % 4 === 0)
          rect(
            c,
            xx,
            yy,
            a.community ? 3 : 1,
            a.community ? 2 : 1,
            a.community
              ? p.snow
                ? "#d8dfd4"
                : "#b2ab8a"
              : p.snow
                ? "#d5ded4"
                : "#c6ab73",
          );
      }
  };
  path(105, 181, 107, 12);
  path(202, 131, 12, 144);
  path(206, 134, 210, 9);
  path(206, 183, 210, 9);
  path(206, 232, 210, 9);
  path(208, 265, 104, 12);
  path(407, 133, 9, 108);
  const bridge = riverX(186);
  rect(o, bridge - width - 12, 179, width * 2 + 25, 17, "#463e33");
  for (let x = bridge - width - 10; x < bridge + width + 12; x += 4) {
    rect(o, x, 180, 3, 13, "#a68a59");
    rect(o, x, 181, 3, 1, "#dcc28a");
    rect(o, x, 190, 3, 2, "#755c3b");
  }
  rect(
    o,
    bridge - width - 13,
    177,
    width * 2 + 27,
    2,
    p.snow ? "#e1e9df" : "#c4a873",
  );
  for (const x of [bridge - width - 11, bridge, bridge + width + 10]) {
    rect(o, x, 175, 2, 6, "#766044");
    rect(o, x, 192, 2, 6, "#766044");
  }
  for (let i = 0; i < 50; i++) {
    const n = hash(i, 31, g.seed),
      x = 22 + (n % 430),
      y = 48 + ((n >>> 9) % 258);
    if (
      Math.abs(x - riverX(y)) < width + 18 ||
      (x > 198 && x < 418 && y > 87 && y < 260)
    )
      continue;
    if (p.snow) {
      if (i % 3 === 0) {
        rect(c, x, y, 6, 2, "#f4f3e3");
        rect(c, x + 2, y - 2, 5, 2, "#dce6d9");
      }
    } else {
      disk(c, x, y, 6, 3, p.dark);
      disk(c, x, y - 2, 5, 3, p.leaves[1]);
      if (!a.dry && i / 50 < a.abundance) {
        rect(c, x - 3, y - 4, 2, 2, a.season === 2 ? "#e5ab51" : "#c96c7f");
        rect(c, x + 2, y - 2, 2, 2, "#ecd08d");
      }
      if (a.season === 0 && !a.dry) {
        flower(c, x + 7, y, p.flower);
        flower(c, x - 7, y + 2, "#e7dab0");
      }
    }
  }
  if (a.season === 2 && !p.snow)
    for (let i = 0; i < 290; i++) {
      const n = hash(i, 53, g.seed),
        x = n % WIDTH,
        y = 44 + ((n >>> 10) % 275);
      if (Math.abs(x - riverX(y)) > width + 3)
        rect(
          c,
          x,
          y,
          2 + (n % 2),
          1,
          ["#d09a4b", "#b55935", "#dbb961", "#846038"][n % 4],
        );
    }
  if (a.dry && !p.snow)
    for (let i = 0; i < 85; i++) {
      const n = hash(i, 63, g.seed),
        x = n % WIDTH,
        y = 60 + ((n >>> 8) % 250);
      if (Math.abs(x - riverX(y)) > width + 8) {
        line(c, x, y, x + 4, y + 2, "#6d5636");
        line(c, x + 4, y + 2, x + 6, y - 1, "#6d5636");
      }
    }
  for (let i = 0; i < 36; i++) {
    const n = hash(i, 17, g.seed),
      x = 18 + (n % 88),
      y = 65 + ((n >>> 8) % 236);
    if (i % 5 === 0) stone(o, x, y, i, p.snow);
    else if (p.snow) rect(o, x, y, 4, 2, "#f5f0df");
    else if (i % 3 === 0) {
      rect(o, x, y - 3, 2, 4, "#d9c9a0");
      rect(o, x - 1, y - 4, 4, 2, a.season === 2 ? "#bd694b" : "#d4ae79");
      rect(o, x, y - 4, 1, 1, "#eee1b8");
    } else flower(o, x, y, p.flower);
  }
  const trees: { x: number; y: number; kind: number; variant: number }[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 4; col++) {
      const n = hash(col, row, g.seed);
      trees.push({
        x: 15 + col * 28 + (n % 9),
        y: 70 + row * 39 + ((n >>> 8) % 13),
        kind: (row + col) % 3 === 0 ? 1 : 0,
        variant: n % 6,
      });
    }
  for (let i = 0; i < 12; i++)
    trees.push({
      x: 220 + i * 23,
      y: 51 + (hash(i, 4, g.seed) % 18),
      kind: i % 3 === 0 ? 1 : 0,
      variant: i % 6,
    });
  for (let i = 0; i < 8; i++)
    trees.push({
      x: 444 + (i % 2) * 22,
      y: 99 + i * 29,
      kind: i % 3 === 0 ? 1 : 0,
      variant: i % 6,
    });
  trees.push(
    { x: 425, y: 165, kind: 0, variant: 2 },
    { x: 431, y: 245, kind: 0, variant: 3 },
    { x: 172, y: 77, kind: 1, variant: 1 },
  );
  const sprites = new Map<string, HTMLCanvasElement>(),
    occluders: { x: number; y: number; image: HTMLCanvasElement }[] = [];
  for (const [i, t] of trees.entries()) {
    if (hash(i, 7, g.seed) % 100 >= g.environment.forest) {
      rect(o, t.x - 5, t.y - 4, 10, 5, "#4f4835");
      rect(o, t.x - 4, t.y - 5, 8, 3, p.snow ? "#e3e4d5" : "#b49c69");
      rect(o, t.x - 1, t.y - 4, 3, 1, "#786340");
      continue;
    }
    const key = `${t.kind}:${t.variant}`;
    if (!sprites.has(key)) sprites.set(key, treeSprite(a, t.kind, t.variant));
    o.drawImage(sprites.get(key)!, Math.round(t.x - 26), Math.round(t.y - 60));
    occluders.push({ x: t.x, y: t.y, image: sprites.get(key)! });
  }
  g.buildings.forEach((_, i) => house(o, g, a, i));
  fence(o, 218, 249, 76, p.snow);
  fence(o, 343, 249, 57, p.snow);
  for (let i = 0; i < Math.ceil(a.foodLevel * 8); i++) {
    const x = 321 + (i % 4) * 5,
      y = 265 - Math.floor(i / 4) * 5;
    rect(o, x, y, 5, 5, "#7b633f");
    rect(o, x + 1, y, 3, 3, a.hungry ? "#a69369" : "#d2b77c");
    rect(o, x + 2, y + 1, 1, 1, "#f0d98c");
  }
  for (let i = 0; i < Math.min(12, Math.ceil(g.resources.wood / 40)); i++) {
    const x = 363 + (i % 4) * 7,
      y = 273 - Math.floor(i / 4) * 4;
    rect(o, x, y, 8, 4, "#6d4e34");
    rect(o, x, y, 6, 2, "#b2905c");
    rect(o, x + 6, y, 2, 3, "#d1b77d");
  }
  rect(o, 318, 275, 28, 2, "#5e553c");
  for (let i = 0; i < 3; i++) {
    rect(o, 320 + i * 9, 273, 7, 2, "#ad9462");
    if (a.hungry) rect(o, 322 + i * 9, 273, 3, 1, "#4e5139");
  }
  if (a.reserves) {
    rect(o, 321, 254, 26, 16, "#756143");
    for (let x = 324; x < 345; x += 4) rect(o, x, 256, 2, 14, "#bb9c65");
    poly(
      o,
      [
        [317, 254],
        [334, 244],
        [351, 254],
        [349, 258],
        [319, 258],
      ],
      "#6d8560",
    );
    rect(o, 329, 258, 9, 9, "#413f30");
    rect(o, 330, 259, 7, 5, "#d5bb6f");
  }
  const banners = [
    g.policies.work === "intensive" ? "#b95544" : "#7caa77",
    g.policies.distribution === "contribution" ? "#d8af57" : "#6eacc0",
    g.policies.extraction === "accelerated" ? "#ac7651" : "#8aa85b",
  ];
  banners.forEach((color, i) => {
    const x = 246 + i * 14;
    rect(o, x, 251, 2, 20, "#614d35");
    rect(o, x - 1, 249, 4, 2, "#d1b16f");
    rect(o, x + 2, 252, 9, 10, a.extinct ? "#777d67" : color);
    rect(o, x + 3, 253, 7, 1, "#e8d7a1");
    rect(o, x + 5, 256, 2, 3, "#f1dfa6");
  });
  for (let i = 0; i < Math.min(24, a.memorial); i++) {
    const x = 355 + (i % 8) * 9,
      y = 62 + Math.floor(i / 8) * 11;
    rect(o, x - 3, y + 4, 7, 3, p.dark);
    rect(o, x - 2, y - 3, 5, 7, p.snow ? "#b5c3c2" : "#a4aa8c");
    rect(o, x - 1, y - 4, 3, 1, "#d5d3b2");
    rect(o, x, y - 1, 1, 3, "#697965");
    rect(o, x - 1, y, 3, 1, "#697965");
    if (a.season === 0) flower(o, x + 4, y + 5, "#e0b5c4");
  }
  if (a.memorial) fence(o, 350, 94, 75, p.snow);
  for (const [x, y] of [
    [204, 145],
    [204, 194],
    [204, 244],
    [409, 145],
    [409, 194],
    [302, 277],
  ]) {
    rect(o, x, y - 14, 2, 14, "#544936");
    rect(o, x - 2, y - 18, 6, 5, "#4a4938");
    rect(o, x - 1, y - 17, 4, 3, a.extinct ? "#696a52" : "#e5b85b");
    rect(o, x - 3, y - 19, 8, 1, "#a39364");
    if (!a.extinct) lamps.push({ x, y: y - 16 });
  }
  disk(o, 285, 285, 12, 5, "#6e6d53");
  disk(o, 285, 283, 8, 4, "#3a4132");
  line(o, 279, 283, 290, 287, "#967045", 2);
  line(o, 281, 287, 289, 282, "#bc955d", 2);
  if (a.birth) {
    rect(o, 299, 278, 8, 4, "#c790a4");
    rect(o, 300, 278, 6, 2, "#e9d3be");
  }
  if (a.recovery && !a.hungry) {
    rect(o, 307, 283, 25, 6, "#73583b");
    rect(o, 308, 282, 23, 3, "#d5be8c");
    for (let i = 0; i < 4; i++) {
      rect(o, 310 + i * 5, 282, 3, 1, "#f2d7a4");
      rect(o, 311 + i * 5, 281, 2, 1, "#b87d45");
    }
  }
  if (a.cooperation) {
    rect(o, 241, 187, 2, 24, "#685139");
    rect(o, 243, 187, 14, 10, "#dbaf58");
    rect(o, 247, 189, 3, 5, "#745537");
    rect(o, 245, 190, 7, 2, "#745537");
    rect(o, 238, 208, 22, 4, "#8c7048");
    rect(o, 242, 207, 3, 2, "#b5bbaa");
    rect(o, 252, 204, 2, 6, "#c2a06a");
  }
  drawProjects(o, g);
  return {
    ground,
    props,
    appearance: a,
    lamps,
    occluders,
    homes: g.buildings.map((_, i) => homePosition(i)),
  };
}
export interface Hit {
  id: string;
  x: number;
  y: number;
}
function villager(
  c: Ctx,
  p: Person,
  x: number,
  y: number,
  frame: number,
  a: Appearance,
  selected: boolean,
) {
  const child = p.age < 64,
    s = child ? 0.75 : 1,
    xx = Math.round(x),
    yy = Math.round(y),
    walking = !["rest", "child"].includes(p.activity),
    step = walking ? frame % 2 : 0;
  const draw = (dx: number, dy: number, w: number, h: number, color: string) =>
    rect(c, xx + dx * s, yy + dy * s, w * s, h * s, color);
  if (selected) {
    line(c, xx - 6, yy + 1, xx - 2, yy + 3, "#f5d17d");
    line(c, xx + 2, yy + 3, xx + 6, yy + 1, "#f5d17d");
    rect(c, xx - 1, yy - 20, 3, 2, "#f7df9c");
    rect(c, xx, yy - 18, 1, 2, "#f7df9c");
  }
  draw(-4, 0, 8, 2, "#253b3955");
  const stoop = p.hunger >= 40 ? 2 : 0;
  draw(-3, -5, 2, 6 - step, "#3c3e39");
  draw(1, -5 + step, 2, 5, "#3c3e39");
  draw(-3, -1 - step, 3, 2, "#6e513c");
  draw(1, -1 + step, 3, 2, "#6e513c");
  draw(-4, -11 + stoop, 8, 8 - stoop, darkShirts[p.color]);
  draw(-3, -10 + stoop, 6, 6 - stoop, shirts[p.color]);
  draw(-2, -10 + stoop, 2, 5, "#efddac");
  draw(-5, -9 + step, 2, 5, "#ddb580");
  draw(3, -9 - step, 2, 5, "#b68c65");
  draw(-3, -16 + stoop, 6, 6, a.sickIds.has(p.id) ? "#c0bc86" : "#c8936b");
  draw(-2, -15 + stoop, 5, 4, a.sickIds.has(p.id) ? "#d3c99c" : "#e9bf8d");
  draw(-4, -17 + stoop, 7, 3, "#4b3d32");
  draw(-3, -18 + stoop, 5, 2, "#79604a");
  draw(2, -13 + stoop, 1, 1, "#3d3d32");
  if (a.palette.snow) {
    draw(-4, -18 + stoop, 8, 3, shirts[p.color]);
    draw(-3, -18 + stoop, 6, 1, "#d0d9c0");
    draw(-3, -10 + stoop, 7, 2, "#d1a466");
  }
  if (p.activity === "food") {
    draw(4, -7, 4, 5, "#795e3b");
    draw(4, -7, 4, 1, "#c7a669");
    if (p.contribution > 0) draw(5, -8, 2, 2, "#a1ad59");
  }
  if (p.activity === "wood") {
    draw(4, -11, 1, 9, "#bb9660");
    draw(4, -12, 4, 3, "#96aeb0");
  }
  if (p.activity === "build") {
    draw(4, -11 - step * 3, 1, 7, "#bc9562");
    draw(3, -13 - step * 3, 4, 2, "#9db1ad");
  }
  if (a.sickIds.has(p.id)) {
    draw(7, -18, 1, 4, "#dbc6e3");
    draw(6, -17, 3, 1, "#dbc6e3");
  }
  if (p.hunger >= 40) {
    draw(7, -16, 1, 3, "#f0b07d");
    draw(7, -12, 1, 1, "#f0b07d");
  }
}
export function drawFrame(
  c: Ctx,
  scene: PixelScene,
  g: Game,
  time: number,
  reduced: boolean,
  selected: string | null,
): Hit[] {
  const a = scene.appearance,
    p = a.palette,
    t = reduced ? 0 : time,
    frame = Math.floor(t / 230);
  c.clearRect(0, 0, WIDTH, HEIGHT);
  c.drawImage(scene.ground, 0, 0);
  if (!p.snow)
    for (let i = 0; i < 42; i++) {
      const y = (i * 19 + Math.floor(t / 150)) % HEIGHT,
        x =
          riverX(y) +
          ((i * 7) % Math.max(2, riverWidth(a) * 2 - 8)) -
          riverWidth(a) +
          4;
      rect(c, x, y, 3 + (i % 4), 1, i % 3 ? p.water[2] : p.water[3]);
    }
  else
    for (let i = 0; i < 22; i++) {
      const y = i * 15 + 8,
        x = riverX(y);
      line(c, x - 7, y, x + 2, y + 4, "#608799");
      line(c, x + 2, y + 4, x + 7, y + 2, "#8baab5");
    }
  c.drawImage(scene.props, 0, 0);
  const hits: Hit[] = [],
    villagers = (
      g.ending &&
      ["ascension", "stellar", "migration", "cosmic"].includes(g.ending)
        ? []
        : living(g)
    )
      .map((person, i) => {
        const n = hash(i, 23, g.seed),
          home = scene.homes[i % Math.max(1, scene.homes.length)] || {
            x: 235,
            y: 120,
          };
        const destinations = {
          food: { x: 420 + (n % 18), y: 123 + ((n >>> 8) % 113) },
          wood: { x: 45 + (n % 59), y: 111 + ((n >>> 8) % 140) },
          build: { x: home.x + 15, y: home.y + 39 },
          rest: { x: home.x + 14, y: home.y + 38 },
          child: { x: 277 + (n % 30), y: 267 + ((n >>> 8) % 23) },
          dead: { x: 0, y: 0 },
        };
        const d = destinations[person.activity],
          homeHub = { x: 220 + (n % 80), y: 270 + ((n >>> 9) % 22) },
          walking = ["food", "wood", "build"].includes(person.activity);
        const progress = walking
            ? reduced
              ? 0.25 + (i % 7) * 0.1
              : (t / 10000 + i * 0.137) % 2
            : 1,
          f = progress > 1 ? 2 - progress : progress;
        let x = homeHub.x + (d.x - homeHub.x) * f,
          y = homeHub.y + (d.y - homeHub.y) * f;
        if (walking) {
          const points =
            person.activity === "wood"
              ? [
                  homeHub,
                  { x: 207, y: 270 },
                  { x: 207, y: 187 },
                  { x: riverX(186) - 36, y: 187 },
                  d,
                ]
              : person.activity === "food"
                ? [homeHub, { x: 409, y: 270 }, { x: 409, y: d.y }, d]
                : [homeHub, { x: 207, y: 270 }, { x: 207, y: d.y }, d];
          const part = Math.min(
              points.length - 2,
              Math.floor(f * (points.length - 1)),
            ),
            q = f * (points.length - 1) - part;
          x = points[part].x + (points[part + 1].x - points[part].x) * q;
          y = points[part].y + (points[part + 1].y - points[part].y) * q;
        }
        return { person, x: Math.round(x), y: Math.round(y), i };
      })
      .sort((a, b) => a.y - b.y || a.i - b.i);
  for (const { person, x, y, i } of villagers) {
    if (p.snow && person.activity !== "rest") {
      rect(c, x - 7, y + 6, 2, 1, "#8ca7af");
      rect(c, x - 10, y + 3, 2, 1, "#8ca7af");
    }
    villager(c, person, x, y, frame + i, a, person.id === selected);
    for (const tree of scene.occluders)
      if (tree.y > y && tree.y - 62 < y && Math.abs(tree.x - x) < 30)
        c.drawImage(
          tree.image,
          Math.round(tree.x - 26),
          Math.round(tree.y - 60),
        );
    hits.push({ id: person.id, x, y: y - 8 });
    if (
      a.cooperation &&
      person.activity === "build" &&
      !reduced &&
      frame % 3 === i % 3
    ) {
      rect(c, x + 7, y - 13, 1, 2, "#ffe1a0");
      rect(c, x + 10, y - 16, 2, 1, "#e9b75c");
    }
  }
  if (!a.extinct) {
    const fireHeight = a.hungry ? 4 : 9 + (frame % 3);
    poly(
      c,
      [
        [280, 284],
        [279, 280],
        [282, 278 - fireHeight / 2],
        [285, 281 - fireHeight],
        [288, 277],
        [291, 283],
        [288, 287],
        [282, 287],
      ],
      "#be643e",
    );
    poly(
      c,
      [
        [282, 284],
        [284, 280 - fireHeight / 2],
        [286, 282],
        [288, 283],
        [286, 286],
        [283, 286],
      ],
      "#efbe68",
    );
    rect(c, 284, 283, 2, 3, "#f4e3a2");
    if (a.palette.snow || a.legacy)
      scene.homes.forEach(({ x, y }, i) => {
        const building = g.buildings[i];
        if (building.integrity < 50 || building.progress < 4) return;
        for (let n = 0; n < 3; n++) {
          const rise = (Math.floor(t / 180) + n * 5) % 19;
          rect(
            c,
            x + 24 + Math.floor(Math.sin(t / 900 + i + n) * 3),
            y - 7 - rise,
            3 + (n % 2),
            2,
            "#d9ddd166",
          );
        }
      });
  }
  if (a.legacy || a.extinct) {
    c.fillStyle = a.extinct ? "#223b3b" : "#172a50";
    c.globalAlpha = a.extinct ? 0.27 : 0.48;
    c.fillRect(0, 0, WIDTH, HEIGHT);
    c.globalAlpha = 1;
    if (a.legacy) {
      for (let i = 0; i < 34; i++) {
        const n = hash(i, 3, g.seed),
          x = n % WIDTH,
          y = (n >>> 8) % HEIGHT,
          lit = reduced || (Math.floor(t / 700) + i) % 4 !== 0;
        if (lit) {
          rect(c, x, y, 1, 1, "#d3d9bc");
          if (i % 6 === 0) {
            rect(c, x - 1, y, 3, 1, "#e8dcaa");
            rect(c, x, y - 1, 1, 3, "#e8dcaa");
          }
        }
      }
      scene.homes.forEach(({ x, y }, i) => {
        const b = g.buildings[i];
        if (b.integrity >= 50 && b.progress >= 4) {
          rect(c, x + 7, y + 22, 4, 4, "#f2c375");
          rect(c, x + 23, y + 22, 4, 4, "#f2c375");
        }
      });
      scene.lamps.forEach(({ x, y }) => {
        rect(c, x - 4, y - 4, 9, 9, "#e8b86a22");
        rect(c, x - 2, y - 2, 5, 5, "#efc47b55");
        rect(c, x, y, 2, 2, "#ffe2a5");
      });
      for (let i = 0; i < 12; i++) {
        const x = 220 + ((i * 23) % 190),
          y = 72 + ((i * 37 + Math.floor(t / 250)) % 185);
        rect(c, x - 1, y - 2, 3, 4, "#c78351");
        rect(c, x, y - 1, 1, 2, "#f7d18d");
      }
    }
  }
  if (!reduced) {
    if (p.snow)
      for (let i = 0; i < 65; i++) {
        const n = hash(i, 91, g.seed),
          y = ((n % HEIGHT) + t / 95) % HEIGHT,
          x = (((n >>> 9) % WIDTH) + Math.sin(t / 1400 + i) * 5) % WIDTH;
        rect(c, x, y, i % 8 === 0 ? 2 : 1, 1, "#f4f4e8");
      }
    else if (a.season === 2)
      for (let i = 0; i < 28; i++) {
        const n = hash(i, 71, g.seed),
          y = ((n % HEIGHT) + t / 120) % HEIGHT,
          x = (((n >>> 8) % WIDTH) + Math.sin(t / 1200 + i) * 9) % WIDTH;
        rect(c, x, y, 2, 1, i % 2 ? "#e7b75c" : "#bc6941");
        rect(c, x + 1, y + 1, 1, 1, "#9a5c37");
      }
    else if (a.season === 0 && !a.dry)
      for (let i = 0; i < 30; i++) {
        const n = hash(i, 81, g.seed),
          y = ((n % HEIGHT) + t / 55) % HEIGHT,
          x = (n >>> 10) % WIDTH;
        line(c, x, y, x - 1, y + 3, "#bdd6d044");
      }
    else if (!a.dry)
      for (let i = 0; i < 18; i++) {
        const n = hash(i, 82, g.seed),
          x = 30 + (n % 420) + Math.sin(t / 700 + i) * 3,
          y = 70 + ((n >>> 9) % 230) + Math.cos(t / 950 + i) * 2;
        rect(c, x, y, 1, 1, "#e6d788");
        if (i % 4 === 0) {
          rect(c, x - 1, y - 1, 1, 1, "#f5db9e");
          rect(c, x + 1, y - 1, 1, 1, "#f5db9e");
        }
      }
    if (a.dry && !p.snow)
      for (let i = 0; i < 22; i++) {
        const x = (i * 41 + t / 70) % WIDTH,
          y = 80 + ((i * 31) % 236);
        rect(c, x, y, 4 + (i % 3), 1, "#d8ba8344");
      }
    if (a.birth)
      for (let i = 0; i < 9; i++) {
        const x = 223 + ((i * 17) % 98),
          y = 100 + ((i * 11 + t / 160) % 58);
        rect(c, x, y, 2, 1, i % 2 ? "#f3d5ba" : "#e6abc4");
      }
    if (a.extinct)
      for (let i = 0; i < 5; i++) {
        const x = ((i * 115 + t / 230) % 600) - 60,
          y = 80 + i * 49;
        rect(c, x, y, 78, 3, "#b6c4b016");
        rect(c, x + 12, y - 2, 44, 7, "#b6c4b016");
      }
  }
  drawDestination(c, g, t);
  return hits;
}
