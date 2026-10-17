import { registerMilestones } from "./destinies";
import {
  type Game,
  type Person,
  type HistoryEvent,
  living,
  demand,
  clamp,
} from "./model";
export const WORLD_ACTIONS = [
  "grove:river",
  "grove:village",
  "voyage",
  "commemorate",
  "discovery:study",
  "discovery:protect",
] as const;
export type WorldAction = (typeof WORLD_ACTIONS)[number];
export const GROVE_SITES = {
  river: {
    name: "Margem do rio",
    x: 181,
    y: 155,
    benefit: "Fertilidade +10 · floresta +12 · confiança +2",
    fertility: 10,
    forest: 12,
    confidence: 2,
  },
  village: {
    name: "Perto das casas",
    x: 355,
    y: 279,
    benefit: "Fertilidade +5 · floresta +8 · confiança +7",
    fertility: 5,
    forest: 8,
    confidence: 7,
  },
} as const;
export const GROVE_STAGES = [
  "Terreno marcado",
  "Preparação e andaimes",
  "Mudas plantadas",
  "Bosque inaugurado",
] as const;
export function worldActionInfo(g: Game, action: WorldAction) {
  let food = 0,
    wood = 0,
    available = false,
    reason = "";
  if (action.startsWith("grove:")) {
    wood = 80;
    food = 120;
    available = !g.world.grove && g.cycle <= 153;
    reason = g.world.grove
      ? "A comunidade já escolheu o local do bosque."
      : "É preciso iniciar até a estação 153.";
  } else if (action === "voyage") {
    food = 120;
    available = !g.world.voyage && g.cycle <= 156;
    reason = "Uma viagem por comunidade, iniciada até a estação 156.";
  } else if (action === "commemorate") {
    food = 60;
    available = g.cycle >= 4 && g.world.commemoratedAt === null;
    reason = "Uma celebração da fundação, disponível após quatro estações.";
  } else {
    const d = g.world.discovery;
    food = action === "discovery:study" ? 60 : 80;
    wood = action === "discovery:study" ? 25 : 0;
    available = d.appearedAt !== null && d.resolvedAt === null;
    reason =
      "É preciso encontrar uma luz no bosque antes de decidir seu destino.";
  }
  if (g.status !== "running" || !living(g).length)
    return {
      ok: false,
      food,
      wood,
      reason: "A história terminou. Os lugares guardam seus registros.",
    };
  if (!available) return { ok: false, food, wood, reason };
  if (g.resources.food < food || g.resources.wood < wood)
    return {
      ok: false,
      food,
      wood,
      reason: `São necessários ${food} de alimento e ${wood} de madeira.`,
    };
  return { ok: true, food, wood, reason: "" };
}
function note(
  g: Game,
  cycle: number,
  type: HistoryEvent["type"],
  title: string,
  text: string,
  evidence: HistoryEvent["evidence"],
  actorIds: string[] = [],
) {
  g.history.push({
    id: g.nextEvent++,
    cycle,
    type,
    title,
    text,
    evidence,
    actorIds,
    relatedEventIds: [],
  });
}
export function applyWorldAction(g: Game, value: string, cycle: number) {
  if (!WORLD_ACTIONS.includes(value as WorldAction)) return false;
  const action = value as WorldAction,
    info = worldActionInfo(g, action);
  if (!info.ok) return false;
  g.resources.food -= info.food;
  g.resources.wood -= info.wood;
  if (action === "grove:river" || action === "grove:village") {
    const site = action === "grove:river" ? "river" : "village";
    g.world.grove = { site, startedAt: cycle, progress: 0, workers: [] };
    note(
      g,
      cycle,
      "project",
      "Um lugar para o futuro",
      `O bosque foi marcado em ${GROVE_SITES[site].name.toLocaleLowerCase("pt-BR")}. A comunidade reservou 80 de madeira e 120 de alimento para a obra.`,
      { worldAction: action, site, stage: 0 },
    );
  } else if (action === "voyage") {
    g.world.voyage = { startedAt: cycle, returnedAt: null };
    note(
      g,
      cycle,
      "project",
      "Velas para outro vale",
      "Viajantes levaram 120 de alimento. O acordo prevê o retorno com 90 de madeira em duas estações.",
      { worldAction: action, due: cycle + 2 },
    );
  } else if (action === "commemorate") {
    g.world.commemoratedAt = cycle;
    g.confidence = clamp(g.confidence + 6);
    g.destiny.scores.memory = clamp(g.destiny.scores.memory + 6);
    note(
      g,
      cycle,
      "decision",
      "A primeira fogueira foi lembrada",
      "Os habitantes celebraram a fundação, compartilhando 60 de alimento e as histórias do primeiro acampamento. A confiança aumentou em 6 e a memória, em 6.",
      { worldAction: action },
      living(g)
        .slice(0, 4)
        .map((p) => p.id),
    );
  } else {
    const study = action === "discovery:study",
      d = g.world.discovery;
    d.resolvedAt = cycle;
    d.choice = study ? "study" : "protect";
    if (study) {
      g.destiny.scores.knowledge = clamp(g.destiny.scores.knowledge + 8);
      g.destiny.scores.spirit = clamp(g.destiny.scores.spirit + 4);
      g.environment.forest = clamp(g.environment.forest - 3);
    } else {
      g.destiny.scores.nature = clamp(g.destiny.scores.nature + 6);
      g.destiny.scores.memory = clamp(g.destiny.scores.memory + 6);
      g.environment.forest = clamp(g.environment.forest + 3);
      g.confidence = clamp(g.confidence + 3);
    }
    note(
      g,
      cycle,
      "discovery",
      study ? "As raízes e os instrumentos" : "Um segredo protegido",
      study
        ? "A comunidade instalou instrumentos para estudar os pulsos. Conhecimento +8 e consciência +4; a intervenção reduziu a floresta em 3."
        : "O bosque recebeu lanternas e uma área protegida. Natureza +6, memória +6, floresta +3 e confiança +3.",
      { worldAction: action, choice: d.choice },
    );
  }
  registerMilestones(g, cycle);
  return true;
}
export function groveWorkers(g: Game) {
  return living(g)
    .filter(
      (p) => p.age >= 64 && p.health >= 50 && p.energy >= 30 && p.hunger < 40,
    )
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 2);
}
export function groveCanAdvance(g: Game) {
  return (
    living(g).length > 0 &&
    g.resources.food >= demand(g) &&
    groveWorkers(g).length > 0
  );
}
export function advanceWorld(g: Game) {
  if (!living(g).length) return;
  const grove = g.world.grove;
  if (grove && grove.progress < 3 && g.cycle > grove.startedAt) {
    grove.workers = [];
    if (groveCanAdvance(g)) {
      const workers = groveWorkers(g);
      grove.workers = workers.map((p) => p.id);
      workers.forEach((p) => (p.energy = clamp(p.energy - 4)));
      grove.progress++;
      const site = GROVE_SITES[grove.site];
      if (grove.progress === 3) {
        g.destiny.scores.nature = clamp(g.destiny.scores.nature + 12);
        g.environment.fertility = clamp(
          g.environment.fertility + site.fertility,
        );
        g.environment.forest = clamp(g.environment.forest + site.forest);
        g.confidence = clamp(g.confidence + site.confidence);
      }
      note(
        g,
        g.cycle,
        "project",
        GROVE_STAGES[grove.progress],
        grove.progress === 3
          ? `O bosque em ${site.name.toLocaleLowerCase("pt-BR")} foi inaugurado. ${site.benefit}. Natureza +12.`
          : `Após as tarefas de sobrevivência, ${workers.map((p) => p.name).join(" e ")} ajudaram no bosque. O esforço custou 4 de energia por pessoa.`,
        { project: "grove", stage: grove.progress, site: grove.site },
        grove.workers,
      );
    }
  }
  const voyage = g.world.voyage;
  if (voyage && voyage.returnedAt === null && g.cycle >= voyage.startedAt + 2) {
    voyage.returnedAt = g.cycle;
    g.resources.wood += 90;
    g.destiny.scores.voyage = clamp(g.destiny.scores.voyage + 6);
    note(
      g,
      g.cycle,
      "project",
      "O barco voltou",
      "Os viajantes cumpriram o acordo: 90 de madeira chegaram ao porto. A experiência acrescentou 6 de exploração.",
      { project: "voyage", wood: 90 },
    );
  }
  const discovery = g.world.discovery;
  if (
    grove?.progress === 3 &&
    g.cycle >= grove.startedAt + 4 &&
    discovery.appearedAt === null
  ) {
    discovery.appearedAt = g.cycle;
    note(
      g,
      g.cycle,
      "discovery",
      "Uma luz entre as raízes",
      "Depois do crescimento do bosque, os habitantes notaram pulsos de luz sob uma árvore. O sinal permanece no mapa, à espera de investigação.",
      { project: "grove", site: grove.site },
    );
  }
  registerMilestones(g, g.cycle);
}
export function worldVisit(g: Game, p: Person, index: number) {
  if (g.status === "ended") return null;
  const grove = g.world.grove;
  if (grove && grove.workers.includes(p.id) && grove.progress < 3)
    return {
      x: GROVE_SITES[grove.site].x - 10 + grove.workers.indexOf(p.id) * 19,
      y: GROVE_SITES[grove.site].y + 12,
      kind: "build" as const,
    };
  if (
    g.world.commemoratedAt !== null &&
    g.cycle - g.world.commemoratedAt <= 1
  ) {
    const e = g.history.find((e) => e.evidence.worldAction === "commemorate");
    if (e?.actorIds.includes(p.id))
      return {
        x: 370 + e.actorIds.indexOf(p.id) * 12,
        y: 110,
        kind: "memorial" as const,
      };
  }
  if (p.activity === "rest" && p.age >= 64 && p.health >= 50) {
    if (g.destiny.scores.knowledge >= 12 && index % 2 === 0)
      return { x: 124 + (index % 3) * 12, y: 120, kind: "research" as const };
    if (g.destiny.scores.memory >= 12)
      return { x: 375 + (index % 4) * 10, y: 111, kind: "memorial" as const };
  }
  return null;
}
