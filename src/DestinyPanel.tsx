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
        O CONSELHO PEDE SUA VOZ · SIMULAÇÃO PAUSADA AO CHEGAR
      </p>
      <h2>{d.title}</h2>
      <p>{d.body}</p>
      <div className="council-options">
        {d.options.map((o) => (
          <button
            key={o.id}
            disabled={!canAfford(game, o)}
            onClick={() => onChoose(`${d.id}/${o.id}`)}
          >
            <strong>{o.title}</strong>
            <span>{o.consequence}</span>
            <small>
              {Object.entries(o.paths)
                .map(([k, n]) => `${PATH_INFO[k as PathKey].name} +${n}`)
                .join(" · ")}
            </small>
            <small>
              {consequenceText(o)}
              {!canAfford(game, o) && " · Recursos insuficientes"}
            </small>
          </button>
        ))}
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
              style={{ accentColor: p.color }}
            />
          </label>
          <small>{p.scene}</small>
        </div>
      ))}
      <p>
        12: primeiros projetos · 24: expansão · 48: transformação. Combinar
        influências conserva os projetos anteriores.
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
