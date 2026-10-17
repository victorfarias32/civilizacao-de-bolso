import { describe, it, expect } from "vitest";
import { createGame, advanceSeason, epilogue } from "./engine";
import {
  DECISIONS,
  DESTINATIONS,
  decisionById,
  canAfford,
  applyDecision,
  readyDestinations,
  hybridParagraphs,
} from "./destinies";
import { type Game, type Ending, type PathKey } from "./model";
import { validateSave } from "../persistence/storage";
function play(id: Ending) {
  const target = DESTINATIONS.find((d) => d.id === id)!;
  let g = createGame(),
    serial = 0;
  while (g.status === "running") {
    if (readyDestinations(g).some((d) => d.id === id))
      return advanceSeason(g, [
        {
          id: ++serial,
          targetCycle: g.cycle + 1,
          sequence: 0,
          key: "destination",
          value: id,
        },
      ]).state;
    const d = decisionById(g.destiny.pending);
    const score = (o: NonNullable<typeof d>["options"][number]) =>
      Object.entries(o.paths).reduce(
        (sum, [k, v]) =>
          sum +
          (v! * (target.paths[k as PathKey] || 0)) /
            Math.max(12, g.destiny.scores[k as PathKey] + 12),
        0,
      );
    const o = d?.options
      .filter((o) => canAfford(g, o))
      .sort((a, b) => score(b) - score(a))[0];
    g = advanceSeason(
      g,
      o
        ? [
            {
              id: ++serial,
              targetCycle: g.cycle + 1,
              sequence: 0,
              key: "decision",
              value: `${d!.id}/${o.id}`,
            },
          ]
        : [],
    ).state;
    expect(validateSave(g).ok).toBe(true);
  }
  return g;
}
describe("destinos construídos por escolhas", () => {
  for (const d of DESTINATIONS.filter(
    (d) => !["legacy", "extinction"].includes(d.id),
  ))
    it(`alcança ${d.id} numa partida real e congela o desfecho`, () => {
      const g = play(d.id);
      expect(g.ending).toBe(d.id);
      expect(g.cycle).toBeGreaterThanOrEqual(112);
      expect(g.cycle).toBeLessThanOrEqual(160);
      expect(g.destiny.resolved.length).toBeGreaterThan(5);
      expect(validateSave(g).ok).toBe(true);
      expect(advanceSeason(g).state).toBe(g);
      expect(epilogue(g).title).toBe(d.title);
      expect(g.history.filter((e) => e.type === "ending")).toHaveLength(1);
    });
  it("reproduz escolhas, crises e descobertas com a mesma semente", () =>
    expect(play("cosmic")).toEqual(play("cosmic")));
  it("rejeita escolha não oferecida, sem recursos e repetida sem cobrar", () => {
    const g = createGame();
    expect(applyDecision(g, "roots/study", 1)).toBe(false);
    g.destiny.pending = "roots";
    g.resources.wood = 0;
    const original = structuredClone(g);
    expect(applyDecision(g, "roots/study", 1)).toBe(false);
    expect(g).toEqual(original);
    g.resources.wood = 100;
    expect(applyDecision(g, "roots/study", 1)).toBe(true);
    expect(g.resources.wood).toBe(40);
    expect(g.destiny.scores.knowledge).toBe(12);
    const once = structuredClone(g);
    expect(applyDecision(g, "roots/study", 2)).toBe(false);
    expect(g).toEqual(once);
  });
  it("não permite encerrar antes das condições nem escolhe pelo jogador", () => {
    let g = createGame();
    g = advanceSeason(g, [
      {
        id: 1,
        sequence: 0,
        targetCycle: 1,
        key: "destination",
        value: "cosmic",
      },
    ]).state;
    expect(g.status).toBe("running");
    expect(g.commandLog).toHaveLength(0);
    while (g.cycle < 12) g = advanceSeason(g).state;
    expect(g.destiny.pending).toBe("roots");
    expect(g.destiny.resolved).toHaveLength(0);
  });
  it("migra a partida antiga sem apagar sua história e rejeita versões futuras", () => {
    let g = createGame();
    for (let i = 0; i < 8; i++) g = advanceSeason(g).state;
    const { destiny: _, world: _world, ...old } = g;
    const result = validateSave({
      ...old,
      schemaVersion: 1,
      rulesVersion: "0.1.0",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.history).toEqual(g.history);
      expect(result.game.resources).toEqual(g.resources);
      expect(result.game.destiny.scores.knowledge).toBe(0);
      expect(result.game.destiny.nextAt).toBe(9);
    }
    expect(
      validateSave({ ...old, schemaVersion: 99, rulesVersion: "99" }).ok,
    ).toBe(false);
  });
  it("preserva decisão pendente no JSON e rejeita referências impossíveis", () => {
    let g = createGame();
    for (let i = 0; i < 4; i++) g = advanceSeason(g).state;
    expect(validateSave(JSON.parse(JSON.stringify(g))).ok).toBe(true);
    g.destiny.pending = "inexistente";
    expect(validateSave(g).ok).toBe(false);
  });
  it("mistura a crônica sem apagar influências anteriores", () => {
    const g = createGame();
    g.destiny.scores.nature = 24;
    g.destiny.scores.knowledge = 24;
    g.destiny.scores.spirit = 24;
    g.destiny.scores.memory = 24;
    expect(hybridParagraphs(g)).toHaveLength(2);
    expect(new Set(DECISIONS.map((d) => d.id)).size).toBe(DECISIONS.length);
  });
});
