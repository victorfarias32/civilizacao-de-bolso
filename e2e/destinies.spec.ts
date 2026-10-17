import { test, expect, type Page } from "@playwright/test";
import { createGame, advanceSeason } from "../src/simulation/engine";
import type { Game } from "../src/simulation/model";
import { DESTINATIONS } from "../src/simulation/destinies";
async function scene(page: Page, g: Game) {
  await page.locator("input[type=file]").setInputFiles({
    name: "destino.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await expect(
    page.getByRole("heading", { name: g.name, exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(100);
}
async function pixels(page: Page) {
  return page.locator("canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement,
      ctx = c.getContext("2d")!,
      data = ctx.getImageData(0, 0, 480, 320).data;
    let hash = 2166136261;
    for (let i = 0; i < data.length; i += 4)
      hash = Math.imul(hash ^ data[i], 16777619);
    return {
      signature: String(hash),
      nature: Array.from(ctx.getImageData(320, 195, 30, 30).data),
      knowledge: Array.from(ctx.getImageData(110, 65, 55, 55).data),
    };
  });
}
test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("reduced-motion", "true"));
  await page.reload();
});
test("conselho oferece três escolhas com efeitos reais, salva e revela paisagem", async ({
  page,
}) => {
  let g = createGame({ name: "Conselho verificável" });
  for (let i = 0; i < 3; i++) g = advanceSeason(g).state;
  await scene(page, g);
  await page.getByRole("button", { name: "4×", exact: true }).click();
  await page
    .getByRole("button", { name: "Retomar simulação", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Que tipo de povo queremos ser?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retomar simulação", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Construir instrumentos/ }).click();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-paths",
    "knowledge",
  );
  await page.getByRole("button", { name: "Destinos", exact: false }).click();
  await expect(
    page.getByText("Conhecimento · 12/100", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "O horizonte impossível" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Concluir a história/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Partida", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText(
    "História salva neste aparelho",
  );
  await page.reload();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-paths",
    "knowledge",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("influências combinam pixels e cada destino tem um cenário distinto", async ({
  page,
}, info) => {
  const g = createGame({ name: "Mistura visual" });
  g.cycle = 112;
  g.resources.food = 30000;
  g.resources.wood = 500;
  g.confidence = 90;
  await scene(page, g);
  const base = await pixels(page);
  g.destiny.scores.nature = 48;
  await scene(page, g);
  const nature = await pixels(page);
  g.destiny.scores.knowledge = 48;
  await scene(page, g);
  const mixed = await pixels(page);
  expect(nature.nature).not.toEqual(base.nature);
  expect(mixed.nature).toEqual(nature.nature);
  expect(mixed.knowledge).not.toEqual(nature.knowledge);
  for (const key of Object.keys(
    g.destiny.scores,
  ) as (keyof typeof g.destiny.scores)[])
    g.destiny.scores[key] = 60;
  const fingerprints = new Set<string>();
  for (const d of DESTINATIONS.filter((d) => d.id !== "extinction")) {
    g.name = `Cenário ${d.id}`;
    g.cycle = 159;
    g.status = "running";
    g.ending = null;
    const end =
      d.id === "legacy"
        ? (() => {
            const legacy = structuredClone(g);
            for (const k of Object.keys(
              legacy.destiny.scores,
            ) as (keyof typeof legacy.destiny.scores)[])
              legacy.destiny.scores[k] = 0;
            return advanceSeason(legacy).state;
          })()
        : advanceSeason(g, [
            {
              id: 1,
              targetCycle: 160,
              sequence: 0,
              key: "destination",
              value: d.id,
            },
          ]).state;
    await scene(page, end);
    await expect(page.locator(".pixel-world")).toHaveAttribute(
      "data-ending",
      d.id,
    );
    fingerprints.add((await pixels(page)).signature);
    await page.locator(".pixel-viewport").screenshot({
      path: `test-results/${info.project.name}-ending-${d.id}.png`,
    });
  }
  expect(fingerprints.size).toBe(8);
});
