import type { Game } from "../simulation/model";
import { appearance } from "./appearance";
type C = CanvasRenderingContext2D;
function r(c: C, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function p(c: C, points: number[][], color: string) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function ring(c: C, x: number, y: number, radius: number, color: string) {
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    r(
      c,
      x + Math.cos(a) * radius,
      y + Math.sin(a) * radius * 0.65,
      2,
      2,
      color,
    );
  }
}
function rune(c: C, x: number, y: number, color: string) {
  r(c, x, y, 1, 6, color);
  r(c, x + 3, y + 1, 1, 4, color);
  r(c, x, y + 2, 5, 1, color);
  r(c, x + 1, y + 5, 3, 1, color);
}
function vine(c: C, x: number, y: number, length: number, leaf: string) {
  for (let i = 0; i < length; i++) {
    r(c, x + Math.sin(i * 0.5) * 3, y + i, 1, 2, "#496b47");
    if (i % 4 === 0) r(c, x + (i % 8 ? 3 : -3), y + i, 4, 2, leaf);
  }
}
function boat(c: C, x: number, y: number, sail: boolean) {
  p(
    c,
    [
      [x - 15, y],
      [x + 18, y],
      [x + 10, y + 7],
      [x - 7, y + 7],
    ],
    "#77573d",
  );
  r(c, x - 10, y, 22, 2, "#d2aa6b");
  if (sail) {
    r(c, x, y - 25, 2, 27, "#684b35");
    p(
      c,
      [
        [x + 2, y - 24],
        [x + 15, y - 7],
        [x + 2, y - 5],
      ],
      "#eee1bd",
    );
    r(c, x - 1, y - 26, 7, 3, "#b56f49");
  }
}
export function drawProjects(c: C, g: Game) {
  const s = g.destiny.scores,
    a = appearance(g),
    snow = a.palette.snow,
    stone = snow ? "#d5ddd2" : "#a7ae94",
    leaf = a.palette.leaves[2];
  // Independent layers: each project remains when a different influence grows.
  if (s.nature >= 12) {
    for (let i = 0; i < (s.nature >= 48 ? 20 : s.nature >= 24 ? 12 : 6); i++) {
      const x = 207 + ((i * 37) % 244),
        y = 105 + ((i * 53) % 185);
      r(c, x - 4, y, 12, 4, "#574e39");
      r(c, x - 3, y - 1, 10, 2, snow ? "#d6e4dc" : "#799357");
      vine(c, x, y - 15, 16, leaf);
      r(c, x + 2, y - 13, 2, 2, snow ? "#b2cfb4" : "#e7baaf");
    }
    if (s.nature >= 24) {
      for (let i = 0; i < 6; i++) {
        const x = 229 + i * 33;
        vine(c, x, 95 + (i % 2) * 44, 22, leaf);
      }
    }
    if (s.nature >= 48) {
      for (let i = 0; i < 4; i++) {
        const x = 218 + i * 60;
        r(c, x, 70, 3, 30, "#6b6245");
        p(
          c,
          [
            [x - 17, 79],
            [x - 12, 67],
            [x + 9, 64],
            [x + 23, 80],
          ],
          leaf,
        );
        r(c, x - 9, 74, 25, 3, a.palette.leaves[3]);
      }
    }
  }
  if (s.knowledge >= 12) {
    const x = 139,
      y = 107;
    r(c, x - 20, y, 43, 5, "#465b60");
    r(c, x - 16, y - 23, 34, 24, stone);
    p(
      c,
      [
        [x - 19, y - 22],
        [x - 10, y - 34],
        [x + 9, y - 35],
        [x + 21, y - 22],
      ],
      "#4e7f8b",
    );
    r(c, x - 10, y - 27, 22, 3, "#8ab3b0");
    r(c, x - 11, y - 16, 7, 11, "#3a6574");
    r(c, x + 5, y - 16, 7, 11, "#3a6574");
    r(c, x - 1, y - 8, 3, 8, "#506269");
    rune(c, x - 2, y - 20, "#c5e2c5");
    if (s.knowledge >= 24) {
      r(c, x + 10, y - 44, 4, 17, "#738e91");
      p(
        c,
        [
          [x + 5, y - 45],
          [x + 24, y - 53],
          [x + 27, y - 46],
          [x + 8, y - 39],
        ],
        "#91b3ac",
      );
      r(c, x + 22, y - 51, 5, 6, "#d0d9b6");
      ring(c, x - 31, y - 10, 10, "#bdab73");
    }
    if (s.knowledge >= 48) {
      r(c, x - 33, y - 26, 4, 24, "#517680");
      r(c, x - 35, y - 29, 8, 4, "#a0d7c6");
      r(c, x + 29, y - 26, 4, 24, "#517680");
      r(c, x + 27, y - 29, 8, 4, "#a0d7c6");
    }
    if (s.nature >= 12) {
      vine(c, x - 16, y - 25, 29, leaf);
      vine(c, x + 15, y - 19, 23, leaf);
      r(c, x - 9, y - 32, 18, 2, leaf);
    }
  }
  if (s.spirit >= 12) {
    const x = 171,
      y = 269;
    p(
      c,
      [
        [x - 20, y],
        [x, y - 11],
        [x + 21, y],
        [x, y + 10],
      ],
      "#74808a",
    );
    ring(c, x, y - 3, 16, "#b7a6c8");
    r(c, x - 3, y - 24, 7, 23, "#777e91");
    p(
      c,
      [
        [x - 5, y - 24],
        [x, y - 33],
        [x + 6, y - 24],
      ],
      "#c3b1d7",
    );
    rune(c, x - 1, y - 20, "#ddd4e6");
    if (s.spirit >= 24)
      for (let i = 0; i < 4; i++) {
        const xx = x - 25 + i * 17,
          yy = y - 17 - (i % 2) * 19;
        p(
          c,
          [
            [xx, yy],
            [xx + 3, yy - 5],
            [xx + 6, yy],
            [xx + 3, yy + 4],
          ],
          "#a1a6c3",
        );
        r(c, xx + 2, yy - 2, 2, 3, "#dbd6ee");
      }
    if (s.spirit >= 48) ring(c, x, y - 28, 26, "#c9acd3");
  }
  if (s.order >= 12) {
    const x = 215,
      y = 83;
    r(c, x - 10, y - 34, 20, 34, "#8f917b");
    r(c, x - 13, y - 35, 26, 5, stone);
    for (let i = 0; i < 4; i++) r(c, x - 13 + i * 7, y - 39, 4, 5, stone);
    r(c, x - 3, y - 23, 6, 12, "#4b5960");
    r(c, x - 1, y - 46, 2, 13, "#766445");
    r(c, x + 1, y - 45, 11, 7, "#c8aa65");
    if (s.order >= 24) {
      for (let i = 0; i < 10; i++) {
        r(c, 223 + i * 22, 81, 20, 9, "#92977d");
        r(c, 223 + i * 22, 78, 5, 4, stone);
      }
    }
    if (s.order >= 48) {
      for (let i = 0; i < 7; i++) {
        r(c, 447, 93 + i * 26, 9, 22, "#8a927f");
        r(c, 445, 93 + i * 26, 13, 3, stone);
      }
      r(c, 335, 257, 39, 3, "#c9b783");
    }
  }
  if (s.voyage >= 12) {
    for (let i = 0; i < 7; i++) {
      r(c, 105 + i * 6, 220, 5, 16, "#9c8055");
      r(c, 105 + i * 6, 220, 5, 2, "#c5ad7e");
    }
    r(c, 106, 235, 2, 9, "#5b503d");
    r(c, 140, 235, 2, 9, "#5b503d");
    boat(c, 116, 252, s.voyage >= 24);
    r(c, 143, 211, 3, 23, "#6d573a");
    r(c, 146, 212, 15, 7, "#cda46b");
    r(c, 147, 214, 10, 2, "#775e40");
    if (s.voyage >= 48) {
      boat(c, 92, 279, true);
      r(c, 142, 242, 9, 8, "#9e7851");
      r(c, 144, 243, 5, 1, "#d2ac70");
    }
  }
  if (s.memory >= 12) {
    const x = 415,
      y = 296;
    r(c, x - 22, y, 45, 5, "#626c64");
    r(c, x - 18, y - 24, 37, 24, stone);
    p(
      c,
      [
        [x - 22, y - 25],
        [x, y - 36],
        [x + 24, y - 25],
      ],
      "#778573",
    );
    r(c, x - 21, y - 25, 43, 3, "#bbc0a1");
    for (let i = 0; i < 5; i++) {
      r(c, x - 15 + i * 7, y - 20, 3, 18, "#d0ceac");
      rune(c, x - 16 + i * 7, y - 17, "#73887d");
    }
    if (s.memory >= 24) {
      r(c, x - 30, y - 15, 6, 15, "#a3ac9a");
      rune(c, x - 30, y - 13, "#597a75");
      r(c, x + 27, y - 15, 6, 15, "#a3ac9a");
      rune(c, x + 27, y - 13, "#597a75");
    }
    if (s.spirit >= 12) {
      ring(c, x, y - 15, 22, "#c5aecf");
      for (let i = 0; i < 4; i++) r(c, x - 12 + i * 8, y - 29, 2, 3, "#ddc6e4");
    }
    if (s.memory >= 48) {
      r(c, x - 3, y - 44, 7, 13, "#899d8f");
      rune(c, x - 2, y - 42, "#dddbb3");
    }
  }
}
export function drawDestination(c: C, g: Game, time: number) {
  const s = g.destiny.scores,
    end = g.ending,
    t = time;
  // Ambient traces accumulate across every path and remain in the final world.
  for (const [index, key] of (
    ["nature", "knowledge", "spirit", "memory"] as const
  ).entries())
    if (s[key] >= 24 && end !== "extinction")
      for (let i = 0; i < 7; i++) {
        const x =
            key === "memory"
              ? 394 + i * 6
              : key === "spirit"
                ? 151 + i * 7
                : key === "knowledge"
                  ? 115 + i * 9
                  : 215 + i * 31,
          y =
            (key === "memory"
              ? 267
              : key === "spirit"
                ? 224
                : key === "knowledge"
                  ? 63
                  : 110) +
            ((i * 13) % 31) +
            Math.floor(Math.sin(t / 1000 + i) * 3);
        r(c, x, y, 1, 2, ["#b5dd87", "#9ad8e1", "#dac2ee", "#d9d3ab"][index]);
      }
  if (!end || end === "legacy" || end === "extinction") return;
  const wash: Record<string, string> = {
    symbiosis: "#255b3826",
    stellar: "#192c574d",
    ascension: "#604d7640",
    utopia: "#c9ac5429",
    migration: "#c78f4326",
    archive: "#62776738",
    cosmic: "#28194466",
  };
  r(c, 0, 0, 480, 320, wash[end]);
  if (end === "symbiosis") {
    for (let i = 0; i < 8; i++) {
      const x = 205 + i * 36,
        y = 80 + (i % 3) * 9;
      r(c, x, y - 7, 3, 34, "#5e6d48");
      vine(c, x + 2, y - 2, 33, "#81aa6a");
      p(
        c,
        [
          [x - 20, y - 10],
          [x - 20, y - 19],
          [x - 13, y - 19],
          [x - 13, y - 26],
          [x + 9, y - 26],
          [x + 9, y - 22],
          [x + 18, y - 22],
          [x + 18, y - 14],
          [x + 22, y - 14],
          [x + 22, y - 6],
          [x + 11, y - 6],
          [x + 11, y],
          [x - 10, y],
          [x - 10, y - 6],
        ],
        "#35624c",
      );
      r(c, x - 13, y - 23, 20, 6, "#59875b");
      r(c, x - 5, y - 24, 13, 3, "#88ac71");
      r(c, x - 17, y - 16, 12, 5, "#527e56");
      r(c, x + 5, y - 15, 12, 4, "#68945f");
      r(c, x - 4, y - 12, 10, 3, "#749e68");
      ring(c, x, y + 25, 6, "#b7d38d");
    }
    for (let i = 0; i < 80; i++)
      r(c, 190 + ((i * 73) % 284), 65 + ((i * 37) % 247), 1, 1, "#d4e4a1");
  }
  if (end === "stellar") {
    r(c, 0, 0, 480, 55, "#142943");
    for (let i = 0; i < 55; i++)
      r(c, (i * 83) % 478, (i * 31) % 51, 1, i % 7 ? 1 : 2, "#d3e5dc");
    const x = 335,
      y = 158;
    for (let i = 0; i < 11; i++)
      r(c, x - 9 + i, y + 28, 18 - i * 2, 55 - i * 4, "#d7bc7644");
    p(
      c,
      [
        [x - 8, y + 28],
        [x - 10, y - 9],
        [x, y - 30],
        [x + 10, y - 9],
        [x + 8, y + 28],
      ],
      "#c2ccbb",
    );
    r(c, x - 4, y - 7, 8, 11, "#578b9b");
    p(
      c,
      [
        [x - 8, y + 9],
        [x - 18, y + 30],
        [x - 8, y + 25],
      ],
      "#8da0a0",
    );
    p(
      c,
      [
        [x + 8, y + 9],
        [x + 18, y + 30],
        [x + 8, y + 25],
      ],
      "#8da0a0",
    );
    r(c, x - 5, y + 28, 10, 11, "#f0cb7f");
    r(c, x - 3, y + 29, 6, 7, "#faf0b9");
    for (let i = 0; i < 5; i++)
      ring(c, 75 + i * 90, 20 + (i % 2) * 11, 5, "#637d8b");
  }
  if (end === "ascension") {
    for (let i = 0; i < 12; i++) {
      const x = 218 + ((i * 41) % 226),
        y = 96 + ((i * 29) % 185);
      r(c, x - 3, 20, 7, y - 19, "#d1b8eb14");
      r(c, x - 1, y - 15, 3, 11, "#d4c8eb");
      r(c, x - 2, y - 19, 5, 4, "#e3d8e9");
      ring(c, x, y + 2, 8, "#ab91c1");
    }
    ring(c, 318, 52, 46, "#b8a1cc");
    ring(c, 318, 52, 38, "#dfd4e4");
  }
  if (end === "utopia") {
    for (let i = 0; i < 5; i++) {
      const x = 238 + i * 41;
      r(c, x, 88, 2, 203, "#c5b77566");
      r(c, 207, 107 + i * 45, 249, 2, "#c5b77566");
      r(c, x - 3, 86, 8, 8, "#baaa6c");
      r(c, x - 1, 88, 4, 4, "#f0e3a7");
    }
    ring(c, 319, 40, 24, "#d8c68a");
    rune(c, 317, 37, "#f0dfab");
  }
  if (end === "migration") {
    for (let i = 0; i < 4; i++) boat(c, 75 + i * 9, 281 - i * 43, true);
    for (let i = 0; i < 5; i++) {
      const x = 285 + i * 30,
        y = 300;
      r(c, x, y - 10, 18, 9, "#b18e60");
      p(
        c,
        [
          [x - 2, y - 10],
          [x + 5, y - 18],
          [x + 15, y - 18],
          [x + 21, y - 10],
        ],
        "#d8cfac",
      );
      r(c, x + 2, y, 4, 4, "#4a5145");
      r(c, x + 14, y, 4, 4, "#4a5145");
    }
    for (let i = 0; i < 15; i++) r(c, 382 + i * 5, 286, 3, 1, "#d6bd83");
  }
  if (end === "archive") {
    for (let i = 0; i < 7; i++) {
      const x = 281 + i * 24,
        y = 66 + (i % 2) * 6;
      r(c, x - 5, y - 35, 12, 37, "#6e827b");
      r(c, x - 7, y - 36, 16, 3, "#bbc5ad");
      for (let j = 0; j < 4; j++) rune(c, x - 2, y - 30 + j * 7, "#c7ceb1");
    }
    for (let i = 0; i < 8; i++) r(c, 265 + i * 25, 75, 3, 205, "#b9c6a018");
    ring(c, 415, 276, 35, "#d2c69b");
  }
  if (end === "cosmic") {
    for (let i = 0; i < 90; i++)
      r(c, (i * 97) % 480, (i * 43) % 310, 1, 1, i % 3 ? "#bdc5e5" : "#f1d9ef");
    for (let j = 0; j < 5; j++)
      ring(
        c,
        323,
        123,
        34 + j * 9,
        ["#e6d7ec", "#af9acb", "#668cb4", "#7dafbd", "#ceb7d6"][j],
      );
    p(
      c,
      [
        [322, 80],
        [342, 123],
        [321, 163],
        [304, 123],
      ],
      "#e6d6e7",
    );
    p(
      c,
      [
        [322, 90],
        [333, 123],
        [321, 151],
        [314, 123],
      ],
      "#393559",
    );
    for (let i = 0; i < 12; i++) {
      const x = 231 + ((i * 29) % 209),
        y = 62 + ((i * 47) % 229);
      p(
        c,
        [
          [x, y],
          [x + 9, y - 4],
          [x + 14, y + 2],
          [x + 4, y + 7],
        ],
        i % 2 ? "#8f9db5" : "#b4a4b9",
      );
    }
  }
}
