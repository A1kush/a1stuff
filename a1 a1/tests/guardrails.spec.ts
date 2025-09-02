import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const gameUrl = pathToFileURL(path.resolve("a1 last update.html")).href;

async function open(page) {
  await page.goto(gameUrl);
  await page.waitForSelector("#cv");
  await page.waitForSelector("#btnInventory");
}

test.describe("Guardrails + Rage-Full Blessing", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("leader switch button works", async ({ page }) => {
    const before = await page.evaluate(() => window.game?.currentLeader());
    await page.evaluate(() =>
      (document.getElementById("btnSwitch") as HTMLElement)?.click()
    );
    const afterBtn = await page.evaluate(() => window.game?.currentLeader());
    expect(afterBtn).not.toBe(before);
  });

  test("manual rage only: auto does not trigger rage", async ({ page }) => {
    // Ensure auto is ON but allowAutoRage is false
    await page.evaluate(() => {
      window.game?.st && (window.game.st.auto = true);
    });
    // Fill leader rage and wait a moment
    await page.evaluate(() => window.game?.fillRage(undefined));
    await page.waitForTimeout(1200);
    const rageOn = await page.evaluate(
      () => !!window.game?.st?.players?.[window.game?.st?.leader || 0]?.rageOn
    );
    expect(rageOn).toBe(false);
  });

  test("Rage-full adds +3-5s to Unique S3 overT", async ({ page }) => {
    // Set leader to Unique (index 1)
    await page.evaluate(() => window.game?.setLeader(1));
    // Set HP pool to a known value
    await page.evaluate(() => {
      window.game!.st.hpMax = 1000;
      window.game!.st.hp = 1000;
    });
    // Fill rage to trigger blessing
    await page.evaluate(() => window.game?.fillRage(undefined));
    // Wait for the loop to notice rage became full and start DoT
    await page.waitForTimeout(100);
    // Cast S3
    await page.evaluate(() => window.game?.cast("S3"));
    // Read overT immediately
    const overT = await page.evaluate(() => window.game?.getOverT(undefined));
    expect(overT).toBeGreaterThanOrEqual(9000); // 7s base + 3s bonus - a bit of loop time
    // Wait for some time and ensure channel persists
    await page.waitForTimeout(1100);
    const overT2 = await page.evaluate(() => window.game?.getOverT(undefined));
    expect(overT2).toBeGreaterThan(0);
  });
});
