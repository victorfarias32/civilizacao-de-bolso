import { useEffect, useRef } from "react";
import { type Game, living } from "../simulation/model";

const COLORS = [
  "#c98252",
  "#e5bc65",
  "#65899a",
  "#b77c82",
  "#d6cfb5",
  "#778c61",
];
export function World({
  game,
  selected,
  onSelect,
  reduced,
}: {
  game: Game;
  selected: string | null;
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    latest = useRef(game),
    selection = useRef(selected),
    hits = useRef<{ id: string; x: number; y: number }[]>([]);
  latest.current = game;
  selection.current = selected;
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!;
    let frame = 0,
      last = 0,
      w = 800,
      h = 470;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    const poly = (pts: number[][], fill: string, stroke?: string) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    };
    const ellipse = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      color: string,
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    const draw = (time: number) => {
      const g = latest.current,
        extinct = g.ending === "extinction",
        winter = g.cycle % 4 === 3;
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, winter ? "#e1e8df" : "#e6eadf");
      gradient.addColorStop(1, "#d7dfce");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w / 700, h / 500),
        ox = w / 2,
        oy = h * 0.26,
        tw = 26 * scale,
        th = 13 * scale;
      const iso = (x: number, y: number) => [
        ox + (x - y) * tw,
        oy + (x + y) * th,
      ];
      ellipse(w / 2, h * 0.8, 245 * scale, 46 * scale, "#8b9f8955");
      const a = iso(0, 0),
        b = iso(12, 0),
        c = iso(12, 12),
        d = iso(0, 12),
        depth = 26 * scale;
      poly([b, c, [c[0], c[1] + depth], [b[0], b[1] + depth]], "#847257");
      poly([c, d, [d[0], d[1] + depth], [c[0], c[1] + depth]], "#9a8563");
      const fertility = g.environment.fertility;
      for (let y = 0; y < 12; y++)
        for (let x = 0; x < 12; x++) {
          const river = x === 2 || (x === 3 && y < 7) || (x === 1 && y > 7);
          const land = extinct
            ? "#a9ae91"
            : winter
              ? ["#bdc8a8", "#c8ceb4", "#b7c4a3"][(x + y) % 3]
              : fertility < 40
                ? ["#c1b48a", "#baad80", "#c8bb94"][(x + y) % 3]
                : ["#a4b780", "#adbd88", "#9fb37d"][(x * 3 + y) % 3];
          poly(
            [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)],
            river ? "#80b2b1" : land,
          );
          if (river && (x + y) % 2 === 0) {
            const [px, py] = iso(x + 0.5, y + 0.5);
            ctx.strokeStyle = "#c3e0d1aa";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 8 * scale, py);
            ctx.lineTo(px + 7 * scale, py - 2 * scale);
            ctx.stroke();
          }
          if (!river && (x * 11 + y * 3) % 8 === 0) {
            const [px, py] = iso(x + 0.5, y + 0.5);
            ctx.fillStyle = "#eef1c78a";
            ctx.fillRect(px, py, 2 * scale, 2 * scale);
          }
        }
      // A meandering path, bridge and garden plots anchor the village.
      const path = [iso(3, 6), iso(6, 6), iso(7, 8), iso(10, 8)];
      ctx.strokeStyle = "#d0bf94";
      ctx.lineWidth = 13 * scale;
      ctx.lineJoin = "round";
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      const [bx, by] = iso(2.5, 6);
      poly(
        [
          [bx - 28 * scale, by - 12 * scale],
          [bx + 18 * scale, by + 9 * scale],
          [bx + 29 * scale, by + 3 * scale],
          [bx - 17 * scale, by - 18 * scale],
        ],
        "#aa8255",
        "#87663e",
      );
      const objects: { depth: number; paint: () => void }[] = [];
      const tree = (x: number, y: number, index: number) => {
        const [px, py] = iso(x + 0.5, y + 0.5);
        objects.push({
          depth: x + y,
          paint: () => {
            const s = scale * (0.85 + (index % 3) * 0.15);
            ellipse(px + 3 * s, py + 3 * s, 14 * s, 6 * s, "#63734b33");
            ctx.fillStyle = "#81694d";
            ctx.fillRect(px - 2 * s, py - 28 * s, 4 * s, 29 * s);
            const sway =
              reduced || extinct ? 0 : Math.sin(time / 2100 + index) * 1.2 * s;
            ellipse(
              px + sway,
              py - 31 * s,
              18 * s,
              22 * s,
              extinct ? "#77866b" : winter ? "#82977c" : "#52785a",
            );
            ellipse(
              px - 7 * s + sway,
              py - 38 * s,
              13 * s,
              17 * s,
              winter ? "#a8b79a" : "#72986a",
            );
            ellipse(
              px + 6 * s + sway,
              py - 46 * s,
              12 * s,
              14 * s,
              winter ? "#bcc8ae" : "#85a777",
            );
          },
        });
      };
      for (let y = 0; y < 12; y++)
        for (let x = 0; x < 12; x++)
          if (
            ((x >= 5 && y < 3) || (x >= 9 && y < 7) || (y >= 10 && x > 4)) &&
            (x * 13 + y * 7) % 4 === 0 &&
            (x + y) % 100 < g.environment.forest / 6
          )
            tree(x, y, x * 12 + y);
      g.buildings.forEach((building, i) => {
        const x = 5 + (i % 3) * 2,
          y = 4 + Math.floor(i / 3) * 1.25,
          [px, py] = iso(x, y),
          s = scale;
        objects.push({
          depth: x + y,
          paint: () => {
            ellipse(px, py + 4 * s, 22 * s, 9 * s, "#59644433");
            if (extinct || building.integrity < 50) {
              poly(
                [
                  [px - 17 * s, py],
                  [px, py + 8 * s],
                  [px, py - 9 * s],
                  [px - 17 * s, py - 15 * s],
                ],
                "#b5a387",
              );
              poly(
                [
                  [px, py + 8 * s],
                  [px + 17 * s, py],
                  [px + 17 * s, py - 11 * s],
                  [px, py - 9 * s],
                ],
                "#8b8270",
              );
              return;
            }
            if (building.progress < 4) {
              ctx.strokeStyle = "#9d7851";
              ctx.lineWidth = 3 * s;
              ctx.strokeRect(px - 13 * s, py - 18 * s, 26 * s, 18 * s);
              return;
            }
            poly(
              [
                [px - 19 * s, py - 2 * s],
                [px, py + 8 * s],
                [px, py - 17 * s],
                [px - 19 * s, py - 27 * s],
              ],
              "#d5c19a",
            );
            poly(
              [
                [px, py + 8 * s],
                [px + 20 * s, py - 2 * s],
                [px + 20 * s, py - 27 * s],
                [px, py - 17 * s],
              ],
              "#b29e7c",
            );
            poly(
              [
                [px - 24 * s, py - 27 * s],
                [px - 3 * s, py - 41 * s],
                [px + 23 * s, py - 28 * s],
                [px + 2 * s, py - 13 * s],
              ],
              "#a76947",
            );
            poly(
              [
                [px - 24 * s, py - 27 * s],
                [px - 3 * s, py - 41 * s],
                [px - 2 * s, py - 35 * s],
                [px + 2 * s, py - 13 * s],
              ],
              "#c28a59",
            );
            ctx.fillStyle = "#554b38";
            ctx.fillRect(px + 5 * s, py - 13 * s, 6 * s, 15 * s);
            ctx.fillStyle = "#edc56b";
            ctx.fillRect(px - 13 * s, py - 15 * s, 5 * s, 6 * s);
            if (!reduced) {
              ellipse(
                px + 11 * s + Math.sin(time / 1200 + i) * 3 * s,
                py - 47 * s - ((time / 100) % 12) * s,
                4 * s,
                7 * s,
                "#f0eee466",
              );
            }
          },
        });
      });
      const [fx, fy] = iso(6, 8);
      objects.push({
        depth: 14,
        paint: () => {
          ellipse(fx, fy, 13 * scale, 6 * scale, "#a49371");
          if (!extinct) {
            ellipse(fx, fy - 5 * scale, 5 * scale, 9 * scale, "#d58c49");
            ellipse(fx, fy - 4 * scale, 2 * scale, 6 * scale, "#efd17c");
          }
        },
      });
      hits.current = [];
      living(g).forEach((p, i) => {
        const destinations = {
          food: [8 + (i % 3), 1 + (i % 4)],
          wood: [10, 4 + (i % 3)],
          build: [5 + (i % 3) * 2, 5],
          rest: [5 + (i % 3) * 2, 4.5],
          child: [6.5 + (i % 2), 8],
        } as const;
        const [tx, ty] =
          destinations[p.activity === "dead" ? "rest" : p.activity];
        const f = reduced ? 1 : (Math.sin(time / 5000 + i * 1.7) + 1) / 2;
        const x = 6 + (tx - 6) * f + (i % 3) * 0.18,
          y = 7 + (ty - 7) * f + (i % 4) * 0.17,
          [px, py] = iso(x, y),
          s = scale * (p.age < 64 ? 0.7 : 1);
        hits.current.push({ id: p.id, x: px, y: py - 9 * s });
        objects.push({
          depth: x + y + 0.1,
          paint: () => {
            if (selection.current === p.id) {
              ctx.strokeStyle = "#f9f1ce";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(px, py, 9 * s, 5 * s, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            ellipse(px, py + 1 * s, 5 * s, 2 * s, "#4c604d44");
            ctx.fillStyle = COLORS[p.color];
            ctx.fillRect(px - 3 * s, py - 11 * s, 6 * s, 9 * s);
            ellipse(px, py - 14 * s, 3.8 * s, 4 * s, "#dfb58a");
            ctx.fillStyle = "#594b3b";
            ctx.fillRect(px - 3 * s, py - 18 * s, 6 * s, 2 * s);
            if (p.hunger >= 40) {
              ellipse(px + 7 * s, py - 18 * s, 3 * s, 3 * s, "#b4493a");
            }
          },
        });
      });
      objects.sort((a, b) => a.depth - b.depth).forEach((o) => o.paint());
      // Drifting seeds are decorative and disabled for reduced motion.
      if (!reduced && !extinct)
        for (let i = 0; i < 8; i++) {
          const px = (time / 75 + i * 93) % w,
            py = h * 0.3 + Math.sin(i * 5 + time / 3000) * h * 0.14;
          ellipse(px, py, 1.5, 1.5, "#ffffedaa");
        }
    };
    const animate = (time: number) => {
      const elapsed = time - last,
        interval = 1000 / 30;
      if (elapsed >= interval) {
        if (!document.hidden) draw(time);
        last = time - (elapsed % interval);
      }
      frame = requestAnimationFrame(animate);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);
  return (
    <canvas
      ref={ref}
      className="world-canvas"
      aria-label="Diorama da comunidade. Consulte as mesmas informações no painel Comunidade."
      role="img"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left,
          y = e.clientY - rect.top;
        const hit = hits.current
          .map((p) => ({ ...p, d: Math.hypot(p.x - x, p.y - y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (hit && hit.d < 25) onSelect(hit.id);
      }}
    />
  );
}
