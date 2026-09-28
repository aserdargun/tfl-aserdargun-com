import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Expected strings come from the lab's own canonical sources, never from prose
// invented here: the manifest owns routes, titles and the evidence policy.
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../lab.manifest.json', import.meta.url)), 'utf8'),
) as {
  tagline: Record<string, string>;
  experiments: { id: string; title: Record<string, string>; route: string }[];
  evidencePolicy: { allowedKinds: string[] };
  evidence: { kind: string }[];
};

const experiment = (id: string) => {
  const found = manifest.experiments.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown manifest experiment: ${id}`);
  return found;
};

/** Presses Tab until the target control holds focus, proving tab order reaches it. */
async function tabTo(page: import('@playwright/test').Page, selector: string) {
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((el) => el === document.activeElement).catch(() => false))
      return;
  }
  throw new Error(`Tab order never reached ${selector}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(manifest.tagline.en);
});

test('every manifest experiment route loads its own experiment and heading', async ({ page }) => {
  for (const declared of manifest.experiments) {
    await page.goto(declared.route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(manifest.tagline.en);
    // The loaded-experiment status is the routing surface a reader sees first.
    await expect(page.locator('.experiment-status b')).toHaveText(declared.title.en);
    await expect(page.locator('.lab-toolbar')).toBeVisible();
  }
});

test('language controls change the rendered locale in both directions', async ({ page }) => {
  const heading = page.getByRole('heading', { level: 1 });
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  await expect(heading).toHaveText(manifest.tagline.tr);
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  // The language choice is carried in the URL so a reload keeps the locale.
  await expect(page).toHaveURL(/[?&]lang=tr(&|$)/);

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(heading).toHaveText(manifest.tagline.en);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.goto('/?lang=tr');
  await expect(heading).toHaveText(manifest.tagline.tr);
});

test('the step control is reachable and operable by keyboard alone', async ({ page }) => {
  // Step is only enabled once the experiment has requests to advance.
  await page.goto(experiment('single').route);
  const clock = page.getByTestId('clock');
  const seconds = async () => Number((await clock.innerText()).replace(' s', ''));
  await expect(clock).toHaveText('0.000 s');

  await tabTo(page, '.playback [data-ils-action="step"]');
  // The clock reports the time at the start of the most recent tick, so the
  // assertion is monotone progression rather than a hardcoded tick label.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect.poll(seconds).toBeGreaterThan(0);
  const advanced = await seconds();
  await page.keyboard.press('Enter');
  await expect.poll(seconds).toBeGreaterThan(advanced);

  // Reset is the paired control and must be equally keyboard-operable.
  await tabTo(page, '.playback [data-ils-action="reset"]');
  await page.keyboard.press('Enter');
  await expect(clock).toHaveText('0.000 s');
});

test('rendered evidence never claims a kind the evidence policy forbids', async ({ page }) => {
  await page.goto(experiment('kv').route);
  // The shared shell exposes each evidence record's kind as a data attribute,
  // so this checks the shipped contract instead of any numeric result.
  const kinds = await page.locator('[data-evidence-kind]').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('data-evidence-kind')),
  );
  expect(kinds.length).toBeGreaterThan(0);
  for (const kind of kinds) {
    expect(manifest.evidencePolicy.allowedKinds).toContain(kind);
    expect(kind).not.toBe('measured');
  }
  for (const record of manifest.evidence)
    expect(manifest.evidencePolicy.allowedKinds).toContain(record.kind);
  await expect(page.locator('.ils-policy')).not.toBeEmpty();
});

test('desktop and mobile viewports render without horizontal overflow', async ({ page }) => {
  for (const size of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(experiment('burst').route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#laboratory')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      size.width,
    );
  }
});
