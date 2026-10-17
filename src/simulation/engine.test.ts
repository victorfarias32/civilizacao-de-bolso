import { describe, it, expect } from "vitest";
import {
  createGame,
  advanceSeason,
  allocate,
  deriveSummary,
  epilogue,
} from "./engine";
import { living, gameSchema, type Game, type Command } from "./model";
import { parseSave, validateSave } from "../persistence/storage";

const steps = (g: Game, n: number) => {
  for (let i = 0; i < n; i++) g = advanceSeason(g).state;
  return g;
};
const command = (
  value = "intensive",
  key: Command["key"] = "work",
  cycle = 1,
): Command => ({ id: 1, targetCycle: cycle, sequence: 0, key, value });
describe("simulação reproduzível", () => {
  it("normaliza seed zero e não altera a entrada", () => {
    const g = createGame({ seed: 0 }),
      before = JSON.stringify(g);
    expect(g.rngState).toBeGreaterThan(0);
    advanceSeason(g, [command()]);
    expect(JSON.stringify(g)).toBe(before);
  });
  it("reproduz 160 ciclos incluindo política e eventos", () => {
    const run = () => {
      let g = createGame({ seed: 981 });
      for (let i = 0; i < 160; i++)
        g = advanceSeason(
          g,
          i === 4 ? [command("accelerated", "extraction", 5)] : [],
        ).state;
      return g;
    };
    expect(run()).toEqual(run());
  });
  it("rejeita comandos fora do ciclo, duplicados e valores inválidos", () => {
    let g = createGame();
    g = advanceSeason(g, [
      command("impossible"),
      command("intensive", "work", 3),
    ]).state;
    expect(g.commandLog).toHaveLength(0);
    g = advanceSeason(g, [
      command("intensive", "work", 2),
      command("moderate", "work", 2),
    ]).state;
    expect(g.commandLog).toHaveLength(1);
    expect(g.policies.work).toBe("intensive");
    expect(
      advanceSeason(g, [command("moderate", "work", 3)]).state.policies.work,
    ).toBe("intensive");
  });
  it("trabalho intenso produz mais inicialmente e exige mais energia", () => {
    const a = advanceSeason(createGame()).state,
      b = advanceSeason(createGame(), [command()]).state;
    expect(b.resources.food).toBeGreaterThan(a.resources.food);
    expect(deriveSummary(b).energy).toBeLessThan(deriveSummary(a).energy);
    const after = steps(b, 11);
    expect(
      after.inhabitants.some((p) => p.energy < 40 || p.activity === "rest"),
    ).toBe(true);
  });
  it("estoque e necessidades respeitam invariantes em várias trajetórias", () => {
    for (let seed = 1; seed <= 10; seed++) {
      let g = createGame({ seed });
      if (seed % 2) g.policies.extraction = "accelerated";
      for (let i = 0; i < 160; i++) {
        g = advanceSeason(g).state;
        expect(g.resources.food).toBeGreaterThanOrEqual(0);
        expect(g.resources.wood).toBeGreaterThanOrEqual(0);
        expect(living(g).length).toBeLessThanOrEqual(60);
        expect(gameSchema.safeParse(g).success).toBe(true);
        expect(validateSave(g).ok).toBe(true);
      }
    }
  });
});
describe("distribuição e necessidades", () => {
  it("distribui até a oferta exata e respeita tetos", () => {
    for (const total of [0, 1, 59, 60, 99, 200, 999])
      for (const weights of [
        [0, 0, 0],
        [1, 2, 5],
        [10, 1, 1],
      ]) {
        const caps = [60, 100, 100],
          r = allocate(total, caps, weights);
        expect(r.reduce((a, b) => a + b, 0)).toBe(Math.min(total, 260));
        r.forEach((n, i) => expect(n).toBeLessThanOrEqual(caps[i]));
      }
  });
  it("não atribui fome sem déficit e registra escassez real", () => {
    const safe = advanceSeason(createGame()).state;
    expect(safe.history.some((e) => e.type === "scarcity")).toBe(false);
    const g = createGame();
    g.resources.food = 0;
    g.environment.wildFood = 0;
    g.environment.fertility = 0;
    const bad = advanceSeason(g).state;
    expect(bad.inhabitants.every((p) => p.hunger > 0)).toBe(true);
    expect(bad.history.filter((e) => e.type === "scarcity")).toHaveLength(1);
    expect(
      advanceSeason(bad).state.history.filter((e) => e.type === "scarcity"),
    ).toHaveLength(1);
  });
  it("descanso recupera e pessoas debilitadas não coletam", () => {
    const g = createGame();
    g.inhabitants[0].health = 30;
    g.inhabitants[0].energy = 10;
    const p = advanceSeason(g).state.inhabitants[0];
    expect(p.activity).toBe("rest");
    expect(p.energy).toBe(38);
    expect(p.contribution).toBe(0);
  });
  it("contribuição conserva alimento mesmo com crianças e repouso", () => {
    const g = createGame();
    g.policies.distribution = "contribution";
    g.resources.food = 1;
    g.environment.fertility = 0;
    g.environment.wildFood = 0;
    g.inhabitants[0].age = 0;
    const next = advanceSeason(g).state;
    expect(
      next.inhabitants.reduce((n, p) => n + p.received, 0) +
        next.resources.food,
    ).toBe(1);
    expect(next.inhabitants[0].activity).toBe("child");
  });
});
describe("ambiente, abrigos e gerações", () => {
  it("extração acelerada degrada fertilidade e cuidadosa recupera", () => {
    const g = createGame();
    g.environment.fertility = 70;
    expect(advanceSeason(g).state.environment.fertility).toBe(71);
    expect(
      advanceSeason(g, [command("accelerated", "extraction")]).state.environment
        .fertility,
    ).toBe(68);
  });
  it("não constrói sem material nem cobra duas vezes a mesma obra", () => {
    const g = createGame();
    g.resources.food = 10000;
    g.resources.wood = 0;
    g.buildings = [];
    expect(advanceSeason(g).state.buildings).toHaveLength(0);
    g.resources.wood = 400;
    g.inhabitants.forEach((p) => (p.aptitude = "building"));
    const next = advanceSeason(g).state;
    expect(next.resources.wood).toBe(280);
    expect(next.buildings[0].progress).toBe(4);
    expect(next.buildings[0].readyAt).toBe(2);
    expect(next.inhabitants.every((p) => !p.sheltered)).toBe(true);
  });
  it("reparo recupera integridade sem cobrança duplicada", () => {
    const g = createGame();
    g.resources.food = 20000;
    g.buildings[0].integrity = 40;
    const next = advanceSeason(g).state;
    expect(next.resources.wood).toBe(380);
    expect(next.buildings[0].integrity).toBe(58);
    expect(next.history.filter((e) => e.type === "repair")).toHaveLength(1);
  });
  it("velhice produz uma única despedida", () => {
    const g = createGame();
    g.inhabitants[0].age = 319;
    const next = steps(g, 3);
    expect(
      next.history.filter(
        (e) => e.type === "death" && e.actorIds.includes("h001"),
      ),
    ).toHaveLength(1);
  });
  it("não nasce criança sem vagas nem acima do limite", () => {
    const g = createGame();
    g.cycle = 3;
    g.resources.food = 20000;
    expect(advanceSeason(g).state.metrics.births).toBe(0);
  });
  it("recém-nascido só consome na estação seguinte", () => {
    let found = false;
    for (let seed = 1; seed <= 20 && !found; seed++) {
      const g = createGame({ seed });
      g.cycle = 3;
      g.counters.surplus = 3;
      g.resources.food = 20000;
      g.buildings.push({ id: 4, integrity: 100, progress: 4, readyAt: 0 });
      const next = advanceSeason(g).state,
        baby = next.inhabitants.find((p) => p.age === 0);
      if (baby) {
        found = true;
        expect(baby.received).toBe(0);
        expect(
          advanceSeason(next).state.inhabitants.find((p) => p.id === baby.id)
            ?.received,
        ).toBe(60);
      }
    }
    expect(found).toBe(true);
  });
});
describe("eventos, memória e destino", () => {
  it("partidas normais alcançam os dois destinos sem adulterar recursos", () => {
    const safe = steps(createGame({ seed: 42 }), 160);
    expect(safe.ending).toBe("legacy");
    const risky = createGame({ seed: 42 });
    risky.policies.extraction = "accelerated";
    const collapsed = steps(risky, 160);
    expect(collapsed.ending).toBe("extinction");
    expect(collapsed.cycle).toBeLessThan(160);
  });
  it("evento anunciado age no próximo ciclo e expira", () => {
    const g = createGame();
    g.effects = [{ type: "drought", targetCycle: 1, actorIds: [] }];
    g.environment.wildFood = 0;
    g.inhabitants.forEach((p) => (p.health = 30));
    const next = advanceSeason(g).state;
    expect(next.environment.wildFood).toBe(1200);
    expect(next.effects.some((e) => e.type === "drought")).toBe(false);
  });
  it("não sorteia estiagem ou doença sem antecedentes", () => {
    const g = advanceSeason(createGame()).state;
    expect(g.history.some((e) => ["drought", "disease"].includes(e.type))).toBe(
      false,
    );
  });
  it("comunidade exige quatro estações e registra uma transição", () => {
    const g = createGame();
    g.resources.food = 50000;
    expect(steps(g, 3).era).toBe("survival");
    const next = steps(g, 4);
    expect(next.era).toBe("community");
    expect(next.history.filter((e) => e.type === "era")).toHaveLength(1);
  });
  it("tradição exige memória e não se duplica", () => {
    const g = createGame();
    g.resources.food = 50000;
    g.metrics.hadFamine = true;
    const next = steps(g, 8);
    expect(next.traditions.filter((t) => t === "reserves")).toHaveLength(1);
    expect(steps(createGame(), 4).traditions).not.toContain("reserves");
  });
  it("extinção vence legado no mesmo ciclo e congela o estado", () => {
    const g = createGame();
    g.cycle = 159;
    g.inhabitants.forEach((p) => (p.age = 319));
    const next = advanceSeason(g).state;
    expect(next.ending).toBe("extinction");
    expect(next.cycle).toBe(160);
    expect(advanceSeason(next, [command()])).toEqual({
      state: next,
      events: [],
    });
    expect(next.history.filter((e) => e.type === "ending")).toHaveLength(1);
  });
  it("sobreviventes aos 40 anos geram legado e epílogo factual", () => {
    const g = createGame();
    g.cycle = 159;
    g.resources.food = 50000;
    const next = advanceSeason(g).state;
    expect(next.ending).toBe("legacy");
    expect(epilogue(next).paragraphs.join(" ")).toContain(
      `${living(next).length} pessoas`,
    );
    expect(epilogue(next).paragraphs.join(" ")).not.toContain("tradições:");
  });
});
describe("intercâmbio de partidas", () => {
  it("round-trip preserva inclusive os próximos 20 ciclos", () => {
    const g = steps(createGame({ seed: 821 }), 12),
      r = parseSave(JSON.stringify(g));
    expect(r.ok).toBe(true);
    if (r.ok) expect(steps(r.game, 20)).toEqual(steps(g, 20));
  });
  it("rejeita truncado, versão futura, duplicação, referências e arquivo grande", () => {
    expect(parseSave("{").ok).toBe(false);
    for (const change of [
      (g: Game) => {
        (g as unknown as { rulesVersion: string }).rulesVersion = "99";
      },
      (g: Game) => {
        g.inhabitants.push({ ...g.inhabitants[0] });
      },
      (g: Game) => {
        g.history[0].actorIds = ["h999"];
      },
      (g: Game) => {
        g.resources.food = -1;
      },
      (g: Game) => {
        g.rngState = 0;
      },
    ]) {
      const g = createGame();
      change(g);
      expect(parseSave(JSON.stringify(g)).ok).toBe(false);
    }
    expect(parseSave(" ".repeat(5 * 1024 * 1024 + 1)).ok).toBe(false);
  });
});
