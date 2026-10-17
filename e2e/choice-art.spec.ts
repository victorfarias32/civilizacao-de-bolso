import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createGame } from "../src/simulation/engine";
import { PATHS, type Game } from "../src/simulation/model";
import { PATH_STYLE } from "../src/rendering/influences";
async function scene(page: Page, g: Game) {
  await page.locator("input[type=file]").setInputFiles({
    name: "paisagem.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await expect(
    page.getByRole("heading", { name: g.name, exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(90);
}
async function remember(page: Page) {
  await page.locator("canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement;
    (window as unknown as { artBaseline: Uint8ClampedArray }).artBaseline = c
      .getContext("2d")!
      .getImageData(0, 0, 480, 320).data;
  });
}
async function difference(page: Page) {
  return page.locator("canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement,
      data = c.getContext("2d")!.getImageData(0, 0, 480, 320).data,
      old = (window as unknown as { artBaseline: Uint8ClampedArray })
        .artBaseline;
    let pixels = 0;
    for (let i = 0; i < data.length; i += 4)
      if (
        Math.abs(data[i] - old[i]) +
          Math.abs(data[i + 1] - old[i + 1]) +
          Math.abs(data[i + 2] - old[i + 2]) >
        30
      )
        pixels++;
    return pixels;
  });
}
test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("reduced-motion", "true"));
  await page.reload();
});
test("as seis cores identificam ganhos reais, empates e limite de influência", async ({
  page,
}, info) => {
  const seen = new Set<string>();
  for (const [id, cycle] of [
    ["roots", 4],
    ["echoes", 12],
  ] as const) {
    const g = createGame({ name: `Escolhas ${id}` });
    g.cycle = cycle;
    g.destiny.pending = id;
    await scene(page, g);
    const cards = page.locator(".choice-card");
    await expect(cards).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i),
        path = await card.getAttribute("data-path");
      seen.add(path!);
      const color = await card.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--path-color"),
      );
      expect(color).toBe(PATH_STYLE[path as keyof typeof PATH_STYLE].color);
      await expect(card.locator(".choice-preview")).toContainText("No mundo:");
      await expect(card.locator(".choice-category")).toContainText("+12");
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    if (id === "roots")
      await page.locator(".council").screenshot({
        path: `test-results/${info.project.name}-colored-choices.png`,
      });
  }
  expect(seen.size).toBe(6);
  const g = createGame({ name: "Empate de caminhos" });
  g.cycle = 100;
  g.destiny.pending = "resonance";
  await scene(page, g);
  await expect(page.locator(".choice-card").first()).toHaveAttribute(
    "data-mixed",
    "true",
  );
  await expect(
    page.locator(".choice-card").first().locator(".choice-color-rail i"),
  ).toHaveCount(2);
  g.name = "Limite de influência";
  g.cycle = 52;
  g.destiny.pending = "dreams";
  g.destiny.scores.spirit = 100;
  await scene(page, g);
  await expect(
    page.getByRole("button", {
      name: /Investigar uma consciência compartilhada/,
    }),
  ).toHaveAttribute("data-path", "knowledge");
  await expect(
    page.getByRole("button", {
      name: /Investigar uma consciência compartilhada/,
    }),
  ).toContainText("Consciência +0 · máximo");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("cada caminho transforma uma área ampla e continua mudando entre marcos", async ({
  page,
}, info) => {
  for (const path of PATHS) {
    const base = createGame({ name: `Base ${path}` });
    base.cycle = 40;
    await scene(page, base);
    await remember(page);
    const early = structuredClone(base);
    early.name = `Primeiro bairro ${path}`;
    early.destiny.scores[path] = 12;
    await scene(page, early);
    expect.soft(await difference(page), path).toBeGreaterThan(700);
    await remember(page);
    const middle = structuredClone(early);
    middle.name = `Mais uma escolha ${path}`;
    middle.destiny.scores[path] = 18;
    await scene(page, middle);
    expect.soft(await difference(page), path).toBeGreaterThan(300);
    const late = structuredClone(early);
    late.name = `Paisagem transformada ${path}`;
    late.destiny.scores[path] = 72;
    await scene(page, late);
    expect.soft(await difference(page), path).toBeGreaterThan(1500);
    await page.locator(".pixel-viewport").screenshot({
      path: `test-results/${info.project.name}-district-${path}.png`,
    });
  }
  const mixed = createGame({ name: "Mundo de caminhos misturados" });
  mixed.cycle = 40;
  for (const path of PATHS) mixed.destiny.scores[path] = 48;
  await scene(page, mixed);
  await expect(page.locator(".world-influences .influence-chip")).toHaveCount(
    6,
  );
  await page.locator(".pixel-viewport").screenshot({
    path: `test-results/${info.project.name}-district-mixed.png`,
  });
});
