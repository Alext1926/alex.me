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

        await page.getByTestId('reset-filters').click();
        await expect(visibleRoles).toHaveCount(expectedRoleCount);
    });

    test('searches titles case-insensitively and combines with the other filters', async ({ page }) => {
        await page.goto('/');
        const visibleRoles = page.locator('[data-testid="role-card"]:visible');
        const search = page.getByTestId('role-search');

        await search.fill('fInAnCiAl aNaLySt');
        const financialAnalyst = page.getByTestId('role-card').filter({
            has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
        });
        await expect(financialAnalyst).toBeVisible();
        await expect(visibleRoles).toHaveCount(1);

        await page.getByTestId('department-filter').selectOption('Finance');
        await page.getByTestId('location-filter').selectOption('Woodinville, WA, USA');
        await expect(visibleRoles).toHaveCount(1);

        await search.fill('');
        await expect(visibleRoles).toHaveCount(1);
        await page.getByTestId('reset-filters').click();
        await expect(visibleRoles).toHaveCount(expectedRoleCount);
    });

    test('shows and clears the empty state for an unmatched title search', async ({ page }) => {
        await page.goto('/');
        const visibleRoles = page.locator('[data-testid="role-card"]:visible');
        const emptyState = page.getByTestId('filter-empty-state');

        await page.getByTestId('role-search').fill('No such role');
        await expect(visibleRoles).toHaveCount(0);
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText('No roles match your title search and selected filters.');

        await page.getByTestId('role-search').fill('');
        await expect(visibleRoles).toHaveCount(expectedRoleCount);
        await expect(emptyState).toBeHidden();
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
