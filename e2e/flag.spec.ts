import { test, expect } from "@playwright/test";

test("build a flag: drag, add sticker, rename, download with name", async ({ page }) => {
    await page.goto("/");
    const flag = page.locator('div[style*="aspect-ratio"]').first();
    await expect(flag).toBeVisible();

    // the default emblem starts selected - drag it to the upper-left
    const box = (await flag.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.26, { steps: 10 });
    await page.mouse.up();

    // open the Stickers panel and add a second sticker from the grid
    await page.getByRole("button", { name: "Stickers", exact: true }).click();
    await page.getByRole("button", { name: "Add Crown emblem to flag" }).click();
    await expect(page.getByText(/2 on the flag/)).toBeVisible();

    // rename inside the Save panel
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByPlaceholder("Republic of ...").fill("Kingdom of Dragons");

    // download and assert the PNG filename comes from the name
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Flag" }).click()]);
    expect(dl.suggestedFilename()).toBe("kingdom-of-dragons.png");
});

test("no sticker, switch shapes, still downloads", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Stickers", exact: true }).click();
    await page.getByRole("button", { name: "Remove all emblems" }).click();
    await expect(page.getByText(/0 on the flag/)).toBeVisible();

    await page.getByRole("button", { name: "Shape", exact: true }).click();
    await page.getByRole("button", { name: "Stars + Stripes", exact: true }).click();

    await page.getByRole("button", { name: "Save", exact: true }).click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Flag" }).click()]);
    expect(dl.suggestedFilename()).toMatch(/\.png$/);
});
