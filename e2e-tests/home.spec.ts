import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on the card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('filters roles by department and location, and resets the filters', async ({ page }) => {
        await page.goto('/');
        const visibleRoles = page.locator('[data-testid="role-card"]:visible');

        await page.getByTestId('department-filter').selectOption('Finance');
        await expect(visibleRoles).toHaveCount(2);

        await page.getByTestId('location-filter').selectOption('Woodinville, WA, USA');
        await expect(visibleRoles).toHaveCount(1);
        await expect(visibleRoles.getByRole('heading', { name: 'Financial Analyst' })).toBeVisible();

        await page.getByTestId('title-search').fill('analyst');
        await page.getByTestId('reset-filters').click();
        await expect(page.getByTestId('title-search')).toHaveValue('');
        await expect(visibleRoles).toHaveCount(expectedRoleCount);
    });

    test('searches role titles as the input changes and restores results when cleared', async ({ page }) => {
        await page.goto('/');
        const visibleRoles = page.locator('[data-testid="role-card"]:visible');
        const titleSearch = page.getByTestId('title-search');

        await expect(page.getByLabel('Search by title')).toBeVisible();
        await titleSearch.fill('fRoNtEnD');
        await expect(visibleRoles).toHaveCount(1);
        await expect(visibleRoles.getByRole('heading', { name: 'Senior Frontend Engineer' }))
            .toBeVisible();

        await titleSearch.clear();
        await expect(visibleRoles).toHaveCount(expectedRoleCount);
    });

    test('combines title search with department and location filters', async ({ page }) => {
        await page.goto('/');
        const visibleRoles = page.locator('[data-testid="role-card"]:visible');

        await page.getByTestId('title-search').fill('analyst');
        await page.getByTestId('department-filter').selectOption('Finance');
        await page.getByTestId('location-filter').selectOption('Woodinville, WA, USA');

        await expect(visibleRoles).toHaveCount(1);
        await expect(visibleRoles.getByRole('heading', { name: 'Financial Analyst' })).toBeVisible();
    });

    test('shows an empty state when the title search has no matches', async ({ page }) => {
        await page.goto('/');
        const titleSearch = page.getByTestId('title-search');

        await titleSearch.fill('role title that does not exist');

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(0);
        await expect(page.getByTestId('filter-empty-state')).toBeVisible();
        await expect(page.getByTestId('filter-empty-state'))
            .toContainText('No roles match your search and filters');
    });

    test('shows an empty state when no roles match', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').selectOption('Finance');
        await page.getByTestId('location-filter').selectOption('Remote (US & Canada)');

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(0);
        await expect(page.getByTestId('filter-empty-state')).toBeVisible();
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
