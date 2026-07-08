import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  parseBytes,
  getLargerByte,
  getSmallerByte,
  diffBytes,
  analyzeBytes,
} from './formatter.js';

describe('bytes-kit formatter', () => {
  describe('validation', () => {
    it('throws TypeError for non-finite values', () => {
      // @ts-expect-error - testing runtime type validation
      expect(() => formatBytes(undefined)).toThrow(TypeError);
      // @ts-expect-error - testing runtime type validation
      expect(() => formatBytes('1000')).toThrow(TypeError);
      expect(() => formatBytes(NaN)).toThrow(TypeError);
      expect(() => formatBytes(Infinity)).toThrow(TypeError);
      expect(() => formatBytes(-Infinity)).toThrow(TypeError);
    });
  });

  describe('decimal base-1000 (default)', () => {
    it('formats 0 correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats single digits and small values', () => {
      expect(formatBytes(9)).toBe('9 B');
      expect(formatBytes(999)).toBe('999 B');
    });

    it('formats KB and MB', () => {
      expect(formatBytes(1000)).toBe('1 KB');
      expect(formatBytes(1337)).toBe('1.34 KB');
      expect(formatBytes(999999)).toBe('1 MB'); // checks rounding overflow
      expect(formatBytes(1000000)).toBe('1 MB');
      expect(formatBytes(1500000)).toBe('1.5 MB');
    });

    it('formats large values up to YB', () => {
      expect(formatBytes(1e9)).toBe('1 GB');
      expect(formatBytes(1e12)).toBe('1 TB');
      expect(formatBytes(1e15)).toBe('1 PB');
      expect(formatBytes(1e18)).toBe('1 EB');
      expect(formatBytes(1e21)).toBe('1 ZB');
      expect(formatBytes(1e24)).toBe('1 YB');
      // beyond YB, keeps YB
      expect(formatBytes(1e27)).toBe('1000 YB');
    });
  });

  describe('binary base-1024', () => {
    it('formats small values', () => {
      expect(formatBytes(0, { binary: true })).toBe('0 B');
      expect(formatBytes(1023, { binary: true })).toBe('1023 B');
    });

    it('formats KiB and MiB', () => {
      expect(formatBytes(1024, { binary: true })).toBe('1 KiB');
      expect(formatBytes(1500, { binary: true })).toBe('1.46 KiB');
      expect(formatBytes(1024 * 1024, { binary: true })).toBe('1 MiB');
      expect(formatBytes(1.5 * 1024 * 1024, { binary: true })).toBe('1.5 MiB');
    });

    it('formats large binary units', () => {
      expect(formatBytes(Math.pow(1024, 3), { binary: true })).toBe('1 GiB');
      expect(formatBytes(Math.pow(1024, 4), { binary: true })).toBe('1 TiB');
      expect(formatBytes(Math.pow(1024, 5), { binary: true })).toBe('1 PiB');
      expect(formatBytes(Math.pow(1024, 6), { binary: true })).toBe('1 EiB');
      expect(formatBytes(Math.pow(1024, 7), { binary: true })).toBe('1 ZiB');
      expect(formatBytes(Math.pow(1024, 8), { binary: true })).toBe('1 YiB');
    });
  });

  describe('negative values', () => {
    it('formats negative numbers correctly', () => {
      expect(formatBytes(-1000)).toBe('-1 KB');
      expect(formatBytes(-1337)).toBe('-1.34 KB');
      expect(formatBytes(-1024, { binary: true })).toBe('-1 KiB');
    });
  });

  describe('custom decimalPlaces and fixedDecimals', () => {
    it('respects decimalPlaces', () => {
      expect(formatBytes(1337, { decimalPlaces: 0 })).toBe('1 KB');
      expect(formatBytes(1337, { decimalPlaces: 1 })).toBe('1.3 KB');
      expect(formatBytes(1337, { decimalPlaces: 3 })).toBe('1.337 KB');
    });

    it('respects fixedDecimals', () => {
      expect(formatBytes(1000, { decimalPlaces: 2, fixedDecimals: true })).toBe('1.00 KB');
      expect(formatBytes(1000, { decimalPlaces: 2, fixedDecimals: false })).toBe('1 KB');
      expect(formatBytes(1500, { decimalPlaces: 3, fixedDecimals: true })).toBe('1.500 KB');
      expect(formatBytes(0, { decimalPlaces: 2, fixedDecimals: true })).toBe('0.00 B');
    });
  });

  describe('spacing option', () => {
    it('can omit space between number and unit', () => {
      expect(formatBytes(1000, { space: false })).toBe('1KB');
      expect(formatBytes(1337, { space: false })).toBe('1.34KB');
      expect(formatBytes(1024, { binary: true, space: false })).toBe('1KiB');
    });
  });

  describe('forced units', () => {
    it('forces unit and formats value relative to forced unit', () => {
      expect(formatBytes(1000, { unit: 'B' })).toBe('1000 B');
      expect(formatBytes(1024, { unit: 'B', binary: true })).toBe('1024 B');
      expect(formatBytes(1e6, { unit: 'KB' })).toBe('1000 KB');
      expect(formatBytes(1024 * 1024 * 5, { unit: 'KiB' })).toBe('5120 KiB');
      expect(formatBytes(1000, { unit: 'MB', fixedDecimals: true })).toBe('0.00 MB');
      expect(formatBytes(1000, { unit: 'MB', decimalPlaces: 6 })).toBe('0.001 MB');
    });

    it('throws error for invalid forced unit', () => {
      // @ts-expect-error - testing invalid forced unit
      expect(() => formatBytes(1000, { unit: 'XYZ' })).toThrow();
    });
  });

  describe('locale formatting', () => {
    it('applies locale formatting', () => {
      expect(formatBytes(1234567, { locale: 'de-DE' })).toBe('1,23 MB');
      expect(formatBytes(1000000, { unit: 'KB', locale: 'de-DE', fixedDecimals: true, decimalPlaces: 2 })).toBe('1.000,00 KB');
    });
  });
});

