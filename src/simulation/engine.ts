import { applyWorldAction, advanceWorld } from "./world";
import {
  applyDecision,
  offerDecision,
  readyDestinations,
  chooseEnding,
  destination,
  hybridParagraphs,
} from "./destinies";
import {
  type Game,
  type Ending,
  emptyDestiny,
  emptyWorld,
  type Person,
  type Command,
  type HistoryEvent,
  living,
  demand,
  demandOf,
  capacity,
  mean,
  clamp,
  policySchema,
  commandSchema,
  POLICY_LABELS,
} from "./model";

export const RULES = {
  foodYield: 440,
  woodYield: 30,
  moderateCost: 8,
  intensiveCost: 18,
  restGain: 28,
  maxCycles: 160,
  maxPopulation: 60,
} as const;
const NAMES = [
  "Iara",
  "Bento",
  "Cora",
  "Davi",
  "Lia",
  "Nilo",
  "Amara",
  "Ravi",
  "Mara",
  "Caio",
  "Flora",
  "Téo",
  "Yuri",
  "Luna",
  "Ari",
  "Rosa",
  "Noa",
  "Eva",
  "Sol",
  "Íris",
  "Tomé",
  "Malu",
  "Iná",
  "Lino",
];
export function random(g: Game): number {
  let x = g.rngState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  g.rngState = x >>> 0;
  return g.rngState % 10000;
}
function emit(
  g: Game,
  cycle: number,
  type: HistoryEvent["type"],
  title: string,
  text: string,
  evidence: HistoryEvent["evidence"] = {},
  actorIds: string[] = [],
  relatedEventIds: number[] = [],
) {
  g.history.push({
    id: g.nextEvent++,
    cycle,
    type,
    title,
    text,
    evidence,
    actorIds,
    relatedEventIds,
  });
}
function person(g: Game, age: number): Person {
  const n = g.nextPerson++;
  return {
    id: `h${String(n).padStart(3, "0")}`,
    name:
      NAMES[(random(g) + n) % NAMES.length] + (n > NAMES.length ? ` ${n}` : ""),
    age,
    health: 100,
    energy: 80,
    hunger: 0,
    aptitude: random(g) < 5000 ? "gathering" : "building",
    trait: (["cooperative", "cautious", "ambitious"] as const)[random(g) % 3],
    activity: age < 64 ? "child" : "food",
    reason: "A comunidade está se organizando.",
    alive: true,
    sheltered: true,
    contribution: 0,
    received: 0,
    color: random(g) % 6,
    diedAt: null,
  };
}
export function createGame(
  config: { name?: string; seed?: number } = {},
): Game {
  const seed = (config.seed ?? 42) >>> 0;
  const g: Game = {
    schemaVersion: 3,
    rulesVersion: "0.3.0",
    scenarioId: "first-generation",
    name: config.name?.trim().slice(0, 40) || "Vale das Pequenas Luzes",
    seed,
    rngState: seed || 0x6d2b79f5,
    cycle: 0,
    status: "running",
    ending: null,
    destiny: emptyDestiny(),
    world: emptyWorld(),
    resources: { food: 2400, wood: 400 },
    environment: { wildFood: 3600, fertility: 100, forest: 100 },
    inhabitants: [],
    buildings: [1, 2, 3].map((id) => ({
      id,
      integrity: 100,
      progress: 4,
      readyAt: 0,
    })),
    policies: {
      work: "moderate",
      distribution: "equal",
      extraction: "careful",
    },
    history: [],
    commandLog: [],
    confidence: 60,
    era: "survival",
    traditions: [],
    effects: [],
    cooldowns: { drought: -8, disease: -8, cooperation: -8 },
    counters: {
      dry: 0,
      hungry: 0,
      stable: 0,
      unstable: 0,
      reserves: 0,
      shelter: 0,
      surplus: 0,
    },
    metrics: {
      births: 0,
      deaths: 0,
      peak: 12,
      lastFamineDeath: -8,
      hadFamine: false,
      hadExposure: false,
      scarce: false,
      inequality: [],
    },
    nextPerson: 1,
    nextEvent: 1,
  };
  g.inhabitants = [18, 20, 22, 24, 26, 28, 30, 32, 35, 39, 45, 52].map((age) =>
    person(g, age * 4),
  );
  emit(
    g,
    0,
    "foundation",
    "Doze pessoas, um começo",
    `À margem de um rio, 12 pessoas fundaram ${g.name}. Terão até 40 anos para deixar sua história aos que vierem depois.`,
    { population: 12, seed },
  );
  return g;
}

