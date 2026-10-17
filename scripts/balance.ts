import { writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
  createGame,
  advanceSeason,
  deriveSummary,
} from "../src/simulation/engine";
import type { Command, Game } from "../src/simulation/model";
const results = [];
const times: number[] = [];
for (let seed = 1; seed <= 20; seed++)
  for (const strategy of ["careful", "intensive", "accelerated", "adaptive"]) {
    let g = createGame({ seed }),
      id = 1;
    for (let i = 0; i < 160 && g.status === "running"; i++) {
      const commands: Command[] = [],
        summary = deriveSummary(g);
      const choose = (key: Command["key"], value: string) => {
        if (g.policies[key] !== value)
          commands.push({
            id: id++,
            key,
            value,
            targetCycle: i + 1,
            sequence: commands.length,
          });
      };
      if (strategy === "intensive") choose("work", "intensive");
      if (strategy === "accelerated") choose("extraction", "accelerated");
      if (strategy === "adaptive")
        choose(
          "work",
          summary.reserve < 1.2 && summary.energy > 55
            ? "intensive"
            : "moderate",
        );
      const t = performance.now();
      g = advanceSeason(g, commands).state;
      times.push(performance.now() - t);
    }
    const s = deriveSummary(g);
    results.push({
      seed,
      strategy,
      ending: g.ending,
      cycle: g.cycle,
      population: s.population,
      food: g.resources.food,
      health: s.health,
      confidence: g.confidence,
      fertility: g.environment.fertility,
      forest: g.environment.forest,
      births: g.metrics.births,
      deaths: g.metrics.deaths,
      events: g.history.length,
    });
  }
times.sort((a, b) => a - b);
const report = {
  rulesVersion: "0.1.0",
  method:
    "Seeds 1–20, 160 estações; moderado/cuidadoso, intensivo/cuidadoso, moderado/acelerado e adaptativo (intensivo se reserva <1.2 e energia >55; demais políticas padrão).",
  runs: results.length,
  p95Milliseconds: times[Math.floor(times.length * 0.95)],
  results,
};
mkdirSync("docs/validacao", { recursive: true });
writeFileSync(
  "docs/validacao/balance.json",
  JSON.stringify(report, null, 2) + "\n",
);
for (const strategy of ["careful", "intensive", "accelerated", "adaptive"]) {
  const subset = results.filter((r) => r.strategy === strategy);
  console.log(
    strategy,
    JSON.stringify({
      legacy: subset.filter((r) => r.ending === "legacy").length,
      extinction: subset.filter((r) => r.ending === "extinction").length,
      averagePopulation: subset.reduce((n, r) => n + r.population, 0) / 20,
      averageCycle: subset.reduce((n, r) => n + r.cycle, 0) / 20,
    }),
  );
}
console.log(
  "p95 lógica (ambiente Node):",
  report.p95Milliseconds.toFixed(2),
  "ms",
);
