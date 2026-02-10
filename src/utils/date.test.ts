import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
    it('should format a valid ISO string correctly', () => {
        const date = '2026-02-10';
        expect(formatDate(date)).toBe('10/02/2026');
    });

    it('should return fallback for undefined date', () => {
        expect(formatDate(undefined)).toBe('--/--/----');
    });

    it('should return fallback for invalid date string', () => {
        expect(formatDate('invalid-date')).toBe('--/--/----');
    });

    it('should support custom format strings', () => {
        const date = '2026-02-10T15:30:00';
        expect(formatDate(date, 'dd/MM/yyyy HH:mm')).toBe('10/02/2026 15:30');
    });
});