/** Weighted apportionment with integer conservation, per-person caps and stable ties. */
export function allocate(
  total: number,
  caps: number[],
  weights: number[],
): number[] {
  const out = caps.map(() => 0);
  let remaining = Math.min(
    total,
    caps.reduce((a, b) => a + b, 0),
  );
  while (remaining > 0) {
    const active = caps
      .map((c, i) => (c > out[i] ? i : -1))
      .filter((i) => i >= 0);
    if (!active.length) break;
    const sum = active.reduce((n, i) => n + Math.max(0, weights[i]), 0);
    let used = 0;
    const shares = active.map((i) => ({
      i,
      raw:
        remaining *
        (sum > 0 ? Math.max(0, weights[i]) / sum : 1 / active.length),
    }));
    for (const { i, raw } of shares) {
      const take = Math.min(caps[i] - out[i], Math.floor(raw));
      out[i] += take;
      used += take;
    }
    remaining -= used;
    if (remaining > 0) {
      shares.sort((a, b) => (b.raw % 1) - (a.raw % 1) || a.i - b.i);
      for (const { i } of shares) {
        if (remaining && out[i] < caps[i]) {
          out[i]++;
          remaining--;
        }
      }
    }
  }
  return out;
}

function applyCommands(g: Game, commands: Command[], cycle: number) {
  let requested: Ending | undefined;
  const seen = new Set(g.commandLog.map((c) => c.id));
  for (const raw of [...commands].sort(
    (a, b) => a.sequence - b.sequence || a.id - b.id,
  )) {
    const valid = commandSchema.safeParse(raw);
    if (
      !valid.success ||
      raw.targetCycle !== cycle ||
      seen.has(raw.id) ||
      g.commandLog.length >= 1000
    )
      continue;
    if (raw.key === "world") {
      if (applyWorldAction(g, raw.value, cycle)) {
        seen.add(raw.id);
        g.commandLog.push({ ...raw });
      }
      continue;
    }
    if (raw.key === "decision" || raw.key === "destination") {
      if (
        raw.key === "decision"
          ? applyDecision(g, raw.value, cycle)
          : readyDestinations(g).some((d) => d.id === raw.value)
      ) {
        seen.add(raw.id);
        g.commandLog.push({ ...raw });
        if (raw.key === "destination") {
          requested = raw.value as Ending;
          break;
        }
      }
      continue;
    }
    const policies = policySchema.safeParse({
      ...g.policies,
      [raw.key]: raw.value,
    });
    if (!policies.success) continue;
    seen.add(raw.id);
    g.commandLog.push({ ...raw });
    g.policies = policies.data;
    const label = POLICY_LABELS[raw.key][raw.value as never] as string;
    emit(
      g,
      cycle,
      "policy",
      "Uma nova regra",
      `A comunidade adotou: ${label}.`,
      { key: raw.key, value: raw.value, commandId: raw.id },
    );
  }
  return requested;
}

