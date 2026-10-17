import { useEffect, useRef, useState } from "react";
import { type Game, living } from "./simulation/model";
import {
  type WorldAction,
  worldActionInfo,
  GROVE_STAGES,
  GROVE_SITES,
  groveCanAdvance,
} from "./simulation/world";
export type Place = "observatory" | "port" | "memorial" | "grove" | "discovery";
export const PLACES = {
  observatory: { name: "Observatório", icon: "⚙", x: 139, y: 130 },
  port: { name: "Porto", icon: "⚓", x: 119, y: 267 },
  memorial: { name: "Memorial", icon: "▤", x: 390, y: 91 },
} as const;
function Act({
  game,
  action,
  children,
  enabled,
  onAction,
}: {
  game: Game;
  action: WorldAction;
  children: React.ReactNode;
  enabled: boolean;
  onAction: (a: WorldAction) => void;
}) {
  const info = worldActionInfo(game, action);
  return (
    <div className="place-action">
      <button
        className="primary"
        disabled={!enabled || !info.ok}
        onClick={() => onAction(action)}
      >
        {children}
      </button>
      <small>
        {info.food ? `${info.food} de alimento` : ""}
        {info.food && info.wood ? " · " : ""}
        {info.wood ? `${info.wood} de madeira` : ""} · avança uma estação
      </small>
      {enabled && !info.ok && <small>{info.reason}</small>}
    </div>
  );
}
export function PlaceSheet({
  place,
  game,
  enabled,
  onClose,
  onAction,
  onPlace,
  onSite,
  site,
  onAdvance,
}: {
  place: Place;
  game: Game;
  enabled: boolean;
  onClose: () => void;
  onAction: (a: WorldAction) => void;
  onPlace: (p: Place) => void;
  onSite: (s: "river" | "village") => void;
  site: "river" | "village" | null;
  onAdvance?: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null),
    [details, setDetails] = useState(false);
  useEffect(() => {
    title.current?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [place, onClose]);
  const grove = game.world.grove,
    discovery = game.world.discovery,
    heading =
      place === "grove"
        ? "Um bosque para o futuro"
        : place === "discovery"
          ? "A luz entre as raízes"
          : PLACES[place].name;
  const events = game.history.filter((e) =>
    place === "observatory"
      ? e.type === "discovery"
      : place === "port"
        ? e.evidence.project === "voyage" || e.evidence.worldAction === "voyage"
        : e.type === "foundation" ||
          e.type === "death" ||
          e.evidence.worldAction === "commemorate",
  );
  return (
    <section className="place-sheet" aria-label="Detalhes do lugar">
      <div className="place-heading">
        <div>
          <p className="eyebrow">UM LUGAR, MUITAS HISTÓRIAS</p>
          <h3 ref={title} tabIndex={-1}>
            {heading}
          </h3>
        </div>
        <button onClick={onClose} aria-label="Fechar lugar">
          ×
        </button>
      </div>
      {!enabled && (
        <p className="muted">
          Funde ou continue uma partida para realizar ações.
        </p>
      )}
      {place === "observatory" && (
        <>
          <p>
            Aqui a comunidade observa o céu e os fenômenos do vale.
            Conhecimento: <strong>{game.destiny.scores.knowledge}/100</strong>.
          </p>
          {discovery.appearedAt !== null ? (
            <button className="place-link" onClick={() => onPlace("discovery")}>
              {discovery.resolvedAt === null
                ? "Investigar o sinal do bosque"
                : "Revisitar a descoberta do bosque"}{" "}
              →
            </button>
          ) : (
            <p className="muted">
              Um bosque cuidado pode revelar algo que os instrumentos ainda não
              conseguem explicar.
            </p>
          )}
          <button className="place-link" onClick={() => onPlace("grove")}>
            {grove
              ? "Acompanhar o bosque experimental"
              : "Planejar um bosque experimental"}{" "}
            →
          </button>
        </>
      )}
      {place === "port" && (
        <>
          <p>
            Uma viagem de troca liga o vale a viajantes. Envie 120 de alimento e
            receba 90 de madeira após duas estações; exploração +6 no retorno.
          </p>
          {!game.world.voyage ? (
            <Act
              game={game}
              action="voyage"
              enabled={enabled}
              onAction={onAction}
            >
              Enviar provisões com os viajantes
            </Act>
          ) : (
            <p className="place-status" role="status">
              {game.world.voyage.returnedAt !== null
                ? `O barco voltou na estação ${game.world.voyage.returnedAt}. O acordo foi cumprido.`
                : game.status === "ended"
                  ? "A viagem não retornou antes do fim da história."
                  : `Viagem em andamento · retorno em ${Math.max(0, game.world.voyage.startedAt + 2 - game.cycle)} estações.`}
            </p>
          )}
          {game.world.voyage && game.world.voyage.returnedAt === null && (
            <button
              className="place-link"
              disabled={!enabled || game.status !== "running"}
              onClick={onAdvance}
            >
              Acompanhar próxima estação
            </button>
          )}
          <button className="place-link" onClick={() => onPlace("grove")}>
            Conhecer o projeto do bosque →
          </button>
        </>
      )}
      {place === "memorial" && (
        <>
          <p>
            A fundação e as despedidas têm um lugar na paisagem. A comunidade
            recebeu {game.metrics.births} novas vidas e se despediu de{" "}
            {game.metrics.deaths} pessoas.
          </p>
          <div className="memorial-names">
            {game.inhabitants
              .filter((p) => !p.alive)
              .slice(-6)
              .map((p) => (
                <span key={p.id}>
                  ◇ {p.name} · estação {p.diedAt}
                </span>
              ))}
            {game.metrics.deaths === 0 && (
              <span>
                ✧ Os doze fundadores ainda são lembrados pela primeira fogueira.
              </span>
            )}
          </div>
          {game.world.commemoratedAt === null ? (
            <>
              <p>
                Uma celebração reúne as histórias da fundação. Confiança +6 ·
                memória +6.
              </p>
              <Act
                game={game}
                action="commemorate"
                enabled={enabled}
                onAction={onAction}
              >
                Celebrar a fundação
              </Act>
            </>
          ) : (
            <p className="place-status">
              A fundação foi celebrada na estação {game.world.commemoratedAt}.
            </p>
          )}
        </>
      )}
      {place === "grove" && (
        <>
          {grove ? (
            <>
              <p>
                <strong>{GROVE_SITES[grove.site].name}</strong> ·{" "}
                {GROVE_STAGES[grove.progress]}
              </p>
              <ol className="project-stages">
                {GROVE_STAGES.map((s, i) => (
                  <li
                    key={s}
                    aria-current={i === grove.progress ? "step" : undefined}
                    className={i <= grove.progress ? "reached" : ""}
                  >
                    <span>{i < grove.progress ? "✓" : i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {grove.progress < 3 ? (
                <>
                  <p>
                    O bosque avança uma etapa por estação quando há alimento
                    reservado para mais uma estação e pelo menos um adulto
                    saudável com energia. Os participantes ajudam após as
                    tarefas básicas e gastam 4 de energia.
                  </p>
                  <button
                    className="place-link"
                    disabled={!enabled || game.status !== "running"}
                    onClick={onAdvance}
                  >
                    Acompanhar próxima estação
                  </button>
                  <p className="place-status">
                    {game.status === "ended"
                      ? "A obra foi interrompida pelo fim desta história."
                      : groveCanAdvance(game)
                        ? "A comunidade tem condições de continuar a obra."
                        : "A obra aguarda alimento ou pessoas em condições de ajudar."}
                  </p>
                  {grove.workers.length > 0 && (
                    <p>
                      Última equipe:{" "}
                      {grove.workers
                        .map(
                          (id) =>
                            game.inhabitants.find((p) => p.id === id)?.name,
                        )
                        .join(" e ")}
                      .
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="place-status">
                    O bosque cresceu. Natureza +12 ·{" "}
                    {GROVE_SITES[grove.site].benefit}.
                  </p>
                  {discovery.appearedAt !== null ? (
                    <button
                      className="place-link"
                      onClick={() => onPlace("discovery")}
                    >
                      Examinar a luz entre as raízes →
                    </button>
                  ) : (
                    <div>
                      <p>Os habitantes continuam observando o novo bosque.</p>
                      <button
                        className="place-link"
                        disabled={!enabled || game.status !== "running"}
                        onClick={onAdvance}
                      >
                        Observar o bosque por uma estação
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p>
                Escolha onde plantar. Marcação, preparação, mudas e inauguração
                serão visíveis no mapa.
              </p>
              <div className="grove-sites">
                {(["river", "village"] as const).map((key) => (
                  <button
                    key={key}
                    aria-pressed={site === key}
                    onClick={() => onSite(key)}
                  >
                    <strong>{GROVE_SITES[key].name}</strong>
                    <small>
                      {GROVE_SITES[key].benefit} · natureza +12 ao concluir
                    </small>
                  </button>
                ))}
              </div>
              {site && (
                <Act
                  game={game}
                  action={`grove:${site}`}
                  enabled={enabled}
                  onAction={onAction}
                >
                  Começar o bosque: {GROVE_SITES[site].name}
                </Act>
              )}
            </>
          )}
        </>
      )}
      {place === "discovery" && (
        <>
          {discovery.appearedAt === null ? (
            <p>
              O vale ainda não revelou esse fenômeno. Acompanhe o crescimento do
              bosque.
            </p>
          ) : discovery.resolvedAt === null ? (
            <>
              <p>
                Os habitantes perceberam pulsos de luz entre as raízes. O sinal
                surgiu depois que o bosque cresceu; sua origem continua
                desconhecida.
              </p>
              <div className="discovery-options">
                <article>
                  <h4>Estudar os pulsos</h4>
                  <p>
                    Instalar instrumentos entre as raízes. Conhecimento +8 ·
                    consciência +4 · floresta −3.
                  </p>
                  <Act
                    game={game}
                    action="discovery:study"
                    enabled={enabled}
                    onAction={onAction}
                  >
                    Investigar com instrumentos
                  </Act>
                </article>
                <article>
                  <h4>Proteger o mistério</h4>
                  <p>
                    Preservar o local e registrar seus sinais. Natureza +6 ·
                    memória +6 · floresta +3 · confiança +3.
                  </p>
                  <Act
                    game={game}
                    action="discovery:protect"
                    enabled={enabled}
                    onAction={onAction}
                  >
                    Preservar as raízes luminosas
                  </Act>
                </article>
              </div>
            </>
          ) : (
            <p className="place-status">
              {discovery.choice === "study"
                ? "Os instrumentos continuam registrando os pulsos. A pesquisa deixou marcas e novas perguntas."
                : "Lanternas protegem a árvore. As gerações seguintes poderão escutar seus sinais."}{" "}
              Decisão tomada na estação {discovery.resolvedAt}.
            </p>
          )}
        </>
      )}
      {events.length > 0 && !["grove", "discovery"].includes(place) && (
        <>
          <button
            className="place-link"
            aria-expanded={details}
            onClick={() => setDetails((v) => !v)}
          >
            {details ? "Recolher" : "Ver"} histórias deste lugar
          </button>
          {details && (
            <div className="place-history">
              {events
                .slice(-4)
                .reverse()
                .map((e) => (
                  <article key={e.id}>
                    <small>Estação {e.cycle}</small>
                    <strong>{e.title}</strong>
                    <p>{e.text}</p>
                  </article>
                ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
