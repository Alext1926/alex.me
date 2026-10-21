/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

export interface JobFilters {
    department: string;
    location: string;
}

type JobFilterTarget = Pick<Job, 'slug' | 'department' | 'location'>;

/**
 * Return jobs whose titles contain the query, ignoring case and surrounding whitespace.
 *
 * @param jobs - The roles to search.
 * @param query - The title text to match; an empty or whitespace-only query matches all roles.
 * @returns A new array containing matching roles without mutating the input.
 */
export function searchJobs<T extends Pick<Job, 'title'>>(jobs: T[], query: string): T[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return [...jobs];
    }

    return jobs.filter((job) => job.title.toLowerCase().includes(normalizedQuery));
}

/**
 * Return jobs matching the selected department and location without mutating the input.
 *
 * @param jobs - The roles to filter.
 * @param filters - The selected department and location; empty values are ignored.
 * @returns A new array containing roles that match every selected filter.
 */
export function filterJobs<T extends JobFilterTarget>(jobs: T[], filters: JobFilters): T[] {
    return jobs.filter((job) =>
        (!filters.department || job.department === filters.department) &&
        (!filters.location || job.location === filters.location),
    );
}

/**
 * Return jobs sorted by posted date, newest first.
 *
 * @param jobs - The roles to sort.
 * @returns A new array sorted from newest to oldest without mutating the input.
 */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 *
 * @param iso - The date string to format.
 * @returns The formatted date, or the original value when it is unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