export function advanceSeason(
  state: Game,
  commands: Command[] = [],
): { state: Game; events: HistoryEvent[] } {
  if (state.status === "ended") return { state, events: [] };
  const g = structuredClone(state),
    startHistory = g.history.length,
    cycle = g.cycle + 1,
    season = g.cycle % 4;
  const requested = applyCommands(g, commands, cycle);
  if (requested) {
    g.cycle = cycle;
    finish(g, requested);
    return { state: g, events: g.history.slice(startHistory) };
  }
  const people = living(g),
    pop = people.length;
  if (!pop) {
    g.cycle = cycle;
    finish(g);
    return { state: g, events: g.history.slice(startHistory) };
  }
  const activeEffects = g.effects.filter((e) => e.targetCycle === cycle);
  const drought = activeEffects.some((e) => e.type === "drought"),
    cooperation = activeEffects.some((e) => e.type === "cooperation");
  const sickIds = activeEffects
    .filter((e) => e.type === "disease")
    .flatMap((e) => e.actorIds);
  g.effects = [];
  const regen = Math.floor(
    ((2000 * [1.2, 1, 0.8, 0.35][season] * g.environment.fertility) / 100) *
      (drought ? 0.5 : 1),
  );
  g.environment.wildFood = Math.min(
    Math.floor((6000 * g.environment.fertility) / 100),
    g.environment.wildFood + regen,
  );
  const slots = capacity(g);
  const priority = [...people].sort(
    (a, b) =>
      Number(b.age < 64) - Number(a.age < 64) ||
      a.health - b.health ||
      a.id.localeCompare(b.id),
  );
  priority.forEach((p, i) => (p.sheltered = i < slots));
  const required = demand(g),
    foodPriority = required * (g.traditions.includes("reserves") ? 3 : 2);
  const repairThreshold = g.traditions.includes("shelter") ? 70 : 50;
  const broken = [...g.buildings]
    .filter((b) => b.progress >= 4 && b.integrity < repairThreshold)
    .sort((a, b) => a.integrity - b.integrity || a.id - b.id)[0];
  const unfinished = g.buildings.find((b) => b.progress < 4);
  let workTarget = unfinished,
    repairing = false,
    builders = 0,
    woodcutters = 0;
  const allowBuilding = g.resources.food >= foodPriority;
  for (const p of people) {
    p.received = 0;
    p.contribution = 0;
    const restAt =
      p.trait === "cautious" ? 35 : p.trait === "ambitious" ? 20 : 25;
    if (p.age < 64) {
      p.activity = "child";
      p.reason = "Ainda é tempo de crescer.";
    } else if (p.health < 40 || p.energy < restAt) {
      p.activity = "rest";
      p.reason =
        p.health < 40
          ? "A saúde exige recuperação."
          : "O corpo precisa de descanso.";
    } else if (
      allowBuilding &&
      builders < (broken ? 1 : 2) &&
      (broken || unfinished || slots <= pop) &&
      g.resources.wood >= (broken ? 20 : unfinished ? 0 : 120)
    ) {
      if (!workTarget && !repairing) {
        if (broken) {
          g.resources.wood -= 20;
          workTarget = broken;
          repairing = true;
        } else if (g.buildings.length < 15) {
          g.resources.wood -= 120;
          workTarget = {
            id: g.buildings.length + 1,
            integrity: 100,
            progress: 0,
            readyAt: 161,
          };
          g.buildings.push(workTarget);
        }
      }
      if (workTarget) {
        p.activity = "build";
        p.reason = repairing
          ? "Conservar o abrigo é proteger a comunidade."
          : "Novas vagas para quem precisa.";
        builders++;
      } else {
        p.activity = "food";
        p.reason = "A comunidade precisa de reservas.";
      }
    } else if (
      allowBuilding &&
      g.resources.wood < 200 &&
      woodcutters < 2 &&
      g.environment.forest > 0
    ) {
      p.activity = "wood";
      p.reason = "Madeira para construir e reparar.";
      woodcutters++;
    } else {
      p.activity = "food";
      p.reason =
        g.resources.food < foodPriority
          ? "A reserva de alimento precisa crescer."
          : "Guardar hoje para o próximo inverno.";
    }
  }
  let foodProduced = 0;
  for (const activity of ["food", "wood"] as const) {
    const workers = people.filter((p) => p.activity === activity);
    const caps = workers.map((p) =>
      Math.floor(
        (activity === "food" ? RULES.foodYield : RULES.woodYield) *
          (p.energy / 100) *
          (p.health / 100) *
          (p.aptitude === "gathering" ? 1.1 : 1) *
          (p.age >= 260 ? 0.6 : 1) *
          (g.policies.work === "intensive" ? 1.35 : 1) *
          (g.policies.extraction === "accelerated"
            ? activity === "wood"
              ? 1.4
              : 1.15
            : 1),
      ),
    );
    const available =
      activity === "food" ? g.environment.wildFood : g.environment.forest * 20;
    const production = allocate(available, caps, caps);
    const collected = production.reduce((a, b) => a + b, 0);
    workers.forEach((p, i) => (p.contribution = production[i]));
    g.resources[activity] += collected;
    if (activity === "food") {
      g.environment.wildFood -= collected;
      foodProduced = collected;
    } else
      g.environment.forest = Math.max(
        0,
        g.environment.forest - Math.ceil(collected / 20),
      );
  }
  if (workTarget && builders) {
    const points = people
      .filter((p) => p.activity === "build")
      .reduce(
        (n, p) =>
          n + (p.aptitude === "building" ? 2 : 1) + (cooperation ? 1 : 0),
        0,
      );
    people
      .filter((p) => p.activity === "build")
      .forEach((p) => (p.contribution = 100));
    if (repairing) {
      workTarget.integrity = clamp(workTarget.integrity + 20);
      emit(
        g,
        cycle,
        "repair",
        "Um teto preservado",
        "O mutirão de manutenção recuperou um abrigo.",
        { buildingId: workTarget.id, wood: 20 },
      );
    } else {
      const was = workTarget.progress;
      workTarget.progress = Math.min(4, was + points);
      if (workTarget.progress === 4 && was < 4) {
        workTarget.readyAt = cycle + 1;
        emit(
          g,
          cycle,
          "building",
          "Um novo teto",
          "Um abrigo ficou pronto. Na próxima estação, quatro pessoas poderão ocupá-lo.",
          { buildingId: workTarget.id, capacity: 4 },
        );
      }
    }
  }
  g.environment.forest = clamp(
    g.environment.forest + (g.policies.extraction === "careful" ? 3 : 1),
  );
  g.environment.fertility = clamp(
    g.environment.fertility +
      (g.policies.extraction === "careful" ? 1 : foodProduced > 0 ? -2 : 0) -
      (g.environment.forest < 25 ? 1 : 0),
  );
  const caps = people.map(demandOf);
  let portions: number[];
  if (g.policies.distribution === "equal")
    portions = allocate(g.resources.food, caps, caps);
  else {
    const base = caps.map((c) => Math.floor(c / 2));
    const first = allocate(g.resources.food, base, base);
    const extra = allocate(
      g.resources.food - first.reduce((a, b) => a + b, 0),
      caps.map((c, i) => c - first[i]),
      people.map((p) => 1 + p.contribution / 100),
    );
    portions = first.map((n, i) => n + extra[i]);
  }
  g.resources.food -= portions.reduce((a, b) => a + b, 0);
  const coverage = portions.map((n, i) => n / caps[i]),
    inequality = Math.max(...coverage) - Math.min(...coverage) > 0.5;
  g.metrics.inequality = [...g.metrics.inequality, inequality].slice(-8);
  const exposed = people.filter((p) => !p.sheltered).length;
  let famineDeath = false;
  for (const [i, p] of people.entries()) {
    p.received = portions[i];
    const deficit = 1 - coverage[i],
      causes: Record<string, number> = {};
    p.hunger = clamp(p.hunger + (deficit > 0 ? Math.ceil(40 * deficit) : -20));
    p.energy = clamp(
      p.energy +
        (["rest", "child"].includes(p.activity)
          ? RULES.restGain
          : -(g.policies.work === "intensive"
              ? RULES.intensiveCost
              : RULES.moderateCost)),
    );
    if (deficit > 0) causes.fome = Math.ceil(16 * deficit);
    if (p.hunger >= 80) causes.fome = (causes.fome || 0) + 10;
    if (p.energy < 25) causes.exaustão = 4;
    if (!p.sheltered) causes.exposição = season === 3 ? 8 : 2;
    if (sickIds.includes(p.id)) causes.doença = p.activity === "rest" ? 4 : 8;
    let health = p.health - Object.values(causes).reduce((a, b) => a + b, 0);
    if (!deficit && p.hunger <= 20 && p.energy >= 40) health += 4;
    p.age++;
    if (p.age >= 320) {
      health = 0;
      causes.velhice = 100;
    }
    p.health = clamp(health);
    if (!p.health) {
      p.alive = false;
      p.activity = "dead";
      p.diedAt = cycle;
      p.reason = "Sua história permanece na memória da comunidade.";
      g.metrics.deaths++;
      const causeNames = Object.keys(causes).join(", ") || "saúde debilitada";
      emit(
        g,
        cycle,
        "death",
        `A despedida de ${p.name}`,
        `${p.name} morreu aos ${Math.floor(p.age / 4)} anos. Condições observadas nesta estação: ${causeNames}.`,
        { ...causes, age: Math.floor(p.age / 4) },
        [p.id],
      );
      if (causes.fome) {
        famineDeath = true;
        g.metrics.lastFamineDeath = cycle;
      }
    }
  }
  g.buildings
    .filter((b) => b.progress >= 4 && b.readyAt <= cycle)
    .forEach((b) => (b.integrity = clamp(b.integrity - 2)));
  g.confidence = clamp(
    g.confidence -
      (famineDeath ? 5 : 0) -
      (inequality ? 2 : 0) +
      (coverage.every((v) => v === 1) && !exposed ? 1 : 0),
  );
  const scarce = coverage.some((v) => v < 1);
  if (scarce && !g.metrics.scarce)
    emit(
      g,
      cycle,
      "scarcity",
      "A mesa ficou menor",
      "O alimento disponível não cobriu todas as necessidades. A fome começa a crescer.",
      {
        demand: required,
        distributed: portions.reduce((a, b) => a + b, 0),
        wildFood: g.environment.wildFood,
      },
    );
  if (!scarce && g.metrics.scarce)
    emit(
      g,
      cycle,
      "recovery",
      "Todos voltaram à mesa",
      "Nesta estação, cada habitante recebeu sua porção completa.",
      { demand: required },
    );
  g.metrics.scarce = scarce;
  const alive = living(g),
    currentDemand = demand(g);
  g.counters.surplus =
    foodProduced >= required + 60 ? g.counters.surplus + 1 : 0;
  if (
    season === 3 &&
    g.counters.surplus >= 4 &&
    alive.length >= 2 &&
    alive.length < 60 &&
    alive.filter((p) => p.age >= 72 && p.age < 200 && p.health >= 70).length >=
      2 &&
    g.resources.food >= currentDemand * 2 &&
    slots > alive.length &&
    g.confidence >= 45 &&
    cycle - g.metrics.lastFamineDeath >= 4 &&
    random(g) < 3500
  ) {
    const baby = person(g, 0);
    g.inhabitants.push(baby);
    g.metrics.births++;
    emit(
      g,
      cycle,
      "birth",
      `Uma nova vida: ${baby.name}`,
      "Com alimento, saúde e um lugar protegido, a comunidade acolheu uma criança.",
      {
        food: g.resources.food,
        confidence: g.confidence,
        freeShelter: slots - alive.length,
      },
      [baby.id],
    );
  }
  g.metrics.peak = Math.max(g.metrics.peak, living(g).length);
  const hungry = alive.filter((p) => p.hunger >= 40);
  g.counters.dry = g.environment.fertility < 60 ? g.counters.dry + 1 : 0;
  g.counters.hungry =
    alive.length && hungry.length / alive.length >= 0.25
      ? g.counters.hungry + 1
      : 0;
  if (g.counters.hungry) g.metrics.hadFamine = true;
  if (pop && exposed / pop >= 0.25) g.metrics.hadExposure = true;
  const eventDefs = [
    {
      type: "drought" as const,
      eligible: g.counters.dry >= 2,
      chance: 1500,
      title: "O chão pede chuva",
      text: "A fertilidade está baixa há duas estações. Sinais de estiagem anunciam menor recuperação de alimento na próxima estação.",
      ids: [] as string[],
    },
    {
      type: "disease" as const,
      eligible: g.counters.hungry >= 2,
      chance: 2000,
      title: "Corpos enfraquecidos",
      text: "Após a fome persistente, surgiram sintomas entre os mais debilitados. Descansar reduz o impacto na próxima estação.",
      ids: hungry.map((p) => p.id),
    },
    {
      type: "cooperation" as const,
      eligible: g.confidence >= 70 && slots < living(g).length,
      chance: 2000,
      title: "Muitas mãos, um teto",
      text: "A confiança coletiva reuniu um mutirão. Construir será mais rápido na próxima estação.",
      ids: [] as string[],
    },
  ];
  if (cycle < 160)
    for (const e of eventDefs)
      if (
        e.eligible &&
        cycle - g.cooldowns[e.type] >= 8 &&
        random(g) < e.chance
      ) {
        g.cooldowns[e.type] = cycle;
        g.effects.push({
          type: e.type,
          targetCycle: cycle + 1,
          actorIds: e.ids,
        });
        if (
          e.type === "cooperation" &&
          alive.some((p) => p.trait === "cooperative")
        )
          g.confidence = clamp(g.confidence + 2);
        emit(
          g,
          cycle,
          e.type,
          e.title,
          e.text,
          {
            fertility: g.environment.fertility,
            hungry: hungry.length,
            confidence: g.confidence,
            effectAt: cycle + 1,
          },
          e.ids,
        );
      }
  g.counters.reserves =
    g.metrics.hadFamine && g.resources.food >= demand(g) * 2
      ? g.counters.reserves + 1
      : 0;
  g.counters.shelter =
    g.metrics.hadExposure && slots >= living(g).length
      ? g.counters.shelter + 1
      : 0;
  for (const [tradition, count, title, text] of [
    [
      "reserves",
      g.counters.reserves,
      "Guardiões das reservas",
      "A lembrança da fome se tornou tradição: a comunidade passa a priorizar reservas maiores.",
    ],
    [
      "shelter",
      g.counters.shelter,
      "Memória do abrigo",
      "Quem conheceu a exposição aprendeu a conservar os tetos antes que se desgastem.",
    ],
  ] as const)
    if (count >= 4 && !g.traditions.includes(tradition)) {
      g.traditions.push(tradition);
      const related = g.history
        .filter((e) => e.type === "scarcity" || e.type === "death")
        .slice(-3)
        .map((e) => e.id);
      emit(
        g,
        cycle,
        "tradition",
        title,
        text,
        { tradition, stableSeasons: count },
        [],
        related,
      );
    }
  const stable =
    slots >= living(g).length &&
    living(g).every((p) => p.hunger < 40) &&
    g.confidence >= 55;
  g.counters.stable = stable ? g.counters.stable + 1 : 0;
  g.counters.unstable = stable ? 0 : g.counters.unstable + 1;
  const newEra =
    g.era === "survival" && g.counters.stable >= 4
      ? "community"
      : g.era === "community" && g.counters.unstable >= 4
        ? "survival"
        : g.era;
  if (newEra !== g.era) {
    g.era = newEra;
    emit(
      g,
      cycle,
      "era",
      newEra === "community"
        ? "De sobreviventes a comunidade"
        : "Tempos de sobrevivência",
      newEra === "community"
        ? "Quatro estações de abrigo, alimento e confiança mudaram a vida coletiva."
        : "Quatro estações de instabilidade trouxeram de volta as urgências da sobrevivência.",
      { era: newEra },
    );
  }
  g.cycle = cycle;
  advanceWorld(g);
  offerDecision(g);
  finish(g);
  return { state: g, events: g.history.slice(startHistory) };
}

