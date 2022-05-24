import got from 'got';
import { assert, describe, expect, it, vi } from 'vitest';

vi.mock('@sindresorhus/is', () => ({
    default: {
        string: () => {
            throw new Error('upps');
        },
    },
}));

describe('suite name', () => {
    it('should throw because loglevel is mocked with undefined value', async () => {
        await got('http://google.com');
    });
});