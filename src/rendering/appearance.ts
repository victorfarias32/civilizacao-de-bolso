import {
  type Game,
  type HistoryEvent,
  living,
  demand,
} from "../simulation/model";

export const EVENT_VISUALS: Record<
  HistoryEvent["type"],
  { label: string; detail: string; lasting: boolean }
> = {
  decision: {
    label: "Uma escolha ganha forma",
    detail: "Projetos e paisagens refletem as decisões do conselho.",
    lasting: true,
  },
  discovery: {
    label: "O mundo se transforma",
    detail: "Uma influência acumulada transforma os projetos da comunidade.",
    lasting: true,
  },
  foundation: {
    label: "Um lugar para começar",
    detail: "Acampamento, fogueira e estandartes da fundação.",
    lasting: true,
  },
  policy: {
    label: "Novas regras",
    detail: "Os três estandartes da praça mudam com as políticas.",
    lasting: false,
  },
  scarcity: {
    label: "A fome chegou",
    detail: "Cestos vazios, fogueira baixa e habitantes curvados.",
    lasting: false,
  },
  recovery: {
    label: "A mesa voltou a florescer",
    detail: "Cestos reabastecidos e uma refeição na praça.",
    lasting: false,
  },
  death: {
    label: "Jardim da memória",
    detail: "Cada despedida deixa uma pedra no memorial.",
    lasting: true,
  },
  birth: {
    label: "Uma nova vida",
    detail: "Fitas na vila e uma pequena manta junto aos abrigos.",
    lasting: false,
  },
  building: {
    label: "Um novo teto",
    detail: "A obra ganha paredes, telhas e janelas.",
    lasting: true,
  },
  repair: {
    label: "Um teto cuidado",
    detail: "Novas telhas e remendos aparecem no abrigo reparado.",
    lasting: false,
  },
  drought: {
    label: "Sinais de estiagem",
    detail: "Solo rachado, água recuada e poeira sobre a paisagem.",
    lasting: false,
  },
  disease: {
    label: "Dias de cuidado",
    detail: "Faixas de cuidado nas casas e sinais nos habitantes afetados.",
    lasting: false,
  },
  cooperation: {
    label: "Muitas mãos",
    detail: "A obra recebe estandartes, ferramentas e faíscas do mutirão.",
    lasting: false,
  },
  tradition: {
    label: "A memória ganhou forma",
    detail: "Reservas protegidas ou beirais reforçados permanecem na vila.",
    lasting: true,
  },
  era: {
    label: "A vila se transforma",
    detail: "O caminho e a praça mudam conforme a organização da comunidade.",
    lasting: true,
  },
  ending: {
    label: "Um destino, outro mundo",
    detail:
      "O legado acende uma noite de lanternas; a extinção deixa ruínas e silêncio.",
    lasting: true,
  },
};
export const SEASON_ART = [
  {
    name: "Primavera",
    mood: "FLORAÇÃO",
    grass: ["#496b40", "#537c45", "#648c4b", "#759d55"],
    dark: "#324e35",
    light: "#aac67b",
    leaves: ["#264b38", "#3f7750", "#679b60", "#9ab875"],
    flower: "#efb6c7",
    soil: "#9a8556",
    water: ["#23516a", "#306e86", "#4d94a0", "#8bc5bc"],
    snow: false,
  },
  {
    name: "Verão",
    mood: "VIDA EM ABUNDÂNCIA",
    grass: ["#52693a", "#637d3f", "#788e43", "#929d4b"],
    dark: "#384f32",
    light: "#c2c67e",
    leaves: ["#173e36", "#28654a", "#428b55", "#76ae65"],
    flower: "#e9ca67",
    soil: "#af915b",
    water: ["#1b465d", "#246981", "#3e9aaf", "#9ad4ce"],
    snow: false,
  },
  {
    name: "Outono",
    mood: "O TEMPO DAS FOLHAS",
    grass: ["#746140", "#887147", "#9d8151", "#b1945d"],
    dark: "#554935",
    light: "#dfc082",
    leaves: ["#62392f", "#9b4931", "#c67437", "#e1a84e"],
    flower: "#dd9144",
    soil: "#ad8b60",
    water: ["#334b60", "#456f7d", "#6f979d", "#b0c2b6"],
    snow: false,
  },
  {
    name: "Inverno",
    mood: "O SILÊNCIO DA NEVE",
    grass: ["#aebfbd", "#bfcecb", "#cfdbd4", "#e1e8dc"],
    dark: "#778d96",
    light: "#f6f3e6",
    leaves: ["#3b5658", "#648181", "#a2b5b0", "#e5ebe1"],
    flower: "#b2cad6",
    soil: "#8c9d9f",
    water: ["#416879", "#7098ab", "#a9c7cf", "#e0e6da"],
    snow: true,
  },
] as const;
export function appearance(g: Game) {
  const season =
    (g.status === "ended" ? Math.max(0, g.cycle - 1) : g.cycle) % 4;
  const recent = g.history.filter((e) => g.cycle - e.cycle <= 2);
  const drought =
    recent.some((e) => e.type === "drought") ||
    g.effects.some((e) => e.type === "drought");
  const diseaseEvents = recent.filter((e) => e.type === "disease");
  const sickIds = new Set([
    ...diseaseEvents.flatMap((e) => e.actorIds),
    ...g.effects.filter((e) => e.type === "disease").flatMap((e) => e.actorIds),
  ]);
  const hungry = g.metrics.scarce || living(g).some((p) => p.hunger >= 40);
  return {
    season,
    palette: SEASON_ART[season],
    drought,
    dry: drought || g.environment.fertility < 40,
    hungry,
    sickIds,
    birth: recent.some((e) => e.type === "birth"),
    cooperation: recent.some((e) => e.type === "cooperation"),
    recovery: recent.some((e) => e.type === "recovery"),
    repairs: recent
      .filter((e) => e.type === "repair")
      .map((e) => Number(e.evidence.buildingId)),
    extinct: g.ending === "extinction",
    legacy: g.ending === "legacy",
    community: g.era === "community",
    reserves: g.traditions.includes("reserves"),
    shelter: g.traditions.includes("shelter"),
    abundance: Math.min(1, g.environment.wildFood / 4000),
    foodLevel: Math.min(1, g.resources.food / Math.max(1, demand(g) * 3)),
    memorial: g.metrics.deaths,
    cues: recent
      .filter((e) => e.type !== "foundation")
      .slice(-4)
      .reverse()
      .map((e) => ({ id: e.id, type: e.type, ...EVENT_VISUALS[e.type] })),
  };
}
export type Appearance = ReturnType<typeof appearance>;
