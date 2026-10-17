import { Council, DestinyPanel } from "./DestinyPanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  createGame,
  advanceSeason,
  deriveSummary,
  epilogue,
} from "./simulation/engine";
import {
  type Game,
  type Command,
  type Policies,
  type PolicyKey,
  type HistoryEvent,
  living,
  SEASONS,
  POLICY_LABELS,
} from "./simulation/model";
import {
  exportGame,
  loadGame,
  saveGame,
  parseSave,
  MAX_BYTES,
} from "./persistence/storage";
import { World } from "./rendering/World";

type Panel = "chronicle" | "people" | "policies" | "settings" | "destiny";
const POLICY_HELP = {
  work: {
    title: "Ritmo de trabalho",
    moderate: "Produção constante, com mais tempo para recuperar as forças.",
    intensive:
      "Mais produção agora. A energia cai mais rápido e o descanso se torna necessário.",
  },
  distribution: {
    title: "Partilha de alimento",
    equal:
      "As porções seguem as necessidades, independentemente de quem produziu.",
    contribution:
      "Metade da porção é protegida. O restante favorece quem contribuiu mais.",
  },
  extraction: {
    title: "Relação com a terra",
    careful: "A floresta e a fertilidade têm mais tempo para se recuperar.",
    accelerated:
      "Mais alimento e madeira no curto prazo, com desgaste da terra.",
  },
} as const;
const ACTIVITY = {
  food: "Coletando alimento",
  wood: "Buscando madeira",
  build: "Cuidando dos abrigos",
  rest: "Descansando",
  child: "Crescendo",
  dead: "Na memória",
};
const TRAIT = {
  cooperative: "Cooperativo",
  cautious: "Cauteloso",
  ambitious: "Ambicioso",
};
const TRADITION = {
  reserves: "Guardiões das reservas",
  shelter: "Memória do abrigo",
};
const EVENT_ICON: Record<HistoryEvent["type"], string> = {
  project: "❀",
  decision: "⚑",
  discovery: "✷",
  foundation: "✧",
  policy: "⚑",
  scarcity: "!",
  recovery: "✦",
  death: "◇",
  birth: "✷",
  building: "⌂",
  repair: "⌂",
  drought: "☀",
  disease: "!",
  cooperation: "✦",
  tradition: "❋",
  era: "◈",
  ending: "✧",
};
const format = (n: number) => n.toLocaleString("pt-BR");

