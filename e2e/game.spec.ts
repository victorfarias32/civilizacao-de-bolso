import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createGame, advanceSeason } from "../src/simulation/engine";
import AxeBuilder from "@axe-core/playwright";

async function found(page: Page) {
  await page.goto("./");
  await page.getByLabel("Nome da comunidade").fill("Vale do Amanhã");
  await page.getByRole("button", { name: /Fundar civilização/ }).click();
  await expect(
    page.getByRole("heading", { name: "Vale do Amanhã", exact: true }),
  ).toBeVisible();
}
async function importGame(page: Page, game: ReturnType<typeof createGame>) {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Fundar civilização/ }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "historia.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(game)),
    });
  await expect(
    page.getByRole("heading", { name: game.name, exact: true }),
  ).toBeVisible();
}

test("partida por toque, políticas, exportação e retomada", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await found(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${info.project.name}-game.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "+ Estação" }).click();
  await page.getByRole("button", { name: /Políticas/ }).click();
  await page.getByRole("radio", { name: /Trabalho intensivo/ }).check();
  await expect(page.getByText("Para a próxima estação")).toBeVisible();
  await page.getByRole("button", { name: "+ Estação" }).click();
  await expect(page.getByText("Para a próxima estação")).not.toBeVisible();
  await page.getByRole("button", { name: /Pessoas/ }).click();
  await page.locator(".people-list button").first().click();
  await expect(page.locator(".person-detail")).toBeVisible();
  await page.getByRole("button", { name: /Partida/ }).click();
  await expect(page.getByText("História salva neste aparelho")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar história · JSON" }).click();
  const file = await (await download).path();
  const data = JSON.parse(await readFile(file!, "utf8"));
  expect(data.cycle).toBe(2);
  expect(data.policies.work).toBe("intensive");
  await page.reload();
  await page.getByRole("button", { name: /Continuar Vale do Amanhã/ }).click();
  await page.getByRole("button", { name: /Partida/ }).click();
  await expect(page.locator("dd").filter({ hasText: "2/160" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("importação inválida preserva a história", async ({ page }) => {
  await found(page);
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "ruim.json",
      mimeType: "application/json",
      buffer: Buffer.from("{"),
    });
  await expect(page.getByRole("status")).toContainText("preservado");
  await expect(
    page.getByRole("heading", { name: "Vale do Amanhã", exact: true }),
  ).toBeVisible();
});

test("dois finais reais e avanço bloqueado", async ({ page }, info) => {
  const g = createGame({ name: "A última estação" });
  g.cycle = 159;
  g.resources.food = 50000;
  await importGame(page, g);
  await page.getByRole("button", { name: "+ Estação" }).click();
  await expect(
    page.getByRole("heading", {
      name: "O legado dos fundadores",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Estação" })).toBeDisabled();
  await page.screenshot({
    path: `test-results/${info.project.name}-legacy.png`,
    fullPage: true,
  });
  const dead = createGame({ name: "O vale silencioso" });
  dead.inhabitants.forEach((p) => (p.age = 319));
  const extinction = advanceSeason(dead).state;
  page.on("dialog", (d) => d.accept());
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "extincao.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(extinction)),
    });
  await expect(
    page.getByRole("heading", {
      name: "O último silêncio",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Estação" })).toBeDisabled();
});

test("offline recupera uma partida e continua sem rede", async ({
  page,
  context,
}) => {
  await found(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByRole("button", { name: "+ Estação" }).click();
  await page.getByRole("button", { name: /Partida/ }).click();
  await expect(page.getByText("História salva neste aparelho")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByRole("button", { name: "+ Estação" }).click();
  await page.getByRole("button", { name: /Partida/ }).click();
  await expect(page.locator("dd").filter({ hasText: "2/160" })).toBeVisible();
  await context.setOffline(false);
});

test("tempo pausa quando a página é ocultada", async ({ page }) => {
  await found(page);
  await page.getByRole("button", { name: "Retomar simulação" }).click();
  await expect(
    page.getByRole("button", { name: "Pausar simulação" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Retomar simulação" }),
  ).toBeVisible();
});

test("interface oferece rótulos e contraste acessíveis", async ({ page }) => {
  await found(page);
  for (const name of ["Crônica", "Pessoas", "Políticas", "Destinos", "Partida"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
});
