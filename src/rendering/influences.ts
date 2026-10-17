import { PATHS, type PathKey, type Game } from "../simulation/model";
import type { DecisionOption } from "../simulation/destinies";
export const PATH_STYLE: Record<
  PathKey,
  { icon: string; color: string; ink: string; tint: string; change: string }
> = {
  nature: {
    icon: "❀",
    color: "#47945b",
    ink: "#215331",
    tint: "#e5f3db",
    change: "Jardins, copas e caminhos vivos se espalham pelo vale.",
  },
  knowledge: {
    icon: "⚙",
    color: "#398cce",
    ink: "#194b76",
    tint: "#e2f0ff",
    change:
      "Pisos azuis, oficinas e instrumentos transformam o bairro de pesquisa.",
  },
  spirit: {
    icon: "✧",
    color: "#a26bd0",
    ink: "#603580",
    tint: "#f2e5ff",
    change: "Cristais, círculos e lanternas violeta ocupam o santuário.",
  },
  order: {
    icon: "▣",
    color: "#c79b35",
    ink: "#65490b",
    tint: "#fff1c9",
    change: "Praças de pedra, bandeiras e muralhas organizam a vila.",
  },
  voyage: {
    icon: "➶",
    color: "#dc873b",
    ink: "#783d12",
    tint: "#fff0dc",
    change: "O porto cresce com mercados, velas e rotas de viagem.",
  },
  memory: {
    icon: "▤",
    color: "#3f9e9a",
    ink: "#205654",
    tint: "#dff4f0",
    change: "Mosaicos, arquivos e memoriais levam histórias à paisagem.",
  },
};
export function influenceGain(
  g: Game,
  o: Pick<DecisionOption, "paths">,
  key: PathKey,
) {
  return Math.min(100 - g.destiny.scores[key], Math.max(0, o.paths[key] || 0));
}
export function optionPaths(o: Pick<DecisionOption, "paths">, g?: Game) {
  return PATHS.filter((k) => (o.paths[k] || 0) > 0).sort(
    (a, b) =>
      (g ? influenceGain(g, o, b) - influenceGain(g, o, a) : 0) ||
      (o.paths[b] || 0) - (o.paths[a] || 0),
  );
}
export function visualStage(score: number) {
  return score >= 72
    ? "Paisagem extraordinária"
    : score >= 48
      ? "Marco monumental"
      : score >= 24
        ? "Bairro em expansão"
        : score >= 12
          ? "Novo bairro"
          : "Primeiros vestígios";
}
export function changedPaths(g: Game) {
  return PATHS.filter((k) => g.destiny.scores[k] > 0);
}
export const DISTRICTS: Record<PathKey, { x: number; y: number }> = {
  nature: { x: 337, y: 194 },
  knowledge: { x: 136, y: 107 },
  spirit: { x: 184, y: 265 },
  order: { x: 343, y: 85 },
  voyage: { x: 106, y: 222 },
  memory: { x: 413, y: 277 },
};
