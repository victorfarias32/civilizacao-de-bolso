import type { CSSProperties } from "react";
import {
  PATH_STYLE,
  optionPaths,
  changedPaths,
  DISTRICTS,
  visualStage,
} from "./influences";
import { decisionById } from "../simulation/destinies";
import { mixedPaths, PATH_INFO, destination } from "../simulation/destinies";
import { useEffect, useRef, useState } from "react";
import type { Game } from "../simulation/model";
import { appearance } from "./appearance";
import { createScene, drawFrame, WIDTH, HEIGHT, type Hit } from "./pixelWorld";

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
  const canvasRef = useRef<HTMLCanvasElement>(null),
    latest = useRef(game),
    selection = useRef(selected),
    hits = useRef<Hit[]>([]);
  latest.current = game;
  selection.current = selected;
  const lastChoice = game.destiny.resolved.at(-1),
    lastDecision = decisionById(lastChoice?.id || null),
    chosenOption = lastDecision?.options.find(
      (o) => o.id === lastChoice?.option,
    ),
    choicePaths = chosenOption ? optionPaths(chosenOption) : [],
    main = choicePaths[0],
    showChoice =
      !!lastChoice &&
      game.cycle - lastChoice.cycle <= 1 &&
      game.status !== "ended";
  const art = appearance(game),
    [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current!,
      ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let frame = 0,
      last = 0,
      currentGame = latest.current,
      scene = createScene(currentGame);
    const render = (time: number) => {
      const elapsed = time - last,
        interval = 1000 / 30;
      if (elapsed >= interval) {
        if (currentGame !== latest.current) {
          currentGame = latest.current;
          scene = createScene(currentGame);
        }
        if (!document.hidden)
          hits.current = drawFrame(
            ctx,
            scene,
            currentGame,
            time,
            reduced,
            selection.current,
          );
        last = time - (elapsed % interval);
      }
      frame = requestAnimationFrame(render);
    };
    hits.current = drawFrame(
      ctx,
      scene,
      currentGame,
      0,
      reduced,
      selection.current,
    );
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);
  return (
    <div
      className={`pixel-world season-${art.season} ${art.extinct ? "world-extinct" : ""} ${art.legacy ? "world-legacy" : ""} ${zoomed ? "is-zoomed" : ""}`}
      data-paths={mixedPaths(game).join(",")}
      data-territories={changedPaths(game).join(",")}
      data-ending={game.ending || "none"}
      data-season={art.season}
      data-visual-events={art.cues.map((c) => c.type).join(",")}
    >
      <div className="world-toolbar">
        <span>ATLAS DA COMUNIDADE</span>
        <button
          type="button"
          aria-pressed={zoomed}
          onClick={() => setZoomed((v) => !v)}
        >
          {zoomed ? "− Visão completa" : "+ Ampliar mundo"}
        </button>
      </div>
      {showChoice && chosenOption && (
        <div
          className="world-choice-result"
          role="status"
          style={
            {
              "--path-color": PATH_STYLE[main].color,
              "--path-ink": PATH_STYLE[main].ink,
            } as CSSProperties
          }
        >
          <strong>
            {PATH_STYLE[main].icon} {chosenOption.title}
          </strong>
          <span className="choice-gains">
            {choicePaths.map((k) => (
              <span
                key={k}
                className="influence-chip"
                style={{
                  background: PATH_STYLE[k].tint,
                  color: PATH_STYLE[k].ink,
                  borderColor: PATH_STYLE[k].color,
                }}
              >
                {PATH_INFO[k].name} {game.destiny.scores[k]}/100
              </span>
            ))}
            <span>O vale mudou · {visualStage(game.destiny.scores[main])}</span>
          </span>
        </div>
      )}
      <div className="pixel-viewport">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="world-canvas"
          role="img"
          aria-label={`Mundo em pixel art: ${art.palette.name}. ${art.palette.mood}. ${art.cues.map((c) => c.detail).join(" ")} Bairros: ${changedPaths(
            game,
          )
            .map(
              (k) =>
                `${PATH_INFO[k].name}, ${visualStage(game.destiny.scores[k])}`,
            )
            .join("; ")}. Consulte pessoas e recursos nos painéis.`}
          onClick={(e) => {
            const b = e.currentTarget.getBoundingClientRect(),
              x = ((e.clientX - b.left) * WIDTH) / b.width,
              y = ((e.clientY - b.top) * HEIGHT) / b.height;
            const hit = hits.current
              .map((h) => ({ ...h, d: Math.hypot(h.x - x, h.y - y) }))
              .sort((a, b) => a.d - b.d)[0];
            if (hit && hit.d < Math.max(16, (22 * WIDTH) / b.width))
              onSelect(hit.id);
          }}
        />
        {showChoice && !reduced && (
          <span
            key={`${lastChoice!.id}-${lastChoice!.cycle}`}
            className="map-choice-burst"
            aria-hidden="true"
            style={
              {
                left: `${(DISTRICTS[main].x / 480) * (zoomed ? 200 : 100)}%`,
                top: `${(DISTRICTS[main].y / 320) * (zoomed ? 200 : 100)}%`,
                "--burst-color": PATH_STYLE[main].color,
              } as CSSProperties
            }
          />
        )}
        <div className="season-plaque">
          <span>
            {game.ending && !["legacy", "extinction"].includes(game.ending)
              ? destination(game.ending).title.toLocaleUpperCase("pt-BR")
              : art.extinct
                ? "O ÚLTIMO SILÊNCIO"
                : art.legacy
                  ? "A NOITE DO LEGADO"
                  : art.palette.name.toLocaleUpperCase("pt-BR")}
          </span>
          <small>
            {game.ending && !["legacy", "extinction"].includes(game.ending)
              ? "UMA HISTÓRIA · MUITOS CAMINHOS"
              : art.extinct
                ? "O MUNDO GUARDA SEUS VESTÍGIOS"
                : art.legacy
                  ? "40 ANOS · LUZES PARA QUEM FICOU"
                  : art.palette.mood}
          </small>
        </div>
        {art.drought && <span className="world-weather">ESTIAGEM</span>}
      </div>
      {changedPaths(game).length > 0 && (
        <div
          className="world-influences"
          aria-label="Influências visíveis no mapa"
        >
          {changedPaths(game).map((k) => (
            <span
              key={k}
              className="influence-chip"
              title={`${PATH_INFO[k].name}: ${visualStage(game.destiny.scores[k])}`}
              style={{
                background: PATH_STYLE[k].tint,
                color: PATH_STYLE[k].ink,
                borderColor: PATH_STYLE[k].color,
              }}
            >
              <span aria-hidden="true">{PATH_STYLE[k].icon}</span>{" "}
              {PATH_INFO[k].name} {game.destiny.scores[k]}
            </span>
          ))}
        </div>
      )}
      {art.cues.length > 0 && (
        <div className="world-signs" aria-label="Vestígios visíveis no mundo">
          {art.cues.slice(0, 3).map((c) => (
            <span key={c.id} title={c.detail} data-event={c.type}>
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
