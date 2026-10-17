import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createGame } from "../src/simulation/engine";
import { type Game } from "../src/simulation/model";
async function load(page: Page, g: Game) {
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "lugar.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(g)),
    });
  await expect(
    page.getByRole("heading", { name: g.name, exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(90);
}
async function signature(page: Page) {
  return page.locator("canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement,
      data = c.getContext("2d")!.getImageData(140, 110, 85, 75).data;
    let n = 2166136261;
    for (let i = 0; i < data.length; i += 4)
      n = Math.imul(n ^ data[i] ^ data[i + 1] ^ data[i + 2], 16777619);
    return n;
  });
}
test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("reduced-motion", "true"));
  await page.reload();
});
test("o jogador escolhe o local, acompanha a obra e investiga a descoberta pelo mapa", async ({
  page,
}, info) => {
  await page.getByRole("button", { name: /Fundar civilização/ }).click();
  await page
    .getByRole("button", { name: "Examinar observatório", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Observatório", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: /Planejar um bosque experimental/ })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Local para o bosque: Margem do rio",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Local para o bosque: Margem do rio",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Começar o bosque: Margem do rio",
      exact: true,
    })
    .click();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-project-stage",
    "0",
  );
  for (const stage of [1, 2, 3]) {
    await page
      .getByRole("button", { name: "Acompanhar próxima estação", exact: true })
      .click();
    await expect(page.locator(".pixel-world")).toHaveAttribute(
      "data-project-stage",
      String(stage),
    );
  }
  await expect(
    page.getByText("O bosque cresceu.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Observar o bosque por uma estação",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Investigar luz do bosque", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Investigar luz do bosque", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A luz entre as raízes", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Investigar com instrumentos", exact: true })
    .click();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-discovery",
    "study",
  );
  await expect(
    page.getByText("Os instrumentos continuam registrando", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar lugar", exact: true }).click();
  await page.getByRole("button", { name: "Partida", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText(
    "História salva neste aparelho",
  );
  await page.reload();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await expect(page.locator(".pixel-world")).toHaveAttribute(
    "data-discovery",
    "study",
  );
  await page
    .locator(".pixel-viewport")
    .screenshot({
      path: `test-results/${info.project.name}-interactive-grove.png`,
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("porto e memorial têm ações reais, foco e contraste acessíveis", async ({
  page,
}) => {
  const g = createGame({ name: "Lugares com histórias" });
  g.cycle = 8;
  await load(page, g);
  await page
    .getByRole("button", { name: "Examinar porto", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Enviar provisões com os viajantes",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Viagem em andamento", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Acompanhar próxima estação", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Acompanhar próxima estação", exact: true })
    .click();
  await expect(
    page.getByText("O barco voltou na estação", { exact: false }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Examinar porto", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Examinar memorial", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Celebrar a fundação", exact: true })
    .click();
  await expect(
    page.getByText("A fundação foi celebrada", { exact: false }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
test("as etapas e os dois destinos da descoberta mudam os pixels na mesma estação", async ({
  page,
}, info) => {
  const g = createGame({ name: "Etapas do bosque" });
  g.cycle = 28;
  g.world.grove = { site: "river", startedAt: 24, progress: 0, workers: [] };
  const versions = new Set<number>();
  for (const stage of [0, 1, 2, 3]) {
    g.name = `Bosque etapa ${stage}`;
    g.world.grove.progress = stage;
    await load(page, g);
    versions.add(await signature(page));
    await page
      .locator(".pixel-viewport")
      .screenshot({
        path: `test-results/${info.project.name}-grove-${stage}.png`,
      });
  }
  expect(versions.size).toBe(4);
  g.world.discovery = { appearedAt: 28, resolvedAt: 29, choice: "study" };
  g.cycle = 29;
  g.name = "Bosque estudado";
  await load(page, g);
  const study = await signature(page);
  g.world.discovery.choice = "protect";
  g.name = "Bosque protegido";
  await load(page, g);
  expect(await signature(page)).not.toBe(study);
});
