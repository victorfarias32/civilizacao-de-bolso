import { WORLD_ACTIONS } from "../simulation/world";
import { z } from "zod";
import { decisionById, destinationChecks } from "../simulation/destinies";
import { emptyDestiny, emptyWorld } from "../simulation/model";
import {
  gameSchema,
  type Game,
  living,
  policySchema,
} from "../simulation/model";
export const MAX_BYTES = 5 * 1024 * 1024;

export function validateSave(
  value: unknown,
): { ok: true; game: Game } | { ok: false; error: string } {
  const oldBase = gameSchema.omit({ world: true });
  const previous = oldBase
    .extend({ schemaVersion: z.literal(2), rulesVersion: z.literal("0.2.0") })
    .safeParse(value);
  const legacy = oldBase
    .omit({ destiny: true })
    .extend({
      schemaVersion: z.literal(1),
      rulesVersion: z.literal("0.1.0"),
      ending: z.enum(["legacy", "extinction"]).nullable(),
    })
    .safeParse(value);
  const migrated = previous.success
    ? {
        ...previous.data,
        schemaVersion: 3,
        rulesVersion: "0.3.0",
        world: emptyWorld(),
      }
    : legacy.success
      ? {
          ...legacy.data,
          schemaVersion: 3,
          rulesVersion: "0.3.0",
          world: emptyWorld(),
          destiny: {
            ...emptyDestiny(),
            nextAt: Math.min(168, Math.max(4, legacy.data.cycle + 1)),
          },
        }
      : value;
  const parsed = gameSchema.safeParse(migrated);
  if (!parsed.success)
    return {
      ok: false,
      error:
        "Arquivo incompatível ou incompleto. Esta versão aceita partidas 0.1.0, 0.2.0 e 0.3.0.",
    };
  const g = parsed.data,
    people = new Set(g.inhabitants.map((p) => p.id)),
    events = new Set(g.history.map((e) => e.id));
  const alive = living(g).length;
  const bad =
    people.size !== g.inhabitants.length ||
    events.size !== g.history.length ||
    new Set(g.buildings.map((b) => b.id)).size !== g.buildings.length ||
    new Set(g.traditions).size !== g.traditions.length ||
    new Set(g.commandLog.map((c) => c.id)).size !== g.commandLog.length ||
    !validWorld(g, people) ||
    alive > 60 ||
    g.metrics.peak < alive ||
    g.nextPerson <=
      Math.max(...g.inhabitants.map((p) => Number(p.id.slice(1)))) ||
    g.nextEvent <= Math.max(0, ...g.history.map((e) => e.id)) ||
    g.metrics.deaths !== g.inhabitants.filter((p) => !p.alive).length ||
    g.inhabitants.some((p) =>
      p.alive
        ? p.health === 0 || p.diedAt !== null || p.activity === "dead"
        : p.health !== 0 ||
          p.diedAt === null ||
          p.diedAt > g.cycle ||
          p.activity !== "dead",
    ) ||
    g.history.some(
      (e) =>
        e.cycle > g.cycle ||
        e.actorIds.some((id) => !people.has(id)) ||
        e.relatedEventIds.some((id) => !events.has(id) || id >= e.id),
    ) ||
    g.effects.some(
      (e) =>
        e.targetCycle !== g.cycle + 1 ||
        e.actorIds.some((id) => !people.has(id)),
    ) ||
    g.commandLog.some(
      (c) =>
        c.targetCycle > g.cycle ||
        !(c.key === "world"
          ? WORLD_ACTIONS.includes(c.value as (typeof WORLD_ACTIONS)[number]) &&
            g.history.some(
              (e) =>
                e.evidence.worldAction === c.value && e.cycle === c.targetCycle,
            )
          : c.key === "decision"
            ? (() => {
                const [id, o, ...extra] = c.value.split("/");
                return (
                  !extra.length &&
                  decisionById(id)?.options.some((x) => x.id === o) &&
                  g.destiny.resolved.some(
                    (r) =>
                      r.id === id &&
                      r.option === o &&
                      r.cycle === c.targetCycle,
                  )
                );
              })()
            : c.key === "destination"
              ? c.value === g.ending
              : policySchema.safeParse({ ...g.policies, [c.key]: c.value })
                  .success),
    ) ||
    new Set(g.destiny.resolved.map((r) => r.id)).size !==
      g.destiny.resolved.length ||
    new Set(g.destiny.unlocked).size !== g.destiny.unlocked.length ||
    g.destiny.resolved.some(
      (r) =>
        r.cycle > g.cycle ||
        !decisionById(r.id)?.options.some((o) => o.id === r.option),
    ) ||
    (g.destiny.pending !== null &&
      (!decisionById(g.destiny.pending) ||
        g.status === "ended" ||
        g.destiny.resolved.some((r) => r.id === g.destiny.pending))) ||
    (g.status === "running" &&
      (g.ending !== null || g.cycle >= 160 || !alive)) ||
    (g.status === "ended" &&
      (g.ending === null ||
        (g.ending === "extinction" && alive !== 0) ||
        (g.ending !== "extinction" && !alive) ||
        (g.ending === "legacy" && g.cycle !== 160) ||
        (g.ending !== null &&
          !["legacy", "extinction"].includes(g.ending) &&
          !destinationChecks(g, g.ending).every((c) => c.ok))));
  if (bad)
    return {
      ok: false,
      error:
        "A partida contém referências ou valores inconsistentes. O jogo atual foi preservado.",
    };
  return { ok: true, game: g };
}
function validWorld(g: Game, people: Set<string>) {
  const w = g.world,
    p = w.grove,
    d = w.discovery,
    v = w.voyage;
  if (
    p &&
    (p.startedAt > g.cycle ||
      p.progress > g.cycle - p.startedAt ||
      new Set(p.workers).size !== p.workers.length ||
      p.workers.some((id) => !people.has(id)) ||
      (p.progress === 0 && p.workers.length > 0))
  )
    return false;
  if (
    v &&
    (v.startedAt > g.cycle ||
      (v.returnedAt !== null &&
        (v.returnedAt > g.cycle || v.returnedAt < v.startedAt + 2)))
  )
    return false;
  if (
    w.commemoratedAt !== null &&
    (w.commemoratedAt > g.cycle || w.commemoratedAt < 5)
  )
    return false;
  if (
    d.appearedAt !== null &&
    (!p ||
      p.progress !== 3 ||
      d.appearedAt < p.startedAt + 4 ||
      d.appearedAt > g.cycle)
  )
    return false;
  if (
    (d.resolvedAt === null) !== (d.choice === null) ||
    (d.resolvedAt !== null &&
      (d.appearedAt === null ||
        d.resolvedAt <= d.appearedAt ||
        d.resolvedAt > g.cycle))
  )
    return false;
  return true;
}
export function parseSave(text: string) {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    return { ok: false as const, error: "O arquivo excede o limite de 5 MiB." };
  try {
    return validateSave(JSON.parse(text));
  } catch {
    return {
      ok: false as const,
      error: "Não foi possível ler este JSON. O jogo atual foi preservado.",
    };
  }
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("civilizacao-de-bolso", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("saves");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () =>
      reject(new Error("Feche outras abas para atualizar o armazenamento."));
  });
}
let saveQueue: Promise<unknown> = Promise.resolve();
export function saveGame(game: Game): Promise<void> {
  const snapshot = structuredClone(game);
  const operation = saveQueue
    .catch(() => {})
    .then(async () => {
      const valid = validateSave(snapshot);
      if (!valid.ok) throw new Error(valid.error);
      const db = await database();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("saves", "readwrite"),
            store = tx.objectStore("saves"),
            r = store.get("current");
          r.onsuccess = () => {
            if (validateSave(r.result).ok) store.put(r.result, "previous");
            store.put(snapshot, "current");
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () =>
            reject(tx.error || new Error("Salvamento interrompido."));
        });
      } finally {
        db.close();
      }
    });
  saveQueue = operation;
  return operation;
}
export async function loadGame(): Promise<{
  game: Game | null;
  recovered: boolean;
}> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("saves", "readonly"),
        store = tx.objectStore("saves"),
        a = store.get("current"),
        b = store.get("previous");
      tx.oncomplete = () => {
        const current = validateSave(a.result),
          previous = validateSave(b.result);
        resolve(
          current.ok
            ? { game: current.game, recovered: false }
            : previous.ok
              ? { game: previous.game, recovered: true }
              : { game: null, recovered: false },
        );
      };
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function exportGame(game: Game) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `civilizacao-${game.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .slice(0, 45)}-${game.cycle}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