function App() {
  const [preview] = useState(() => createGame()),
    [game, setGame] = useState<Game | null>(null),
    gameRef = useRef<Game | null>(null);
  const [saved, setSaved] = useState<Game | null>(null),
    [loading, setLoading] = useState(true),
    [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState<Panel>("chronicle"),
    [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<Partial<Policies>>({}),
    pendingRef = useRef<Partial<Policies>>({});
  const [name, setName] = useState(""),
    [seed, setSeed] = useState("42"),
    [newForm, setNewForm] = useState(false);
  const [message, setMessage] = useState(""),
    [saveStatus, setSaveStatus] = useState(""),
    [filter, setFilter] = useState("all");
  const [reduced, setReduced] = useState(() => {
    try {
      return (
        localStorage.getItem("reduced-motion") === "true" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch {
      return false;
    }
  });
  const fileRef = useRef<HTMLInputElement>(null),
    panelTitle = useRef<HTMLHeadingElement>(null);
  const [showEnding, setShowEnding] = useState(true);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setMessage(
        "A instalação offline não está disponível agora. Você pode continuar jogando.",
      ),
  });
  const current = game || preview,
    summary = deriveSummary(current),
    end = game?.status === "ended" ? epilogue(game) : null;
  const displayYear = summary.year;
  const installGame = useCallback((next: Game) => {
    gameRef.current = next;
    setGame(next);
    setPending({});
    pendingRef.current = {};
    setRunning(false);
    setShowEnding(true);
  }, []);
  useEffect(() => {
    loadGame()
      .then(({ game: stored, recovered }) => {
        setSaved(stored);
        if (recovered)
          setMessage("A cópia anterior da sua história foi recuperada.");
      })
      .catch(() =>
        setMessage(
          "O salvamento local está indisponível. Exporte sua história para guardá-la.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!game) return;
    let currentEffect = true;
    setSaveStatus("Guardando…");
    saveGame(game)
      .then(() => {
        setSaved(game);
        if (currentEffect) setSaveStatus("História salva neste aparelho");
      })
      .catch(() => {
        if (currentEffect) {
          setSaveStatus("Não foi possível salvar");
          setMessage(
            "O armazenamento falhou. Sua partida continua em memória; exporte uma cópia pelo menu Partida.",
          );
        }
      });
    return () => {
      currentEffect = false;
    };
  }, [game]);
  const executeStep = useCallback(
    (extra?: { key: "decision" | "destination" | "world"; value: string }) => {
      const g = gameRef.current;
      if (!g || g.status === "ended") return;
      const entries = Object.entries(pendingRef.current) as [
        PolicyKey,
        string,
      ][];
      const nextId = Math.max(0, ...g.commandLog.map((c) => c.id)) + 1;
      const commands: Command[] = entries.map(([key, value], i) => ({
        id: nextId + i,
        sequence: i,
        targetCycle: g.cycle + 1,
        key,
        value,
      }));
      if (extra)
        commands.push({
          ...extra,
          id: nextId + entries.length,
          sequence: entries.length,
          targetCycle: g.cycle + 1,
        });
      const next = advanceSeason(g, commands).state;
      if (next.destiny.pending && next.destiny.pending !== g.destiny.pending)
        setRunning(false);
      if (!g.world.discovery.appearedAt && next.world.discovery.appearedAt) {
        setRunning(false);
        setMessage(
          "Uma luz surgiu no bosque. Toque no sinal do mapa para investigar.",
        );
      }
      pendingRef.current = {};
      setPending({});
      gameRef.current = next;
      setGame(next);
      if (next.status === "ended") {
        setRunning(false);
        setShowEnding(true);
      }
    },
    [],
  );
  const step = useCallback(() => executeStep(), [executeStep]);
  useEffect(() => {
    if (!running || !game || game.status === "ended") return;
    const id = window.setInterval(step, 10000 / speed);
    return () => clearInterval(id);
  }, [running, speed, step, game?.status, !!game]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  const choosePolicy = (key: PolicyKey, value: string) => {
    const g = gameRef.current;
    if (!g || g.status === "ended") return;
    const next = { ...pendingRef.current, [key]: value } as Partial<Policies>;
    if (value === g.policies[key]) delete next[key];
    pendingRef.current = next;
    setPending(next);
  };
  const openPanel = (p: Panel) => {
    setPanel(p);
    requestAnimationFrame(() =>
      panelTitle.current?.focus({ preventScroll: true }),
    );
  };
  const startNew = (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(false);
    if (
      (game || saved) &&
      !window.confirm(
        "Fundar uma nova civilização substituirá o salvamento atual. Exporte sua história antes, se quiser guardá-la. Continuar?",
      )
    )
      return;
    const n = Number(seed);
    if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
      setMessage("Escolha uma semente inteira entre 0 e 4294967295.");
      return;
    }
    installGame(createGame({ name, seed: n }));
    setNewForm(false);
    setPanel("chronicle");
    setMessage(
      "Sua história começou. Observe, escolha as regras e avance uma estação.",
    );
  };
  const importFile = async (file: File) => {
    setRunning(false);
    if (file.size > MAX_BYTES) {
      setMessage("O arquivo excede 5 MiB. A partida atual foi preservada.");
      return;
    }
    const result = parseSave(await file.text());
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    if (
      (game || saved) &&
      !window.confirm(
        "Substituir o salvamento atual pela civilização importada?",
      )
    )
      return;
    installGame(result.game);
    setNewForm(false);
    setMessage("História importada. A partida está pausada.");
  };
  const toggleMotion = (v: boolean) => {
    setReduced(v);
    try {
      localStorage.setItem("reduced-motion", String(v));
    } catch {
      /* setting stays in memory */
    }
  };
  const newCivilizationForm = (
    <form onSubmit={startNew} className="founding-form">
      <label>
        Nome da comunidade
        <input
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vale das Pequenas Luzes"
        />
      </label>
      <label className="seed-input">
        Semente do mundo
        <input
          type="number"
          min="0"
          max="4294967295"
          step="1"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          required
        />
      </label>
      <button className="primary" type="submit">
        Fundar civilização <span aria-hidden="true">↗</span>
      </button>
      {game && (
        <button type="button" onClick={() => setNewForm(false)}>
          Voltar à minha história
        </button>
      )}
    </form>
  );
  const person = current.inhabitants.find((p) => p.id === selected);
  return (
    <div className="app">
      <header className="masthead">
        <a
          className="brand"
          href="#main"
          aria-label="Civilização de Bolso, ir ao conteúdo"
        >
          <span className="brand-mark" aria-hidden="true">
            ◈
          </span>
          <span>
            Civilização <em>de Bolso</em>
          </span>
        </a>
        <div className="masthead-note">
          PEQUENOS MUNDOS.
          <br />
          GRANDES HISTÓRIAS.
        </div>
      </header>
      <main id="main">
        {!game || newForm ? (
          <section className="intro">
            <div>
              <p className="eyebrow">UM EXPERIMENTO SOBRE VIVER JUNTOS</p>
              <h1>
                Todo grande destino
                <br />
                começa <em>pequeno.</em>
              </h1>
              <p className="intro-text">
                Doze pessoas. Um pedaço de terra. As regras que você escolher —
                e a história que elas vão deixar.
              </p>
              <p className="scenario-note">
                A primeira geração · até 40 anos · sem conexão obrigatória
              </p>
            </div>
            <div className="start-card">
              <h2>Um mundo espera por você</h2>
              {loading ? (
                <p>Procurando sua história…</p>
              ) : (
                <>
                  {!game && saved && (
                    <button
                      className="continue"
                      onClick={() => {
                        installGame(saved);
                        setNewForm(false);
                      }}
                    >
                      Continuar {saved.name} <span>↗</span>
                    </button>
                  )}
                  {newCivilizationForm}
                  <button
                    className="text-button"
                    onClick={() => fileRef.current?.click()}
                  >
                    Importar uma história em JSON
                  </button>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="game-heading">
            <div>
              <p className="eyebrow">
                {current.era === "community"
                  ? "UMA COMUNIDADE FLORESCE"
                  : "OS PRIMEIROS PASSOS"}
              </p>
              <h1>{current.name}</h1>
            </div>
            <div className="era-badge">
              <span className="status-dot" />
              {current.status === "ended"
                ? "História encerrada"
                : current.era === "community"
                  ? "Era da comunidade"
                  : "Era da sobrevivência"}
            </div>
          </section>
        )}
        <div
          role="status"
          aria-live="polite"
          className={`notice ${message ? "" : "empty"}`}
        >
          {message && (
            <>
              <span>{message}</span>
              <button aria-label="Fechar aviso" onClick={() => setMessage("")}>
                ×
              </button>
            </>
          )}
        </div>
        {needRefresh && (
          <div className="update notice">
            <span>Uma nova versão está pronta.</span>
            <button
              onClick={async () => {
                setRunning(false);
                try {
                  if (gameRef.current) await saveGame(gameRef.current);
                  await updateServiceWorker(true);
                } catch {
                  setMessage(
                    "Não foi possível guardar a partida para atualizar. Exporte antes de tentar novamente.",
                  );
                }
              }}
            >
              Guardar e atualizar
            </button>
          </div>
        )}
        <section className="workspace">
          <div className="world-column">
            <section className="world-card" aria-label="Mundo da civilização">
              <div className="world-top">
                <span>
                  <i className="status-dot" />{" "}
                  {game?.status === "ended"
                    ? "A memória de um mundo"
                    : game
                      ? "Seu pequeno mundo"
                      : "Um possível começo"}
                </span>
                <span>
                  {game
                    ? `Ano ${displayYear} · ${SEASONS[summary.season]}`
                    : "À margem do desconhecido"}
                </span>
              </div>
              {game && game.status === "running" && (
                <Council
                  game={game}
                  onChoose={(value) => executeStep({ key: "decision", value })}
                />
              )}
              <World
                game={current}
                interactive={!!game}
                onInspect={() => setRunning(false)}
                onAdvance={step}
                onAction={(value) => executeStep({ key: "world", value })}
                selected={selected}
                reduced={reduced}
                onSelect={(id) => {
                  setSelected(id);
                  openPanel("people");
                }}
              />
              <div className="world-caption">
                <span aria-hidden="true">✧</span>{" "}
                {game?.ending === "extinction"
                  ? "O vento ainda passa por aqui."
                  : game
                    ? "Cada pessoa tem uma história. Toque para conhecer."
                    : "O mundo é pequeno. As possibilidades, nem tanto."}
              </div>
              {game && (
                <div className="time-controls">
                  <button
                    className={running ? "" : "active"}
                    onClick={() => setRunning((v) => !v)}
                    disabled={game.status === "ended"}
                    aria-label={
                      running ? "Pausar simulação" : "Retomar simulação"
                    }
                  >
                    {running ? "Ⅱ Pausar" : "▶ Retomar"}
                  </button>
                  <button
                    disabled={running || game.status === "ended"}
                    onClick={step}
                  >
                    + Estação
                  </button>
                  <div className="speeds" aria-label="Velocidade">
                    {[1, 2, 4].map((s) => (
                      <button
                        key={s}
                        className={s === speed ? "active" : ""}
                        aria-pressed={s === speed}
                        onClick={() => setSpeed(s)}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
            <section
              className="resource-grid"
              aria-label="Recursos da comunidade"
            >
              <Resource
                icon="♟"
                label="Habitantes"
                value={String(summary.population)}
                detail={
                  game
                    ? `${current.metrics.births} novas vidas`
                    : "12 histórias possíveis"
                }
              />
              <Resource
                icon="❧"
                label="Alimento"
                value={format(current.resources.food)}
                detail={`${summary.reserve.toFixed(1)} estações em reserva`}
                warning={summary.reserve < 1}
              />
              <Resource
                icon="⌁"
                label="Madeira"
                value={format(current.resources.wood)}
                detail="Construção e cuidado"
              />
              <Resource
                icon="⌂"
                label="Abrigo"
                value={`${Math.min(summary.capacity, summary.population)}/${summary.population}`}
                detail={`${summary.capacity} vagas disponíveis`}
                warning={summary.capacity < summary.population}
              />
            </section>
            {game && (
              <section className="pulse">
                <div>
                  <span className="eyebrow">COMO ESTAMOS</span>
                  <strong>
                    {summary.hunger >= 40
                      ? "A fome pede uma resposta."
                      : summary.health < 50
                        ? "É preciso cuidar de quem ficou."
                        : current.environment.fertility < 40
                          ? "A terra também precisa descansar."
                          : summary.capacity < summary.population
                            ? "Nem todos têm um teto."
                            : "Por enquanto, a vida encontra seu ritmo."}
                  </strong>
                </div>
                <div className="pulse-gauges">
                  <Meter label="Saúde" value={summary.health} />
                  <Meter label="Confiança" value={current.confidence} />
                  <Meter
                    label="Fertilidade"
                    value={current.environment.fertility}
                  />
                </div>
              </section>
            )}
            {game && current.traditions.length > 0 && (
              <div className="traditions">
                {current.traditions.map((t) => (
                  <span key={t}>❋ {TRADITION[t]}</span>
                ))}
              </div>
            )}
            {end && showEnding && (
              <section className="ending" aria-label="Desfecho da civilização">
                <p className="eyebrow">TODA HISTÓRIA DEIXA UM VESTÍGIO</p>
                <h2>{end.title}</h2>
                <div className="ending-labels">
                  {end.labels.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                {end.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <div className="ending-actions">
                  <button
                    className="primary"
                    onClick={() => exportGame(current)}
                  >
                    Guardar história · JSON
                  </button>
                  <button
                    onClick={() => {
                      setRunning(false);
                      setNewForm(true);
                      window.scrollTo({
                        top: 0,
                        behavior: reduced ? "instant" : "smooth",
                      });
                    }}
                  >
                    Um novo começo
                  </button>
                  <button onClick={() => setShowEnding(false)}>
                    Recolher epílogo
                  </button>
                </div>
              </section>
            )}
            {end && !showEnding && (
              <button onClick={() => setShowEnding(true)}>
                Ler o epílogo novamente
              </button>
            )}
          </div>
          <aside className="journal" aria-label="Caderno da comunidade">
            <nav className="tabs" aria-label="Painéis da comunidade">
              {(
                [
                  ["chronicle", "Crônica", "✧"],
                  ["people", "Pessoas", "♟"],
                  ["policies", "Políticas", "⚑"],
                  ["destiny", "Destinos", "✷"],
                  ["settings", "Partida", "◈"],
                ] as const
              ).map(([id, label, icon]) => (
                <button
                  key={id}
                  className={panel === id ? "active" : ""}
                  aria-pressed={panel === id}
                  onClick={() => openPanel(id)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                  {id === "policies" && Object.keys(pending).length > 0 && (
                    <i className="pending-dot" />
                  )}
                </button>
              ))}
            </nav>
            <div className="journal-body">
              <div className="journal-heading">
                <p className="eyebrow">O CADERNO DA COMUNIDADE</p>
                <h2 ref={panelTitle} tabIndex={-1}>
                  {panel === "chronicle"
                    ? "Uma história em movimento"
                    : panel === "people"
                      ? "Quem faz este mundo"
                      : panel === "policies"
                        ? "As regras que nos guiam"
                        : panel === "destiny"
                          ? "O que podemos nos tornar"
                          : "Guardar e recomeçar"}
                </h2>
              </div>
              {panel === "destiny" && (
                <DestinyPanel
                  game={current}
                  onEnd={(value) => executeStep({ key: "destination", value })}
                />
              )}
              {panel === "chronicle" && (
                <>
                  {game && (
                    <label className="filter">
                      Mostrar
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">Todos os acontecimentos</option>
                        <option value="crisis">Crises e recuperação</option>
                        <option value="policy">Decisões políticas</option>
                        <option value="people">Vidas e despedidas</option>
                      </select>
                    </label>
                  )}
                  <div className="timeline">
                    {[...current.history]
                      .reverse()
                      .filter(
                        (e) =>
                          filter === "all" ||
                          (filter === "crisis" &&
                            [
                              "scarcity",
                              "recovery",
                              "drought",
                              "disease",
                            ].includes(e.type)) ||
                          (filter === "policy" && e.type === "policy") ||
                          (filter === "people" &&
                            ["birth", "death"].includes(e.type)),
                      )
                      .map((e) => (
                        <article className={`event event-${e.type}`} key={e.id}>
                          <div className="event-icon" aria-hidden="true">
                            {EVENT_ICON[e.type]}
                          </div>
                          <div>
                            <p className="event-time">
                              {e.cycle === 0
                                ? "FUNDAÇÃO"
                                : `ANO ${Math.min(40, Math.floor((e.cycle - 1) / 4) + 1)} · ${SEASONS[(e.cycle - 1) % 4].toLocaleUpperCase("pt-BR")}`}
                            </p>
                            <h3>{e.title}</h3>
                            <p>{e.text}</p>
                            {Object.keys(e.evidence).length > 0 && (
                              <details>
                                <summary>Ver os vestígios</summary>
                                <dl>
                                  {Object.entries(e.evidence).map(([k, v]) => (
                                    <div key={k}>
                                      <dt>{evidenceLabel(k)}</dt>
                                      <dd>{String(v)}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </details>
                            )}
                          </div>
                        </article>
                      ))}
                  </div>
                  <p className="journal-footnote">
                    O que fica escrito aqui aconteceu neste mundo.
                    <br />
                    Pequenas escolhas também deixam grandes vestígios.
                  </p>
                </>
              )}
              {panel === "people" && (
                <>
                  {person && (
                    <section className="person-detail">
                      <button
                        className="close-detail"
                        aria-label="Fechar ficha"
                        onClick={() => setSelected(null)}
                      >
                        ×
                      </button>
                      <p className="eyebrow">
                        {person.alive
                          ? TRAIT[person.trait]
                          : "NA MEMÓRIA DA COMUNIDADE"}
                      </p>
                      <h3>
                        {person.name}{" "}
                        <small>{Math.floor(person.age / 4)} anos</small>
                      </h3>
                      <p>
                        {ACTIVITY[person.activity]} · aptidão para{" "}
                        {person.aptitude === "gathering"
                          ? "coleta"
                          : "construção"}
                      </p>
                      <Meter label="Saúde" value={person.health} />
                      <Meter label="Energia" value={person.energy} />
                      <Meter label="Fome" value={person.hunger} danger />
                      <p>{person.reason}</p>
                      <p>
                        {person.sheltered ? "⌂ Possui abrigo" : "⌂ Sem abrigo"}{" "}
                        · recebeu {person.received}/{person.age < 64 ? 60 : 100}{" "}
                        de alimento
                      </p>
                    </section>
                  )}
                  <p className="muted">
                    {summary.population} habitantes vivos ·{" "}
                    {current.metrics.deaths} na memória
                  </p>
                  <div className="people-list">
                    {current.inhabitants.map((p) => (
                      <button
                        key={p.id}
                        className={selected === p.id ? "selected" : ""}
                        onClick={() => setSelected(p.id)}
                      >
                        <span
                          className={`avatar color-${p.color}`}
                          aria-hidden="true"
                        >
                          {p.name.slice(0, 1)}
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>
                            {Math.floor(p.age / 4)} anos ·{" "}
                            {ACTIVITY[p.activity]}
                          </small>
                        </span>
                        <span
                          className={
                            p.hunger >= 40 ? "hunger-flag" : "person-arrow"
                          }
                          aria-label={p.hunger >= 40 ? "Com fome" : undefined}
                        >
                          {p.hunger >= 40 ? "!" : "↗"}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {panel === "policies" && (
                <>
                  <p className="muted">
                    Você escolhe as regras. As pessoas encontram seu caminho.
                    Mudanças entram na próxima estação.
                  </p>
                  {(["work", "distribution", "extraction"] as const).map(
                    (key) => (
                      <fieldset
                        className="policy"
                        key={key}
                        disabled={!game || game.status === "ended"}
                      >
                        <legend>{POLICY_HELP[key].title}</legend>
                        {Object.entries(POLICY_LABELS[key]).map(
                          ([value, label]) => (
                            <label
                              className={`policy-option ${(pending[key] || current.policies[key]) === value ? "chosen" : ""}`}
                              key={value}
                            >
                              <input
                                type="radio"
                                name={key}
                                value={value}
                                checked={
                                  (pending[key] || current.policies[key]) ===
                                  value
                                }
                                onChange={() => choosePolicy(key, value)}
                              />
                              <span>
                                <strong>{label}</strong>
                                <small>
                                  {POLICY_HELP[key][value as never]}
                                </small>
                                {pending[key] === value && (
                                  <em>Para a próxima estação</em>
                                )}
                              </span>
                            </label>
                          ),
                        )}
                      </fieldset>
                    ),
                  )}
                  {!game && (
                    <p className="muted">
                      Funde uma civilização para escolher suas regras.
                    </p>
                  )}
                </>
              )}
              {panel === "settings" && (
                <div className="settings">
                  <p>
                    O cenário acompanha até <strong>40 anos</strong>. Extinção
                    ou um destino preparado pode encerrar a história antes. Não
                    há crescimento infinito nem progresso enquanto o aplicativo
                    está fechado.
                  </p>
                  <dl className="save-meta">
                    <div>
                      <dt>Semente</dt>
                      <dd>{current.seed}</dd>
                    </div>
                    <div>
                      <dt>Estações vividas</dt>
                      <dd>{current.cycle}/160</dd>
                    </div>
                    <div>
                      <dt>Versão das regras</dt>
                      <dd>{current.rulesVersion}</dd>
                    </div>
                    <div>
                      <dt>Floresta</dt>
                      <dd>{current.environment.forest}%</dd>
                    </div>
                  </dl>
                  <label className="motion-toggle">
                    <input
                      type="checkbox"
                      checked={reduced}
                      onChange={(e) => toggleMotion(e.target.checked)}
                    />
                    Reduzir movimentos
                  </label>
                  {game && (
                    <>
                      <p className="save-status">{saveStatus}</p>
                      <button
                        className="primary"
                        onClick={() => exportGame(game)}
                      >
                        Exportar história · JSON
                      </button>
                      <button
                        onClick={async () => {
                          setRunning(false);
                          try {
                            await saveGame(game);
                            setMessage("História salva neste aparelho.");
                          } catch {
                            setMessage(
                              "Não foi possível salvar. Exporte uma cópia em JSON.",
                            );
                          }
                        }}
                      >
                        Salvar agora
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setRunning(false);
                      fileRef.current?.click();
                    }}
                  >
                    Importar história
                  </button>
                  <button
                    onClick={() => {
                      setRunning(false);
                      setNewForm(true);
                      window.scrollTo({
                        top: 0,
                        behavior: reduced ? "instant" : "smooth",
                      });
                    }}
                  >
                    Fundar outra civilização
                  </button>
                  <p className="muted">
                    O navegador pode apagar dados locais. Exporte suas histórias
                    importantes. Importações aceitam esta versão e até 5 MiB.
                  </p>
                  <p className="muted">
                    {offlineReady
                      ? "✓ O aplicativo está pronto para funcionar sem conexão."
                      : "O acesso offline fica disponível após o primeiro carregamento completo."}
                  </p>
                  <a
                    href="https://github.com/victorfarias32/civilizacao-de-bolso"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Código e documentação ↗
                  </a>
                </div>
              )}
            </div>
          </aside>
        </section>
        <input
          ref={fileRef}
          aria-label="Arquivo JSON da civilização"
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              importFile(f).catch(() =>
                setMessage(
                  "Não foi possível ler o arquivo. Sua partida foi preservada.",
                ),
              );
            e.target.value = "";
          }}
        />
      </main>
      <footer className="footer">
        <span>
          CIVILIZAÇÃO DE BOLSO <i>✧</i> Uma história de cada vez.
        </span>
        <span>
          {game
            ? running
              ? "O tempo está passando"
              : "O mundo espera por você"
            : "Feito para observar. E se importar."}
        </span>
      </footer>
    </div>
  );
}
function Resource({
  icon,
  label,
  value,
  detail,
  warning = false,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className={`resource ${warning ? "warning" : ""}`}>
      <span className="resource-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span className="resource-label">{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
function Meter({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className={`meter ${danger ? "danger" : ""}`}>
      <div>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <progress value={value} max="100" aria-label={label} />
    </div>
  );
}
function evidenceLabel(key: string) {
  return (
    (
      {
        population: "Habitantes",
        seed: "Semente",
        demand: "Necessidade de alimento",
        distributed: "Alimento distribuído",
        wildFood: "Alimento no ambiente",
        age: "Idade",
        food: "Alimento em reserva",
        confidence: "Confiança",
        fertility: "Fertilidade",
        hungry: "Pessoas com fome",
        effectAt: "Estação do efeito",
        capacity: "Vagas",
        wood: "Madeira usada",
        buildingId: "Abrigo",
        commandId: "Decisão",
        key: "Política",
        value: "Escolha",
        stableSeasons: "Estações de recuperação",
        tradition: "Tradição",
        era: "Era",
        ending: "Destino",
        freeShelter: "Vagas livres",
      } as Record<string, string>
    )[key] || key
  );
}
export default App;
