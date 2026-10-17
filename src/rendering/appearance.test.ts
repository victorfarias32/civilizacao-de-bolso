import { describe, it, expect } from "vitest";
import { createGame } from "../simulation/engine";
import { appearance } from "./appearance";
import type { HistoryEvent } from "../simulation/model";

function record(type: HistoryEvent["type"], cycle: number) {
  return {
    id: 2,
    type,
    cycle,
    title: "Acontecimento real",
    text: "Registro",
    actorIds: ["h001"],
    evidence: { buildingId: 1 },
    relatedEventIds: [],
  };
}
describe("direção visual ligada à história", () => {
  it("separa as quatro estações e mantém o inverno no fim dos 40 anos", () => {
    const g = createGame();
    expect(
      [0, 1, 2, 3].map((cycle) => appearance({ ...g, cycle }).palette.name),
    ).toEqual(["Primavera", "Verão", "Outono", "Inverno"]);
    expect(
      appearance({ ...g, cycle: 160, status: "ended", ending: "legacy" })
        .palette.snow,
    ).toBe(true);
  });
  it("transforma eventos em sinais visuais sem alterar a simulação", () => {
    const g = createGame();
    g.cycle = 8;
    g.history.push(record("disease", 8));
    g.history[1].id = g.nextEvent++;
    g.effects = [{ type: "drought", targetCycle: 9, actorIds: [] }];
    const before = JSON.stringify(g),
      art = appearance(g);
    expect(art.drought).toBe(true);
    expect(art.sickIds.has("h001")).toBe(true);
    expect(art.cues[0].type).toBe("disease");
    expect(JSON.stringify(g)).toBe(before);
  });
  it("preserva memoriais e tradições, mas não repete uma festa de nascimento para sempre", () => {
    const g = createGame();
    g.cycle = 8;
    g.history.push(record("birth", 8));
    g.metrics.deaths = 3;
    g.traditions = ["reserves", "shelter"];
    expect(appearance(g).birth).toBe(true);
    g.cycle = 12;
    const a = appearance(g);
    expect(a.birth).toBe(false);
    expect(a.memorial).toBe(3);
    expect(a.reserves && a.shelter).toBe(true);
  });
});