describe('bytes-kit utilities', () => {
  describe('parseBytes', () => {
    it('parses strings without units as bytes', () => {
      expect(parseBytes('100')).toBe(100);
      expect(parseBytes('  12.5  ')).toBe(12.5);
    });

    it('parses decimal units (base-1000) case-insensitively', () => {
      expect(parseBytes('10 B')).toBe(10);
      expect(parseBytes('1.5 KB')).toBe(1500);
      expect(parseBytes('2 MB')).toBe(2000000);
      expect(parseBytes('1 gb')).toBe(1000000000);
      expect(parseBytes('2.5tb')).toBe(2500000000000);
    });

    it('parses binary units (base-1024) case-insensitively', () => {
      expect(parseBytes('1 KiB')).toBe(1024);
      expect(parseBytes('1.5 MiB')).toBe(1.5 * 1024 * 1024);
      expect(parseBytes('2 GiB')).toBe(2 * 1024 * 1024 * 1024);
      expect(parseBytes('1.25 tib')).toBe(1.25 * 1024 * 1024 * 1024 * 1024);
    });

    it('parses negative signs', () => {
      expect(parseBytes('-100 B')).toBe(-100);
      expect(parseBytes('-2.5 MB')).toBe(-2500000);
      expect(parseBytes('-1 KiB')).toBe(-1024);
    });

    it('throws errors for invalid formats or units', () => {
      expect(() => parseBytes('abc')).toThrow();
      expect(() => parseBytes('10 MBB')).toThrow();
      expect(() => parseBytes('10.5.5 MB')).toThrow();
      // @ts-expect-error - testing runtime type validation
      expect(() => parseBytes(null)).toThrow(TypeError);
    });
  });

  describe('getLargerByte', () => {
    it('returns the larger of two byte values formatted as a string', () => {
      expect(getLargerByte(1000, 2000)).toBe('2 KB');
      expect(getLargerByte('1 KB', '2 KB')).toBe('2 KB');
      expect(getLargerByte('2 KB', '1.5 MB')).toBe('1.5 MB');
      expect(getLargerByte('-100 B', '0 B')).toBe('0 B');
      expect(getLargerByte('1 KiB', '2 KiB', { binary: true })).toBe('2 KiB');
    });
  });

  describe('getSmallerByte', () => {
    it('returns the smaller of two byte values formatted as a string', () => {
      expect(getSmallerByte(1000, 2000)).toBe('1 KB');
      expect(getSmallerByte('1 KB', '2 KB')).toBe('1 KB');
      expect(getSmallerByte('2 KB', '1.5 MB')).toBe('2 KB');
      expect(getSmallerByte('-100 B', '0 B')).toBe('-100 B');
    });
  });

  describe('diffBytes', () => {
    it('returns the difference (a - b) formatted as a string', () => {
      expect(diffBytes(2000, 500)).toBe('1.5 KB');
      expect(diffBytes('2 KB', '1 KB')).toBe('1 KB');
      expect(diffBytes('1 KB', '2 KB')).toBe('-1 KB');
      expect(diffBytes('1 MiB', '1 MB')).toBe('48.58 KB');
      expect(diffBytes('1.5 MB', '500 KB', { decimalPlaces: 0 })).toBe('1 MB');
    });
  });

  describe('analyzeBytes', () => {
    it('analyzes an array of byte sizes returning formatted stats', () => {
      const stats = analyzeBytes(['1 KB', 2000, '1.5 MB']);
      expect(stats.largest).toBe('1.5 MB');
      expect(stats.smallest).toBe('1 KB');
      expect(stats.average).toBe('501 KB');

      const binaryStats = analyzeBytes(['1 KiB', '2 KiB'], { binary: true });
      expect(binaryStats.largest).toBe('2 KiB');
      expect(binaryStats.smallest).toBe('1 KiB');
      expect(binaryStats.average).toBe('1.5 KiB');
    });

    it('throws error for empty array', () => {
      expect(() => analyzeBytes([])).toThrow();
    });

    it('throws TypeError for non-array', () => {
      // @ts-expect-error - testing runtime type validation
      expect(() => analyzeBytes(null)).toThrow(TypeError);
    });
  });
});
