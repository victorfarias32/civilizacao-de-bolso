import { test, expect } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createGame } from "../src/simulation/engine";

async function start(page: import("@playwright/test").Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /Fundar civilização/ }).click();
  await page.getByRole("button", { name: /Partida/ }).click();
  await expect(page.getByText("História salva neste aparelho")).toBeVisible();
}

test("recupera a cópia anterior quando o slot atual está corrompido", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "+ Estação" }).click();
  await expect(page.getByText("História salva neste aparelho")).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open("civilizacao-de-bolso", 1);
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction("saves", "readwrite");
          tx.objectStore("saves").put({ broken: true }, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await expect(page.getByRole("status")).toContainText("cópia anterior");
  await page.getByRole("button", { name: /Continuar/ }).click();
  await expect(
    page.getByRole("heading", { name: "Vale das Pequenas Luzes", exact: true }),
  ).toBeVisible();
});

test("atualização avisa, salva e só recarrega por decisão do jogador", async ({
  page,
}) => {
  const path = "dist/sw.js",
    original = await readFile(path, "utf8");
  try {
    await start(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: "+ Estação" }).click();
    await writeFile(
      path,
      original + "\n// Teste de atualização controlada " + Date.now() + "\n",
    );
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r?.update();
    });
    await expect(page.getByText("Uma nova versão está pronta.")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole("heading", {
        name: "Vale das Pequenas Luzes",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Guardar e atualizar" }).click();
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: /Partida/ }).click();
    await expect(page.locator("dd").filter({ hasText: "1/160" })).toBeVisible();
  } finally {
    await writeFile(path, original);
  }
});

test("falha de escrita preserva memória e permite exportação", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Fundar civilização/ }),
  ).toBeVisible();
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<IDBDatabase["transaction"]>
    ) {
      if (args[1] === "readwrite")
        throw new DOMException("Quota cheia", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page.getByRole("button", { name: /Fundar civilização/ }).click();
  await expect(page.getByRole("status")).toContainText("armazenamento falhou");
  await page.getByRole("button", { name: "+ Estação" }).click();
  await page.getByRole("button", { name: /Partida/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar história · JSON" }).click();
  const path = await (await download).path();
  const saved = JSON.parse(await readFile(path!, "utf8"));
  expect(saved.cycle).toBe(1);
});

test("mapa e controles comportam 60 habitantes em viewport mínimo", async ({
  page,
}, info) => {
  const g = createGame({ name: "Sessenta histórias" });
  for (let n = 13; n <= 60; n++)
    g.inhabitants.push({
      ...g.inhabitants[(n - 1) % 12],
      id: `h${String(n).padStart(3, "0")}`,
      name: `Pessoa ${n}`,
    });
  g.nextPerson = 61;
  g.metrics.peak = 60;
  g.metrics.births = 48;
  g.buildings = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    integrity: 100,
    progress: 4,
    readyAt: 0,
  }));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Fundar civilização/ }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "sessenta.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(g)),
    });
  await expect(
    page.getByRole("heading", { name: "Sessenta histórias", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const measured = await page.evaluate(async () => {
    let draws = 0;
    const original = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (
      ...args: Parameters<CanvasRenderingContext2D["clearRect"]>
    ) {
      draws++;
      return original.apply(this, args);
    };
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 1500));
    const duration = performance.now() - start;
    CanvasRenderingContext2D.prototype.clearRect = original;
    return {
      fps: Math.round((draws * 1000) / duration),
      duration,
      userAgent: navigator.userAgent,
      width: innerWidth,
      height: innerHeight,
      population: 60,
    };
  });
  await mkdir("docs/validacao", { recursive: true });
  await writeFile(
    `docs/validacao/browser-${info.project.name}.json`,
    JSON.stringify(measured, null, 2) + "\n",
  );
  await page.screenshot({
    path: `test-results/${info.project.name}-sixty.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /Pessoas/ }).click();
  await expect(page.locator(".people-list button")).toHaveCount(60);
});