function finish(g: Game, requested?: Ending) {
  if (g.status === "ended") return;
  if (!living(g).length || g.cycle >= 160 || requested) {
    g.status = "ended";
    g.ending = !living(g).length ? "extinction" : requested || chooseEnding(g);
    g.effects = [];
    g.destiny.pending = null;
    const d = destination(g.ending);
    emit(g, g.cycle, "ending", d.title, d.story, {
      ending: g.ending,
      population: living(g).length,
      food: g.resources.food,
      fertility: g.environment.fertility,
    });
  }
}
export function deriveSummary(g: Game) {
  const alive = living(g),
    required = demand(g);
  return {
    population: alive.length,
    demand: required,
    health: Math.round(mean(alive.map((p) => p.health))),
    energy: Math.round(mean(alive.map((p) => p.energy))),
    hunger: Math.round(mean(alive.map((p) => p.hunger))),
    capacity: capacity(g),
    year: Math.min(40, Math.floor(g.cycle / 4) + 1),
    season: g.status === "ended" ? Math.max(0, g.cycle - 1) % 4 : g.cycle % 4,
    reserve: required ? g.resources.food / required : 0,
  };
}
export function epilogue(g: Game): {
  title: string;
  paragraphs: string[];
  labels: string[];
} {
  const s = deriveSummary(g),
    labels: string[] = [];
  if (g.resources.food >= s.demand * 2 && s.health >= 70 && s.population)
    labels.push("Próspera");
  if (g.resources.food < s.demand || s.health < 40) labels.push("Fragilizada");
  if (g.confidence >= 70 && g.policies.distribution === "equal")
    labels.push("Cooperativa");
  if (
    g.policies.distribution === "contribution" &&
    g.metrics.inequality.filter(Boolean).length >= 4
  )
    labels.push("Desigual");
  if (g.environment.fertility < 40 || g.environment.forest < 25)
    labels.push("Ambiente degradado");
  const paragraphs = [
    g.ending === "extinction"
      ? `A história de ${g.name} durou ${g.cycle} estações. As casas ficaram, mas nenhuma pessoa permaneceu para acender suas luzes.`
      : `Ao longo de ${g.cycle} estações, ${g.name} deixou de ser apenas um acampamento. Hoje, ${s.population} pessoas recebem o legado dos fundadores.`,
    `A comunidade acolheu ${g.metrics.births} novas vidas e se despediu de ${g.metrics.deaths} pessoas. Sua maior população foi de ${g.metrics.peak} habitantes.`,
    `No encerramento, restaram ${g.resources.food} unidades de alimento. A fertilidade estava em ${g.environment.fertility}% e a floresta, em ${g.environment.forest}%.`,
  ];
  if (g.ending) paragraphs.push(destination(g.ending).story);
  paragraphs.push(...hybridParagraphs(g));
  const decisions = g.history.filter((e) => e.type === "decision");
  if (decisions.length)
    paragraphs.push(
      `Entre as decisões que moldaram o destino: ${decisions
        .slice(-4)
        .map((e) => e.text)
        .join(" ")}`,
    );
  const worldEvents = g.history.filter(
    (e) => e.type === "project" || e.evidence.worldAction,
  );
  if (worldEvents.length)
    paragraphs.push(
      `Também fizeram parte da história: ${worldEvents
        .slice(-3)
        .map((e) => e.text)
        .join(" ")}`,
    );
  const deaths = g.history.filter((e) => e.type === "death");
  if (g.ending === "extinction" && deaths.length)
    paragraphs.push(deaths[deaths.length - 1].text);
  const traditions = g.history.filter((e) => e.type === "tradition");
  if (traditions.length)
    paragraphs.push(
      `Da experiência nasceram tradições: ${traditions.map((e) => e.title).join(" e ")}.`,
    );
  paragraphs.push(
    "Não há uma próxima melhoria a comprar. Há uma história para guardar — e outro começo possível.",
  );
  return {
    title: destination(g.ending || "legacy").title,
    paragraphs,
    labels,
  };
}
