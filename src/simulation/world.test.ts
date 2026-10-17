import { describe, it, expect } from "vitest";
import { createGame, advanceSeason } from "./engine";
import {
  applyWorldAction,
  advanceWorld,
  groveCanAdvance,
  worldVisit,
} from "./world";
import { type Game, type Command, demand } from "./model";
import { validateSave, parseSave } from "../persistence/storage";
function act(g: Game, value: string) {
  const c: Command = {
    id: Math.max(0, ...g.commandLog.map((c) => c.id)) + 1,
    sequence: 0,
    targetCycle: g.cycle + 1,
    key: "world",
    value,
  };
  return advanceSeason(g, [c]).state;
}
function step(g: Game, n = 1) {
  for (let i = 0; i < n; i++) g = advanceSeason(g).state;
  return g;
}
describe("lugares e projetos persistentes", () => {
  it("cobra uma vez e rejeita ações repetidas, desconhecidas e sem recursos", () => {
    const g = createGame();
    expect(applyWorldAction(g, "grove:river", 1)).toBe(true);
    expect(g.resources).toEqual({ food: 2280, wood: 320 });
    const once = structuredClone(g);
    expect(applyWorldAction(g, "grove:village", 1)).toBe(false);
    expect(applyWorldAction(g, "bogus", 1)).toBe(false);
    expect(g).toEqual(once);
    const poor = createGame();
    poor.resources.food = 0;
    const before = structuredClone(poor);
    expect(applyWorldAction(poor, "voyage", 1)).toBe(false);
    expect(poor).toEqual(before);
  });
  it("a obra tem etapas reais, participantes e só revela a luz após crescer", () => {
    let g = act(createGame(), "grove:river");
    expect(g.world.grove?.progress).toBe(0);
    expect(g.world.discovery.appearedAt).toBeNull();
    for (const stage of [1, 2, 3]) {
      g = step(g);
      expect(g.world.grove?.progress).toBe(stage);
      expect(g.world.grove?.workers.length).toBeGreaterThan(0);
      expect(validateSave(g).ok).toBe(true);
    }
    expect(g.destiny.scores.nature).toBe(12);
    expect(g.world.discovery.appearedAt).toBeNull();
    g = step(g);
    expect(g.world.discovery.appearedAt).toBe(5);
    const pending = structuredClone(g);
    expect(applyWorldAction(g, "discovery:study", 6)).toBe(true);
    expect(g.destiny.scores.knowledge).toBe(8);
    expect(g.destiny.scores.spirit).toBe(4);
    expect(g.environment.forest).toBe(pending.environment.forest - 3);
    expect(applyWorldAction(g, "discovery:protect", 6)).toBe(false);
  });
  it("escassez pausa a obra e retomar custa energia dos participantes", () => {
    const g = act(createGame(), "grove:village");
    g.cycle++;
    g.resources.food = 0;
    const energy = g.inhabitants.map((p) => p.energy);
    expect(groveCanAdvance(g)).toBe(false);
    advanceWorld(g);
    expect(g.world.grove?.progress).toBe(0);
    expect(g.inhabitants.map((p) => p.energy)).toEqual(energy);
    g.resources.food = demand(g);
    advanceWorld(g);
    expect(g.world.grove?.progress).toBe(1);
    for (const id of g.world.grove!.workers) {
      const i = g.inhabitants.findIndex((p) => p.id === id);
      expect(g.inhabitants[i].energy).toBe(energy[i] - 4);
      expect(worldVisit(g, g.inhabitants[i], i)?.kind).toBe("build");
    }
  });
  it("os dois locais têm consequências diferentes sem sorteio adicional", () => {
    const finish = (site: string) => {
      const g = act(createGame(), `grove:${site}`);
      g.world.grove!.progress = 2;
      g.cycle = 4;
      g.resources.food = 20000;
      g.environment.fertility = 50;
      g.environment.forest = 50;
      g.confidence = 50;
      const rng = g.rngState;
      advanceWorld(g);
      expect(g.rngState).toBe(rng);
      return g;
    };
    const river = finish("river"),
      village = finish("village");
    expect(river.environment.fertility).toBe(60);
    expect(village.environment.fertility).toBe(55);
    expect(river.confidence).toBe(52);
    expect(village.confidence).toBe(57);
  });
  it("o barco retorna após duas estações e entrega madeira uma única vez", () => {
    let g = act(createGame(), "voyage");
    g = step(g);
    expect(g.world.voyage?.returnedAt).toBeNull();
    g = step(g);
    expect(g.world.voyage?.returnedAt).toBe(3);
    expect(g.destiny.scores.voyage).toBe(6);
    const wood = g.resources.wood;
    advanceWorld(g);
    expect(g.resources.wood).toBe(wood);
    expect(g.history.filter((e) => e.title === "O barco voltou")).toHaveLength(
      1,
    );
    expect(validateSave(g).ok).toBe(true);
  });
  it("a celebração usa habitantes reais e preserva a decisão no salvamento", () => {
    let g = step(createGame(), 4);
    g = act(g, "commemorate");
    expect(g.world.commemoratedAt).toBe(5);
    const e = g.history.find((e) => e.evidence.worldAction === "commemorate")!;
    expect(e.actorIds).toHaveLength(4);
    expect(
      e.actorIds.every((id) => g.inhabitants.some((p) => p.id === id)),
    ).toBe(true);
    expect(g.destiny.scores.memory).toBe(6);
    const parsed = parseSave(JSON.stringify(g));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(step(parsed.game, 5)).toEqual(step(g, 5));
  });
  it("a descoberta preservada tem efeito próprio e não pode ser investigada antes", () => {
    let g = createGame();
    const before = structuredClone(g);
    expect(applyWorldAction(g, "discovery:protect", 1)).toBe(false);
    expect(g).toEqual(before);
    g = step(act(g, "grove:village"), 4);
    g = act(g, "discovery:protect");
    expect(g.world.discovery.choice).toBe("protect");
    expect(g.destiny.scores.nature).toBe(18);
    expect(g.destiny.scores.memory).toBe(6);
    expect(validateSave(g).ok).toBe(true);
    const saved = parseSave(JSON.stringify(g));
    expect(saved.ok).toBe(true);
    if (saved.ok) expect(step(saved.game, 4)).toEqual(step(g, 4));
  });
  it("migra 0.2.0 com influências e decisões intactas e rejeita uma etapa impossível", () => {
    let g = step(createGame(), 4);
    g = advanceSeason(g, [
      {
        id: 1,
        sequence: 0,
        targetCycle: 5,
        key: "decision",
        value: "roots/study",
      },
    ]).state;
    const { world: _, ...old } = g;
    const result = validateSave({
      ...old,
      schemaVersion: 2,
      rulesVersion: "0.2.0",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.destiny).toEqual(g.destiny);
      expect(result.game.world.grove).toBeNull();
      expect(result.game.history).toEqual(g.history);
    }
    const broken = createGame();
    broken.world.grove = {
      site: "river",
      startedAt: 1,
      progress: 3,
      workers: [],
    };
    expect(validateSave(broken).ok).toBe(false);
  });
  it("salva todas as etapas e reproduz a descoberta após recarregar", () => {
    let g = act(createGame(), "grove:river");
    for (let i = 0; i < 5; i++) {
      const parsed = parseSave(JSON.stringify(g));
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(step(parsed.game)).toEqual(step(g));
      g = step(g);
    }
  });
});
