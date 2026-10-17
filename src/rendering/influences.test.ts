import { it, expect } from "vitest";
import { optionPaths, influenceGain, PATH_STYLE } from "./influences";
import { createGame } from "../simulation/engine";
import { DECISIONS, PATH_INFO } from "../simulation/destinies";
import { PATHS } from "../simulation/model";
it("a cor principal acompanha o maior ganho possível, inclusive no limite", () => {
  const g = createGame(),
    o = { paths: { knowledge: 12, spirit: 4 } };
  expect(optionPaths(o, g)[0]).toBe("knowledge");
  g.destiny.scores.knowledge = 100;
  expect(optionPaths(o, g)[0]).toBe("spirit");
  expect(influenceGain(g, o, "knowledge")).toBe(0);
  g.destiny.scores.spirit = 98;
  expect(influenceGain(g, o, "spirit")).toBe(2);
});
it("todos os conselhos têm uma classificação e a legenda usa as mesmas cores", () => {
  for (const d of DECISIONS)
    for (const o of d.options) expect(optionPaths(o).length).toBeGreaterThan(0);
  for (const p of PATHS) expect(PATH_STYLE[p].color).toBe(PATH_INFO[p].color);
  expect(new Set(PATHS.map((k) => PATH_STYLE[k].color)).size).toBe(6);
});
