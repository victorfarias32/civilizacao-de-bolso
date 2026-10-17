import { test, expect, type Page } from "@playwright/test";
import { createGame } from "../src/simulation/engine";
import type { Game, HistoryEvent } from "../src/simulation/model";

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
});

test("ampliar o mundo permite explorar detalhes sem alargar a página", async ({page}) => {
  await page.goto('./');
  await page.getByRole('button',{name:/Fundar civilização/}).click();
  await page.getByRole('button',{name:'Ampliar mundo',exact:false}).click();
  const zoom=await page.locator('.pixel-viewport').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
  expect(zoom.scroll).toBeGreaterThan(zoom.width*1.9);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.pixel-viewport').evaluate(el=>{el.scrollLeft=el.clientWidth/2;el.scrollTop=el.clientHeight/2});
  await page.getByRole('button',{name:'Visão completa',exact:false}).click();
  const normal=await page.locator('.pixel-viewport').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
  expect(normal.scroll).toBeLessThanOrEqual(normal.width+1);
});

async function importScene(page: Page, g: Game) {
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "cenario.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(g)),
    });
  await expect(
    page.getByRole("heading", { name: g.name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-season",
    String((g.status === "ended" ? Math.max(0, g.cycle - 1) : g.cycle) % 4),
  );
  await page.waitForTimeout(80);
}
async function pixels(page: Page) {
  return page.locator("canvas").evaluate((element) => {
    const c = element as HTMLCanvasElement,
      d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let digest = 2166136261,
      white = 0;
    for (let i = 0; i < d.length; i += 4) {
      digest = Math.imul(digest ^ d[i], 16777619);
      digest = Math.imul(digest ^ d[i + 1], 16777619);
      digest = Math.imul(digest ^ d[i + 2], 16777619);
      if (d[i] > 180 && d[i + 1] > 180 && d[i + 2] > 175) white++;
    }
    return { digest: digest >>> 0, white };
  });
}
function event(
  g: Game,
  type: HistoryEvent["type"],
  evidence: HistoryEvent["evidence"] = {},
) {
  g.history.push({
    id: g.nextEvent++,
    cycle: g.cycle,
    type,
    title: `Vestígio de ${type}`,
    text: "Cenário de verificação visual.",
    actorIds: [],
    evidence,
    relatedEventIds: [],
  });
}

test("quatro estações mudam o cenário completo, incluindo neve e gelo", async ({
  page,
}, info) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Fundar civilização/ }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("reduced-motion", "true"));
  await page.reload();
  const samples = [];
  for (let season = 0; season < 4; season++) {
    const g = createGame({ name: `Estação ${season}` });
    g.cycle = season;
    await importScene(page, g);
    samples.push(await pixels(page));
    await page
      .locator(".pixel-viewport")
      .screenshot({
        path: `test-results/${info.project.name}-season-${season}.png`,
      });
  }
  expect(new Set(samples.map((s) => s.digest)).size).toBe(4);
  expect(samples[3].white).toBeGreaterThan(samples[0].white + 15000);
});

test("acontecimentos alteram os pixels do mundo, não só os avisos", async ({
  page,
}, info) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Fundar civilização/ }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("reduced-motion", "true"));
  await page.reload();
  const base = createGame({ name: "Referência visual" });
  base.cycle = 4;
  await importScene(page, base);
  const baseline = await pixels(page);
  const cases: [HistoryEvent["type"], (g: Game) => void][] = [
    ["policy", (g) => (g.policies.work = "intensive")],
    [
      "scarcity",
      (g) => {
        g.resources.food = 0;
        g.metrics.scarce = true;
        g.inhabitants.forEach((p) => (p.hunger = 50));
      },
    ],
    ["recovery", () => {}],
    ["birth", () => {}],
    [
      "death",
      (g) => {
        const p = g.inhabitants[0];
        p.alive = false;
        p.health = 0;
        p.activity = "dead";
        p.diedAt = g.cycle;
        g.metrics.deaths = 1;
      },
    ],
    [
      "building",
      (g) =>
        g.buildings.push({ id: 4, integrity: 100, progress: 4, readyAt: 4 }),
    ],
    ["repair", () => {}],
    ["drought", () => {}],
    ["disease", () => {}],
    ["cooperation", () => {}],
    ["tradition", (g) => (g.traditions = ["reserves", "shelter"])],
    ["era", (g) => (g.era = "community")],
    [
      "ending",
      (g) => {
        g.cycle = 160;
        g.status = "ended";
        g.ending = "legacy";
      },
    ],
  ];
  for (const [type, setup] of cases) {
    const g = structuredClone(base);
    g.name = `Cena ${type}`;
    setup(g);
    event(g, type, { buildingId: 1 });
    if (type === "disease") g.history[g.history.length - 1].actorIds = ["h001"];
    await importScene(page, g);
    const image = await pixels(page);
    expect(
      image.digest,
      `o evento ${type} deve deixar um vestígio no Canvas`,
    ).not.toBe(baseline.digest);
    if (["drought", "birth", "tradition", "ending"].includes(type))
      await page
        .locator(".pixel-viewport")
        .screenshot({
          path: `test-results/${info.project.name}-event-${type}.png`,
        });
  }
});
