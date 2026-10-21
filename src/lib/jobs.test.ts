import { describe, it, expect } from 'vitest';
import { filterJobs, searchJobsByTitle, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('filterJobs', () => {
    const jobs = [
        { ...makeJob('frontend', '2027-01-01'), department: 'Technology', location: 'Remote' },
        { ...makeJob('analyst', '2027-01-02'), department: 'Finance', location: 'New York' },
        { ...makeJob('engineer', '2027-01-03'), department: 'Technology', location: 'New York' },
    ];

    it('filters by department', () => {
        expect(filterJobs(jobs, { department: 'Technology', location: '' }).map((job) => job.slug))
            .toEqual(['frontend', 'engineer']);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, { department: '', location: 'New York' }).map((job) => job.slug))
            .toEqual(['analyst', 'engineer']);
    });

    it('combines department and location filters', () => {
        expect(filterJobs(jobs, { department: 'Technology', location: 'New York' }).map((job) => job.slug))
            .toEqual(['engineer']);
    });

    it('returns all jobs when filters are reset', () => {
        expect(filterJobs(jobs, { department: '', location: '' })).toEqual(jobs);
    });

    it('returns no jobs when nothing matches', () => {
        expect(filterJobs(jobs, { department: 'Finance', location: 'Remote' })).toEqual([]);
    });
});

describe('searchJobsByTitle', () => {
    const jobs = [
        { ...makeJob('frontend', '2027-01-01'), title: 'Senior Frontend Engineer' },
        { ...makeJob('analyst', '2027-01-02'), title: 'Financial Analyst' },
        { ...makeJob('engineer', '2027-01-03'), title: 'Principal Software Engineer' },
    ];

    it('matches title text case-insensitively', () => {
        expect(searchJobsByTitle(jobs, 'fRoNtEnD').map((job) => job.slug)).toEqual(['frontend']);
    });

    it('trims the query and returns all jobs when it is empty', () => {
        expect(searchJobsByTitle(jobs, '  ')).toEqual(jobs);
    });

    it('returns no jobs when no title matches', () => {
        expect(searchJobsByTitle(jobs, 'research')).toEqual([]);
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
