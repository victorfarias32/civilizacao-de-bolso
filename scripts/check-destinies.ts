import { createGame, advanceSeason } from "../src/simulation/engine";
import {
  decisionById,
  canAfford,
  destinationChecks,
  DESTINATIONS,
} from "../src/simulation/destinies";
import type { PathKey } from "../src/simulation/model";
for (const d of DESTINATIONS.filter(
  (d) => !["legacy", "extinction"].includes(d.id),
)) {
  let g = createGame(),
    n = 0;
  const weights = d.paths;
  while (g.status === "running") {
    const decision = decisionById(g.destiny.pending);
    const options = decision?.options.filter((o) => canAfford(g, o));
    const o = options?.sort((a, b) => {
      const score = (o: typeof a) =>
        Object.entries(o.paths).reduce(
          (sum, [k, v]) =>
            sum +
            ((v || 0) * (weights[k as PathKey] || 0)) /
              Math.max(12, g.destiny.scores[k as PathKey] + 12),
          0,
        );
      return score(b) - score(a);
    })[0];
    g = advanceSeason(
      g,
      o
        ? [
            {
              id: ++n,
              sequence: 0,
              key: "decision",
              value: `${decision!.id}/${o.id}`,
              targetCycle: g.cycle + 1,
            },
          ]
        : [],
    ).state;
  }
  console.log(
    d.id,
    g.ending,
    g.destiny.scores,
    JSON.stringify(destinationChecks(g, d.id).filter((c) => !c.ok)),
    g.resources,
    g.confidence,
    g.environment,
  );
}
