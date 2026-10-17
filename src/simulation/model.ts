import { z } from "zod";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const gauge = z.number().int().min(0).max(100);
export const PATHS = [
  "nature",
  "knowledge",
  "spirit",
  "order",
  "voyage",
  "memory",
] as const;
export const ENDINGS = [
  "extinction",
  "legacy",
  "symbiosis",
  "stellar",
  "ascension",
  "utopia",
  "migration",
  "archive",
  "cosmic",
] as const;
export type PathKey = (typeof PATHS)[number];
export type Ending = (typeof ENDINGS)[number];
export const destinySchema = z
  .object({
    scores: z
      .object({
        nature: gauge,
        knowledge: gauge,
        spirit: gauge,
        order: gauge,
        voyage: gauge,
        memory: gauge,
      })
      .strict(),
    pending: z.string().min(1).max(40).nullable(),
    resolved: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            option: z.string().min(1).max(30),
            cycle: integer.max(160),
          })
          .strict(),
      )
      .max(24),
    nextAt: integer.max(168),
    unlocked: z
      .array(
        z
          .string()
          .regex(/^(nature|knowledge|spirit|order|voyage|memory):(24|48)$/),
      )
      .max(12),
  })
  .strict();
export type Destiny = z.infer<typeof destinySchema>;
export const emptyDestiny = (): Destiny => ({
  scores: {
    nature: 0,
    knowledge: 0,
    spirit: 0,
    order: 0,
    voyage: 0,
    memory: 0,
  },
  pending: null,
  resolved: [],
  nextAt: 4,
  unlocked: [],
});
export const policySchema = z
  .object({
    work: z.enum(["moderate", "intensive"]),
    distribution: z.enum(["equal", "contribution"]),
    extraction: z.enum(["careful", "accelerated"]),
  })
  .strict();
export type Policies = z.infer<typeof policySchema>;
export type PolicyKey = keyof Policies;
export const commandSchema = z
  .object({
    id: integer.positive(),
    targetCycle: integer.positive().max(160),
    sequence: integer,
    key: z.enum([
      "work",
      "distribution",
      "extraction",
      "decision",
      "destination",
    ]),
    value: z.string().max(60),
  })
  .strict();
export type Command = z.infer<typeof commandSchema>;
const personSchema = z
  .object({
    id: z.string().regex(/^h\d{3}$/),
    name: z.string().min(1).max(40),
    age: integer.max(400),
    health: gauge,
    energy: gauge,
    hunger: gauge,
    aptitude: z.enum(["gathering", "building"]),
    trait: z.enum(["cooperative", "cautious", "ambitious"]),
    activity: z.enum(["food", "wood", "build", "rest", "child", "dead"]),
    reason: z.string().max(180),
    alive: z.boolean(),
    sheltered: z.boolean(),
    contribution: integer,
    received: integer.max(100),
    color: integer.max(5),
    diedAt: integer.max(160).nullable(),
  })
  .strict();
export type Person = z.infer<typeof personSchema>;
const eventSchema = z
  .object({
    id: integer.positive(),
    cycle: integer.max(160),
    type: z.enum([
      "foundation",
      "policy",
      "scarcity",
      "recovery",
      "death",
      "birth",
      "building",
      "repair",
      "drought",
      "disease",
      "cooperation",
      "tradition",
      "era",
      "ending",
      "decision",
      "discovery",
    ]),
    title: z.string().max(120),
    text: z.string().max(1200),
    actorIds: z.array(z.string()).max(60),
    evidence: z.record(
      z.string().max(40),
      z.union([z.string().max(300), z.number().finite(), z.boolean()]),
    ),
    relatedEventIds: z.array(integer.positive()).max(30),
  })
  .strict();
export type HistoryEvent = z.infer<typeof eventSchema>;
const effectSchema = z
  .object({
    type: z.enum(["drought", "disease", "cooperation"]),
    targetCycle: integer.max(160),
    actorIds: z.array(z.string()).max(60),
  })
  .strict();
export const gameSchema = z
  .object({
    schemaVersion: z.literal(2),
    rulesVersion: z.literal("0.2.0"),
    scenarioId: z.literal("first-generation"),
    name: z.string().min(1).max(40),
    seed: integer.max(0xffffffff),
    rngState: integer.positive().max(0xffffffff),
    cycle: integer.max(160),
    status: z.enum(["running", "ended"]),
    ending: z.enum(ENDINGS).nullable(),
    destiny: destinySchema,
    resources: z
      .object({
        food: integer.max(1_000_000_000),
        wood: integer.max(1_000_000_000),
      })
      .strict(),
    environment: z
      .object({ wildFood: integer.max(6000), fertility: gauge, forest: gauge })
      .strict(),
    inhabitants: z.array(personSchema).min(1).max(200),
    buildings: z
      .array(
        z
          .object({
            id: integer.positive(),
            integrity: gauge,
            progress: integer.max(4),
            readyAt: integer.max(161),
          })
          .strict(),
      )
      .max(15),
    policies: policySchema,
    history: z.array(eventSchema).max(5000),
    commandLog: z.array(commandSchema).max(1000),
    confidence: gauge,
    era: z.enum(["survival", "community"]),
    traditions: z.array(z.enum(["reserves", "shelter"])).max(2),
    effects: z.array(effectSchema).max(6),
    cooldowns: z
      .object({
        drought: z.number().int().min(-8).max(160),
        disease: z.number().int().min(-8).max(160),
        cooperation: z.number().int().min(-8).max(160),
      })
      .strict(),
    counters: z
      .object({
        dry: integer.max(160),
        hungry: integer.max(160),
        stable: integer.max(160),
        unstable: integer.max(160),
        reserves: integer.max(160),
        shelter: integer.max(160),
        surplus: integer.max(160),
      })
      .strict(),
    metrics: z
      .object({
        births: integer.max(160),
        deaths: integer.max(200),
        peak: integer.max(60),
        lastFamineDeath: z.number().int().min(-8).max(160),
        hadFamine: z.boolean(),
        hadExposure: z.boolean(),
        scarce: z.boolean(),
        inequality: z.array(z.boolean()).max(8),
      })
      .strict(),
    nextPerson: integer.positive().max(201),
    nextEvent: integer.positive().max(5001),
  })
  .strict();
export type Game = z.infer<typeof gameSchema>;
export const SEASONS = ["Primavera", "Verão", "Outono", "Inverno"];
export const POLICY_LABELS = {
  work: { moderate: "Trabalho moderado", intensive: "Trabalho intensivo" },
  distribution: {
    equal: "Partilha igualitária",
    contribution: "Por contribuição",
  },
  extraction: {
    careful: "Extração cuidadosa",
    accelerated: "Extração acelerada",
  },
} as const;
export const living = (g: Game) => g.inhabitants.filter((p) => p.alive);
export const demandOf = (p: Person) => (p.age < 64 ? 60 : 100);
export const demand = (g: Game) =>
  living(g).reduce((n, p) => n + demandOf(p), 0);
export const capacity = (g: Game) =>
  g.buildings.filter(
    (b) => b.progress >= 4 && b.integrity >= 50 && b.readyAt <= g.cycle + 1,
  ).length * 4;
export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
