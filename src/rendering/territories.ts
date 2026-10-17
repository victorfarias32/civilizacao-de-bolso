import { PATHS, type Game, type PathKey } from "../simulation/model";
import { appearance } from "./appearance";
import { DISTRICTS, PATH_STYLE } from "./influences";
type C = CanvasRenderingContext2D;
function r(c: C, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function noise(x: number, y: number, seed: number) {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + 17, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
const SOIL: Record<PathKey, string[]> = {
  nature: ["#39744e", "#4d8656", "#669752", "#83af66"],
  knowledge: ["#436c7c", "#578494", "#729daa", "#98b9bc"],
  spirit: ["#6b5a81", "#837197", "#9a87ad", "#b5a0c3"],
  order: ["#8c7b4f", "#a09266", "#b6a77a", "#d0c395"],
  voyage: ["#937445", "#ac8b54", "#c1a36b", "#dbc18d"],
  memory: ["#477d75", "#60958a", "#82afa0", "#b0cabc"],
};
function crown(
  c: C,
  x: number,
  y: number,
  scale: number,
  colors: readonly string[],
) {
  r(c, x - 2, y, 4, 18, "#66573d");
  r(c, x - 18 * scale, y - 16 * scale, 36 * scale, 13 * scale, colors[0]);
  r(c, x - 13 * scale, y - 24 * scale, 26 * scale, 26 * scale, colors[1]);
  r(c, x - 19 * scale, y - 12 * scale, 38 * scale, 10 * scale, colors[1]);
  r(c, x - 10 * scale, y - 25 * scale, 16 * scale, 9 * scale, colors[2]);
  r(c, x - 15 * scale, y - 15 * scale, 10 * scale, 5 * scale, colors[3]);
  r(c, x + 5 * scale, y - 12 * scale, 10 * scale, 4 * scale, colors[2]);
  r(c, x - 3 * scale, y - 18 * scale, 8 * scale, 3 * scale, colors[3]);
}
function stall(c: C, x: number, y: number, color: string, snow: boolean) {
  r(c, x - 15, y, 31, 5, "#5c5440");
  r(c, x - 13, y - 18, 3, 19, "#796444");
  r(c, x + 11, y - 18, 3, 19, "#796444");
  r(c, x - 16, y - 22, 34, 5, color);
  for (let i = 0; i < 5; i++) {
    r(c, x - 16 + i * 7, y - 17, 5, 4, i % 2 ? "#efe1b3" : color);
    r(c, x - 9 + i * 4, y - 2, 3, 2, i % 2 ? "#b8ac6e" : "#a9794b");
  }
  if (snow) r(c, x - 16, y - 23, 34, 2, "#e8eee2");
}
/** Cached terrain, independent from simulation RNG. Expands with every point. */
export function drawTerritories(c: C, g: Game) {
  const a = appearance(g);
  for (const key of PATHS) {
    const score = g.destiny.scores[key];
    if (!score) continue;
    const d = DISTRICTS[key],
      growth = 0.25 + Math.sqrt(score / 48),
      rx = (key === "nature" ? 82 : 58) * growth,
      ry = (key === "nature" ? 57 : 43) * growth;
    const colors = a.extinct
      ? ["#526253", "#687662", "#7a846c", "#8d9478"]
      : a.palette.snow
        ? SOIL[key].map(
            (_, i) => ["#9fafb1", "#b6c7c7", "#ccd9d5", "#e0e8dd"][i],
          )
        : a.season === 2
          ? SOIL[key].map((color, i) => (i === 3 ? "#d4bd8c" : color))
          : SOIL[key];
    for (
      let y = Math.max(47, Math.floor(d.y - ry));
      y < Math.min(318, d.y + ry);
      y += 3
    )
      for (
        let x = Math.max(2, Math.floor(d.x - rx));
        x < Math.min(478, d.x + rx);
        x += 3
      ) {
        const n = noise(x, y, g.seed + PATHS.indexOf(key) * 91),
          edge = ((x - d.x) / rx) ** 2 + ((y - d.y) / ry) ** 2;
        if (edge > 1 + (n % 11) / 80) continue;
        if (edge > 0.82 && n % 3 === 0) continue;
        r(c, x, y, 3, 3, colors[n % 4]);
        if (key === "knowledge" && (x + y) % 12 < 3) {
          r(c, x, y, 3, 1, a.palette.snow ? "#91c9cf" : "#80ccd1");
        }
        if (key === "order" && y % 9 < 3) {
          r(c, x, y, 3, 1, a.palette.snow ? "#e8e3ce" : "#d3c499");
        }
        if (key === "memory" && n % 5 === 0) {
          r(c, x, y, 2, 1, a.palette.snow ? "#87b5ad" : "#bcd9c4");
        }
        if (key === "spirit" && n % 11 === 0)
          r(c, x, y, 1, 2, a.palette.snow ? "#b7a2cc" : "#d4b9e7");
        if (key === "nature" && n % 13 === 0) {
          r(c, x, y - 2, 1, 3, a.palette.leaves[1]);
          r(
            c,
            x - 1,
            y - 2,
            3,
            1,
            a.palette.snow ? "#d3e2df" : a.palette.flower,
          );
        }
        if (key === "voyage" && n % 9 === 0) r(c, x, y, 2, 1, "#e0c591");
      }
    // Distinct connections to the village, growing in reach as influence rises.
    if (score >= 12) {
      const endX =
        key === "knowledge"
          ? 211
          : key === "voyage"
            ? 209
            : key === "spirit"
              ? 285
              : key === "memory"
                ? 365
                : d.x;
      const length = Math.abs(endX - d.x),
        step = endX > d.x ? 1 : -1;
      for (let i = 0; i < length; i += 5) {
        const x = d.x + i * step,
          y = d.y + (key === "nature" ? i % 3 : 0);
        r(c, x, y, 4, 3, key === "nature" ? a.palette.leaves[2] : colors[3]);
        if (i % 10 === 0) r(c, x, y + 4, 2, 1, PATH_STYLE[key].color);
      }
    }
  }
}
/** Public space and architectural details occupy whole districts rather than isolated icons. */
export function drawDistrictLife(c: C, g: Game) {
  const s = g.destiny.scores,
    a = appearance(g),
    snow = a.palette.snow;
  if (s.nature >= 12) {
    const count = Math.min(10, 3 + Math.floor(s.nature / 12));
    for (let i = 0; i < count; i++) {
      const x = 252 + ((i * 47) % 191),
        y = 164 + ((i * 29) % 83);
      crown(c, x, y, 0.55 + (s.nature >= 48 ? 0.2 : 0), a.palette.leaves);
      r(c, x - 10, y + 18, 20, 3, snow ? "#dce7d9" : "#708c50");
    }
    for (let i = 0; i < Math.floor(s.nature * 1.5); i++) {
      const x = 245 + ((i * 37) % 202),
        y = 154 + ((i * 19) % 91);
      r(c, x, y, 1, 3, a.palette.leaves[1]);
      r(c, x - 1, y - 1, 3, 2, snow ? "#d9e5df" : a.palette.flower);
    }
  }
  if (s.knowledge >= 12) {
    stall(c, 77, 130, "#528dba", snow);
    r(c, 68, 119, 13, 6, "#28596f");
    r(c, 70, 120, 3, 3, "#b6e4dd");
    for (let i = 0; i < Math.min(5, Math.ceil(s.knowledge / 16)); i++) {
      const x = 77 + i * 16,
        y = 149 + (i % 2) * 11;
      r(c, x, y - 14, 3, 17, "#536f79");
      r(c, x - 5, y - 17, 13, 4, "#76bdce");
      r(c, x - 4, y - 16, 3, 1, "#cee5dc");
      r(c, x - 1, y - 12, 1, 10, "#b5c9be");
      r(c, x - 5, y + 3, 13, 3, "#496673");
    }
    if (s.knowledge >= 24) {
      r(c, 111, 132, 45, 5, "#597e8c");
      for (let i = 0; i < 6; i++) {
        r(c, 113 + i * 7, 132, 5, 4, "#8bd2d7");
        r(c, 113 + i * 7, 132, 4, 1, "#cae9df");
      }
    }
  }
  if (s.spirit >= 12) {
    for (let i = 0; i < Math.min(9, 3 + Math.floor(s.spirit / 9)); i++) {
      const angle = i * 2.4,
        x = 184 + Math.cos(angle) * 39,
        y = 265 + Math.sin(angle) * 25;
      r(c, x - 2, y - 13, 5, 14, "#7b708d");
      r(c, x - 3, y - 16, 7, 4, "#bba2d1");
      r(c, x - 1, y - 15, 3, 2, "#edd6ed");
      r(c, x - 5, y + 1, 11, 2, "#a38eb0");
    }
    if (s.spirit >= 24)
      for (let i = 0; i < 22; i++) {
        const angle = (i * Math.PI) / 11;
        r(
          c,
          184 + Math.cos(angle) * 49,
          265 + Math.sin(angle) * 32,
          3,
          2,
          "#b6a0ca",
        );
      }
  }
  if (s.order >= 12) {
    for (let i = 0; i < Math.min(8, 2 + Math.floor(s.order / 12)); i++) {
      const x = 263 + i * 25,
        y = 87;
      r(c, x, y - 21, 2, 23, "#756448");
      r(c, x + 2, y - 21, 11, 12, "#bd9a49");
      r(c, x + 4, y - 19, 2, 7, "#eee0a3");
      r(c, x - 3, y + 1, 9, 3, "#aca47b");
    }
    if (s.order >= 24) {
      r(c, 303, 58, 60, 9, "#8e8f78");
      r(c, 307, 54, 52, 6, "#c3b987");
      for (let i = 0; i < 5; i++) r(c, 310 + i * 10, 47, 4, 10, "#e2cc89");
    }
  }
  if (s.voyage >= 12) {
    for (let i = 0; i < Math.min(4, 1 + Math.floor(s.voyage / 18)); i++) {
      const x = 158 + (i % 2) * 35,
        y = 225 + Math.floor(i / 2) * 32;
      r(c, x - 17, y, 35, 6, "#836640");
      for (let j = 0; j < 5; j++) r(c, x - 16 + j * 7, y, 5, 1, "#d5b47a");
      stall(c, x, y, "#ce8e42", snow);
    }
    stall(c, 73, 206, "#ce8e42", snow);
    stall(c, 60, 260, "#c4854b", snow);
    for (let i = 0; i < Math.min(8, 2 + Math.floor(s.voyage / 10)); i++) {
      const x = 73 + ((i * 17) % 54),
        y = 276 + (i % 2) * 12;
      r(c, x, y - 6, 10, 8, "#86613f");
      r(c, x + 1, y - 5, 8, 2, "#c3a16b");
      r(c, x + 4, y - 6, 1, 8, "#594e3c");
    }
    if (s.voyage >= 24) {
      for (let i = 0; i < 4; i++) {
        r(c, 45 + i * 19, 232, 2, 20, "#746246");
        r(c, 45 + i * 19, 231, 20, 2, i % 2 ? "#e0b866" : "#d68d4a");
      }
    }
  }
  if (s.memory >= 12) {
    for (let i = 0; i < Math.min(7, 2 + Math.floor(s.memory / 14)); i++) {
      const x = 366 + ((i * 19) % 90),
        y = 244 + (i % 2) * 17;
      r(c, x - 3, y - 18, 8, 19, "#69968a");
      r(c, x - 4, y - 20, 10, 3, "#b5cfb9");
      for (let j = 0; j < 3; j++) r(c, x - 1, y - 15 + j * 4, 4, 1, "#d8e1bf");
      r(c, x - 6, y + 1, 14, 3, "#8caa96");
    }
    if (s.memory >= 24) {
      r(c, 386, 309, 66, 3, "#7b9b88");
      for (let i = 0; i < 9; i++) r(c, 388 + i * 7, 306, 4, 3, "#d0d8b3");
    }
  }
  // A permanent new marker per resolved decision: even repeat investments visibly add something.
  g.destiny.resolved.forEach((decision, i) => {
    const event = g.history.find(
      (e) => e.type === "decision" && e.evidence.decision === decision.id,
    );
    if (!event) return;
    const main = PATHS.reduce(
        (best, k) =>
          Number(event.evidence["path_" + k] || 0) >
          Number(event.evidence["path_" + best] || 0)
            ? k
            : best,
        PATHS[0],
      ),
      d = DISTRICTS[main],
      x = d.x - 29 + ((i * 13) % 58),
      y = d.y + 22 + (i % 3) * 5;
    r(c, x, y - 8, 2, 9, "#635943");
    r(c, x - 2, y - 11, 7, 5, PATH_STYLE[main].color);
    r(c, x, y - 10, 2, 2, "#eee3bc");
  });
  // Houses adopt the growing society's architecture; mixed societies keep multiple styles.
  const active = PATHS.filter((k) => s[k] >= 12).sort((a, b) => s[b] - s[a]);
  if (!active.length) return;
  g.buildings.forEach((b, i) => {
    if (b.progress < 4 || b.integrity < 50 || a.extinct) return;
    const x = 216 + (i % 5) * 40,
      y = 98 + Math.floor(i / 5) * 49,
      key = active[i % active.length],
      style = PATH_STYLE[key];
    for (let row = 0; row < 5; row++) {
      const yy = y + 2 + row * 3;
      r(
        c,
        x + 5 - row,
        yy,
        23 + row * 2,
        2,
        snow
          ? row % 2
            ? "#d6e2d8"
            : "#ecf0e1"
          : row % 2
            ? style.color
            : SOIL[key][1],
      );
    }
    r(c, x + 3, y + 19, 27, 2, style.color);
    r(c, x + 1, y + 34, 32, 2, SOIL[key][0]);
    if (s.nature >= 12) {
      r(c, x + 3, y + 21, 2, 11, a.palette.leaves[1]);
      for (let j = 0; j < 3; j++) {
        r(c, x + 1 + (j % 2) * 3, y + 22 + j * 3, 4, 2, a.palette.leaves[2]);
        r(c, x + 7 + j * 8, y + 29, 4, 2, a.palette.flower);
      }
    }
    if (key === "knowledge") {
      r(c, x + 20, y - 9, 3, 10, "#567f8d");
      r(c, x + 18, y - 11, 9, 4, "#91d1d9");
      r(c, x + 5, y + 23, 6, 3, "#ace0d9");
    }
    if (key === "spirit") {
      r(c, x + 30, y + 19, 3, 9, "#a887bc");
      r(c, x + 29, y + 19, 5, 4, "#e2b5e4");
    }
    if (key === "order") {
      r(c, x + 14, y + 17, 8, 5, "#d4b862");
      r(c, x + 17, y + 18, 2, 3, "#715938");
    }
    if (key === "voyage") {
      for (let j = 0; j < 4; j++)
        r(c, x + 9 + j * 4, y + 21, 4, 3, j % 2 ? "#eed49e" : "#c98d4d");
    }
    if (key === "memory") {
      r(c, x + 8, y + 21, 5, 9, "#558e81");
      for (let j = 0; j < 3; j++) r(c, x + 9, y + 23 + j * 2, 3, 1, "#d1ddbd");
    }
  });
}
export function drawPathAtmosphere(c: C, g: Game, t: number) {
  if (g.status === "ended") return;
  for (const key of PATHS) {
    const score = g.destiny.scores[key];
    if (score < 12) continue;
    const d = DISTRICTS[key],
      count = 3 + Math.floor(score / 12);
    for (let i = 0; i < count; i++) {
      const x = d.x - 34 + ((i * 19) % 69) + Math.sin(t / 1500 + i) * 4,
        y = d.y - 25 + ((i * 13) % 48) + Math.cos(t / 1300 + i) * 3;
      if (key === "nature") {
        r(c, x, y, 1, 3, "#4d6651");
        r(c, x - 2, y - 1, 2, 2, i % 2 ? "#e8bcca" : "#e5d987");
        r(c, x + 1, y, 2, 2, i % 2 ? "#edcfdd" : "#cfd77d");
      } else if (key === "spirit") {
        r(c, x, y - 5, 2, 3, "#dac1e8");
        r(c, x - 1, y - 2, 4, 3, "#c1a6dc66");
      } else if (key === "knowledge") {
        r(c, x, y, 3, 1, "#c4ece4");
        r(c, x + 3, y + 1, 1, 3, "#82cbdf");
      } else if (key === "memory") {
        r(c, x, y, 1, 5, "#cbe1c1");
        r(c, x, y + 2, 4, 1, "#b3d7c9");
      } else if (key === "order" && i < 4) {
        const xx = 263 + i * 25;
        r(c, xx + 10, 67 + Math.sin(t / 400 + i), 3, 9, "#ecd392");
      } else if (key === "voyage" && i < 3) {
        const xx = 76 + ((i * 27 + t / 200) % 58);
        r(c, xx, 238 + i * 8, 7, 3, "#d5b26c");
        r(c, xx + 1, 241 + i * 8, 2, 2, "#66543b");
      }
    }
  }
}
export function drawDistrictMonuments(c: C, g: Game) {
  const s = g.destiny.scores,
    a = appearance(g);
  if (a.extinct) return;
  if (s.nature >= 72) {
    crown(c, 338, 179, 1.4, a.palette.leaves);
    for (let i = 0; i < 12; i++)
      r(c, 309 + ((i * 13) % 57), 154 + ((i * 7) % 30), 2, 2, "#d7e7a6");
  }
  if (s.knowledge >= 72) {
    r(c, 99, 62, 5, 53, "#52788b");
    r(c, 95, 60, 13, 5, "#b4dce2");
    for (let i = 0; i < 5; i++) {
      r(c, 86 + i * 5, 48 + i * 2, 4, 3, "#8cbdcc");
      r(c, 97, 66 + i * 9, 9, 2, "#8cd9dc");
    }
    r(c, 99, 38, 3, 24, "#c9e7dd");
  }
  if (s.spirit >= 72) {
    for (let i = 0; i < 40; i++) {
      const angle = (i * Math.PI) / 20;
      r(
        c,
        175 + Math.cos(angle) * 32,
        238 + Math.sin(angle) * 27,
        3,
        3,
        i % 2 ? "#dec1ee" : "#a780c1",
      );
    }
    r(c, 174, 211, 3, 53, "#dcc1e922");
  }
  if (s.order >= 72) {
    r(c, 333, 45, 25, 43, "#9e936b");
    r(c, 336, 47, 19, 38, "#bcb18c");
    r(c, 329, 41, 33, 6, "#d6c487");
    for (let i = 0; i < 5; i++) r(c, 330 + i * 7, 35, 4, 8, "#e7d699");
    r(c, 343, 55, 6, 17, "#705c3d");
    r(c, 342, 30, 2, 16, "#756044");
    r(c, 344, 30, 18, 9, "#e5c772");
  }
  if (s.voyage >= 72) {
    r(c, 84, 290, 44, 7, "#74553a");
    r(c, 89, 297, 34, 4, "#a17a46");
    r(c, 96, 256, 3, 37, "#745a3b");
    r(c, 114, 268, 2, 25, "#745a3b");
    for (let i = 0; i < 7; i++)
      r(c, 99, 257 + i * 4, 3 + i * 2, 3, i % 2 ? "#d3a35a" : "#eee0b7");
    r(c, 117, 271, 12, 16, "#d8b775");
    r(c, 95, 253, 11, 4, "#d88c46");
  }
  if (s.memory >= 72) {
    r(c, 412, 254, 16, 45, "#668a7d");
    r(c, 414, 256, 12, 40, "#94b7a2");
    r(c, 410, 251, 20, 5, "#cfdbb8");
    r(c, 416, 242, 8, 10, "#9fbaa7");
    for (let i = 0; i < 7; i++) {
      r(c, 417, 259 + i * 5, 6, 1, "#dce4c5");
      r(c, 418 + (i % 2), 260 + i * 5, 1, 2, "#557f73");
    }
    r(c, 407, 297, 27, 5, "#789887");
  }
}
