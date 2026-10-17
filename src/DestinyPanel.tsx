import type { CSSProperties } from "react";
import {
  PATH_STYLE,
  optionPaths,
  visualStage,
  influenceGain,
} from "./rendering/influences";
import type { Game, PathKey } from "./simulation/model";
import {
  PATH_INFO,
  DESTINATIONS,
  decisionById,
  canAfford,
  consequenceText,
  destinationChecks,
  mixedPaths,
} from "./simulation/destinies";
export function Council({
  game,
  onChoose,
}: {
  game: Game;
  onChoose: (value: string) => void;
}) {
  const d = decisionById(game.destiny.pending);
  if (!d) return null;
  return (
    <section className="council" aria-label="Conselho da comunidade">
      <p className="eyebrow">
        O CONSELHO SE REUNIU · QUE RUMO VAMOS SEGUIR?
      </p>
      <h2>{d.title}</h2>
      <p>{d.body}</p>
      <div className="council-options">
        {d.options.map((o) => {
          const paths = optionPaths(o, game),
            main = paths[0],
            style = PATH_STYLE[main],
            before = game.destiny.scores[main],
            after = Math.min(100, before + (o.paths[main] || 0)),
            gain = influenceGain(game, o, main),
            leaders = paths.filter((k) => influenceGain(game, o, k) === gain);
          return (
            <button
              key={o.id}
              className="choice-card"
              data-path={main}
              data-mixed={leaders.length > 1}
              style={
                {
                  "--path-color": style.color,
                  "--path-ink": style.ink,
                  "--path-tint": style.tint,
                } as CSSProperties
              }
              disabled={!canAfford(game, o)}
              onClick={() => onChoose(`${d.id}/${o.id}`)}
            >
              <span className="choice-color-rail" aria-hidden="true">
                {leaders.map((k) => (
                  <i key={k} style={{ background: PATH_STYLE[k].color }} />
                ))}
              </span>
              <span className="choice-heading">
                <span className="choice-symbol" aria-hidden="true">
                  {style.icon}
                </span>
                <span>
                  <span className="choice-category">
                    {leaders.map((k) => PATH_INFO[k].name).join(" + ")} +{gain}{" "}
                    ·{" "}
                    {leaders.length > 1
                      ? "caminhos em equilíbrio"
                      : "influência principal"}
                  </span>
                  <strong>{o.title}</strong>
                </span>
              </span>
              <span>{o.consequence}</span>
              <span className="choice-gains">
                {paths.map((k) => (
                  <span
                    className="influence-chip"
                    key={k}
                    style={{
                      background: PATH_STYLE[k].tint,
                      color: PATH_STYLE[k].ink,
                      borderColor: PATH_STYLE[k].color,
                    }}
                  >
                    <span aria-hidden="true">{PATH_STYLE[k].icon}</span>{" "}
                    {PATH_INFO[k].name} +{influenceGain(game, o, k)}
                    {influenceGain(game, o, k) === 0 ? " · máximo" : ""}
                  </span>
                ))}
              </span>
              <span className="choice-preview">
                <span aria-hidden="true">▦</span>
                <span>
                  <b>No mundo: {visualStage(after)}</b>
                  <small>{style.change}</small>
                  <span className="choice-meter" aria-hidden="true">
                    <i style={{ width: `${before}%` }} />
                    <i
                      className="choice-meter-gain"
                      style={{
                        left: `${before}%`,
                        width: `${after - before}%`,
                      }}
                    />
                  </span>
                  <small>
                    {before} → {after}/100
                  </small>
                </span>
              </span>
              <small className="choice-cost">
                {consequenceText(o)}
                {!canAfford(game, o) && " · Recursos insuficientes"}
              </small>
            </button>
          );
        })}
      </div>
      <small>
        Você pode adiar: avance as estações ou retome a observação. Nenhuma
        opção será escolhida automaticamente. Escolher também avança uma
        estação.
      </small>
    </section>
  );
}
export function DestinyPanel({
  game,
  onEnd,
}: {
  game: Game;
  onEnd: (id: string) => void;
}) {
  const paths = mixedPaths(game);
  return (
    <div className="destiny-panel">
      <p>
        Seis influências podem coexistir. Cada escolha altera recursos, relações
        e projetos visíveis. A partir de 28 anos, um destino preparado pode
        encerrar a partida; aos 40, o caminho pronto mais forte define o final.
        O horizonte impossível tem prioridade se estiver preparado.
      </p>
      <p>
        <strong>Paisagem atual:</strong>{" "}
        {paths.length
          ? paths.map((k) => PATH_INFO[k].name).join(" + ")
          : "Ainda em formação"}
      </p>
      {Object.entries(PATH_INFO).map(([key, p]) => (
        <div className="path-progress" key={key}>
          <label>
            {p.name} · {game.destiny.scores[key as PathKey]}/100
            <progress
              max={100}
              value={game.destiny.scores[key as PathKey]}
              style={{ accentColor: PATH_STYLE[key as PathKey].color }}
            />
          </label>
          <small>{p.scene}</small>
        </div>
      ))}
      <p>
        Toda influência deixa vestígios · 12: bairro · 24: expansão · 48:
        monumento · 72: paisagem extraordinária. Combinar influências conserva
        os projetos anteriores.
      </p>
      {DESTINATIONS.map((d) => {
        const special = !["legacy", "extinction"].includes(d.id),
          checks = special ? destinationChecks(game, d.id) : [],
          ready = special && checks.every((c) => c.ok);
        return (
          <article
            className={`destination-card ${game.ending === d.id ? "chosen" : ""}`}
            key={d.id}
          >
            <h3>
              {d.title}
              {game.ending === d.id ? " · Seu destino" : ""}
            </h3>
            <p>{d.short}</p>
            {special ? (
              <ul>
                {checks.map((c) => (
                  <li key={c.label}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {d.id === "legacy"
                  ? "Aos 40 anos, se nenhum destino extraordinário estiver pronto."
                  : "Quando não restar nenhum habitante vivo."}
              </p>
            )}
            {ready && game.status === "running" && (
              <button className="primary" onClick={() => onEnd(d.id)}>
                Concluir a história: {d.title}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
