import { describe, it, expect, afterEach } from 'vitest';
import {
  formatBytes,
  parseBytes,
  getLargerByte,
  getSmallerByte,
  diffBytes,
  analyzeBytes,
  isEqualBytes,
  sumBytes,
  sortBytes,
  isValidByte,
  detectUnit,
  convertBytes,
} from './formatter.js';
import { defaultConfig, getConfig, resetConfig } from './config.js';

// Always restore global config after each test so tests are isolated.
afterEach(() => {
  resetConfig();
});

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

    it('throws on invalid formats or units (default throwOnError: true)', () => {
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

    it('throws error for empty array (default throwOnError: true)', () => {
      expect(() => analyzeBytes([])).toThrow();
    });

    it('throws TypeError for non-array (default throwOnError: true)', () => {
      // @ts-expect-error - testing runtime type validation
      expect(() => analyzeBytes(null)).toThrow(TypeError);
    });
  });
});

// ---------------------------------------------------------------------------
describe('bytes-kit GlobalConfig', () => {
  describe('defaultConfig + throwOnError: false', () => {
    it('formatBytes returns fallback instead of throwing', () => {
      defaultConfig({ throwOnError: false });
      // @ts-expect-error - intentional bad input
      expect(formatBytes('not-a-number')).toBe('0 B');
      expect(formatBytes(NaN)).toBe('0 B');
    });

    it('parseBytes returns 0 instead of throwing', () => {
      defaultConfig({ throwOnError: false });
      expect(parseBytes('bad input')).toBe(0);
      // @ts-expect-error - intentional bad input
      expect(parseBytes(null)).toBe(0);
    });

    it('analyzeBytes returns empty stats instead of throwing', () => {
      defaultConfig({ throwOnError: false });
      const result = analyzeBytes([]);
      expect(result).toEqual({ largest: '', smallest: '', average: '' });
    });
  });

  describe('global formatting defaults', () => {
    it('applies global binary: true to formatBytes', () => {
      defaultConfig({ binary: true });
      expect(formatBytes(1024)).toBe('1 KiB');
    });

    it('per-call option overrides global default', () => {
      defaultConfig({ binary: true });
      expect(formatBytes(1000, { binary: false })).toBe('1 KB');
    });

    it('applies global space: false to formatBytes', () => {
      defaultConfig({ space: false });
      expect(formatBytes(1000)).toBe('1KB');
      expect(formatBytes(1024, { binary: true })).toBe('1KiB');
    });

    it('applies global decimalPlaces to all formatting functions', () => {
      defaultConfig({ decimalPlaces: 0 });
      expect(formatBytes(1337)).toBe('1 KB');
      expect(getLargerByte('1.5 MB', '2.7 MB')).toBe('3 MB');
      expect(diffBytes('2.9 MB', '1 MB')).toBe('2 MB');
    });
  });

  describe('onError callback', () => {
    it('calls onError instead of throwing when throwOnError: false', () => {
      const errors: Error[] = [];
      defaultConfig({
        throwOnError: false,
        onError: (err) => errors.push(err),
      });
      parseBytes('invalid');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0].message).toContain('Invalid byte representation');
    });

    it('does not call onError when input is valid', () => {
      const errors: Error[] = [];
      defaultConfig({
        throwOnError: false,
        onError: (err) => errors.push(err),
      });
      parseBytes('1 MB');
      expect(errors).toHaveLength(0);
    });
  });

  describe('resetConfig', () => {
    it('restores default throw behavior after reset', () => {
      defaultConfig({ throwOnError: false });
      // @ts-expect-error - intentional bad input
      expect(formatBytes('oops')).toBe('0 B'); // no throw
      resetConfig();
      // @ts-expect-error - intentional bad input
      expect(() => formatBytes('oops')).toThrow(); // back to throw
    });
  });

  describe('getConfig', () => {
    it('returns a read-only clone of the current configuration', () => {
      defaultConfig({ binary: true, space: false });
      const config = getConfig();
      expect(config.binary).toBe(true);
      expect(config.space).toBe(false);
      expect(config.throwOnError).toBe(true);

      // Mutating the returned config object should not mutate internal state
      // @ts-expect-error - testing readonly / mutation avoidance
      config.space = true;
      expect(getConfig().space).toBe(false);
    });
  });
});

describe('bytes-kit New Utility APIs', () => {
  describe('isValidByte', () => {
    it('returns true for valid byte inputs', () => {
      expect(isValidByte('1 MB')).toBe(true);
      expect(isValidByte('5 GiB')).toBe(true);
      expect(isValidByte(1024)).toBe(true);
      expect(isValidByte(0)).toBe(true);
      expect(isValidByte('-50 KB')).toBe(true);
    });

    it('returns false for invalid byte inputs', () => {
      expect(isValidByte('abc')).toBe(false);
      expect(isValidByte('1 XB')).toBe(false);
      expect(isValidByte(NaN)).toBe(false);
      expect(isValidByte(Infinity)).toBe(false);
      // @ts-expect-error - testing invalid type
      expect(isValidByte(null)).toBe(false);
    });

    it('never throws or calls onError', () => {
      let called = false;
      defaultConfig({
        throwOnError: false,
        onError: () => { called = true; }
      });
      expect(isValidByte('invalid')).toBe(false);
      expect(called).toBe(false);
    });
  });

  describe('detectUnit', () => {
    it('detects the unit correctly', () => {
      expect(detectUnit('5 GiB')).toBe('GiB');
      expect(detectUnit('20 MB')).toBe('MB');
      expect(detectUnit('500')).toBe('B');
      expect(detectUnit('  1.5  kb  ')).toBe('KB');
    });

    it('respects global error handling on invalid unit/input', () => {
      // throwOnError is default true:
      expect(() => detectUnit('abc')).toThrow();

      // throwOnError: false:
      defaultConfig({ throwOnError: false });
      expect(detectUnit('abc')).toBe('B');
    });
  });

  describe('isEqualBytes', () => {
    it('compares equal normalized byte values', () => {
      expect(isEqualBytes('1 MB', '1000 KB')).toBe(true);
      expect(isEqualBytes('1 MiB', '1024 KiB')).toBe(true);
      expect(isEqualBytes(1000, '1 KB')).toBe(true);
    });

    it('returns false for unequal byte values', () => {
      expect(isEqualBytes('1 MB', '1 MiB')).toBe(false);
      expect(isEqualBytes(1000, 2000)).toBe(false);
    });

    it('respects global error handling', () => {
      expect(() => isEqualBytes('invalid', '1 MB')).toThrow();

      defaultConfig({ throwOnError: false });
      // since both return fallback 0, 0 === 0 is true
      expect(isEqualBytes('invalid', 'another-invalid')).toBe(true);
    });
  });

  describe('sumBytes', () => {
    it('sums byte values correctly', () => {
      expect(sumBytes(['1 MB', '500 KB'])).toBe('1.5 MB');
      expect(sumBytes([1000, '2 KB'])).toBe('3 KB');
    });

    it('respects per-call options and global configuration', () => {
      expect(sumBytes(['1 KiB', '2 KiB'], { binary: true })).toBe('3 KiB');
      
      defaultConfig({ binary: true });
      expect(sumBytes(['1 KiB', '2 KiB'])).toBe('3 KiB');
    });

    it('respects global error handling', () => {
      expect(() => sumBytes(['1 MB', 'invalid'])).toThrow();

      defaultConfig({ throwOnError: false });
      expect(sumBytes(['1 MB', 'invalid'])).toBe('1 MB'); // invalid parses to 0
    });
  });

  describe('sortBytes', () => {
    it('sorts ascending by default', () => {
      const values = ['1 MB', '200 KB', '2 GB'];
      expect(sortBytes(values)).toEqual(['200 KB', '1 MB', '2 GB']);
    });

    it('sorts descending when order is desc', () => {
      const values = ['1 MB', '200 KB', '2 GB'];
      expect(sortBytes(values, 'desc')).toEqual(['2 GB', '1 MB', '200 KB']);
    });

    it('preserves the original representations', () => {
      const values = [1000, '200 B', '1.5 KB'];
      expect(sortBytes(values)).toEqual(['200 B', 1000, '1.5 KB']);
    });

    it('returns a new array (preserves original)', () => {
      const values = ['2 MB', '1 MB'];
      const sorted = sortBytes(values);
      expect(sorted).not.toBe(values);
      expect(values).toEqual(['2 MB', '1 MB']);
    });

    it('respects global error handling', () => {
      expect(() => sortBytes(['1 MB', 'invalid'])).toThrow();

      defaultConfig({ throwOnError: false });
      // invalid maps to 0, sorting should position it first
      expect(sortBytes(['1 MB', 'invalid'])).toEqual(['invalid', '1 MB']);
    });
  });

  describe('convertBytes', () => {
    it('converts byte value to target unit returning a number by default', () => {
      expect(convertBytes('10 MB', 'KB')).toBe(10000);
      expect(convertBytes('1 GB', 'MB')).toBe(1000);
      expect(convertBytes(10000000, 'MB')).toBe(10);
      expect(convertBytes('10.5 MB', 'B')).toBe(10500000);
    });

    it('handles binary conversions correctly', () => {
      expect(convertBytes('1 GiB', 'MiB')).toBe(1024);
      expect(convertBytes('1024 KiB', 'MiB')).toBe(1);
      expect(convertBytes(1024 * 1024 * 1024, 'GiB')).toBe(1);
    });

    it('handles cross-base conversions (binary <-> decimal)', () => {
      expect(convertBytes('1 GiB', 'MB')).toBe(1073.741824);
      expect(convertBytes('1 MB', 'KiB')).toBe(1000000 / 1024);
    });

    it('returns formatted string when options.format is true', () => {
      expect(convertBytes('10 MB', 'KB', { format: true })).toBe('10000 KB');
      expect(convertBytes('1 GiB', 'MiB', { format: true })).toBe('1024 MiB');
      expect(convertBytes('1.5 MB', 'KB', { format: true, space: false })).toBe('1500KB');
      expect(convertBytes(1024, 'KiB', { format: true, decimalPlaces: 1, fixedDecimals: true })).toBe('1.0 KiB');
    });

    it('throws errors on invalid inputs or units by default', () => {
      expect(() => convertBytes('invalid', 'MB')).toThrow();
      expect(() => convertBytes('10 MB', 'invalid' as any)).toThrow();
    });

    it('respects global error handling (throwOnError: false)', () => {
      defaultConfig({ throwOnError: false });
      expect(convertBytes('invalid', 'MB')).toBe(0);
      expect(convertBytes('10 MB', 'invalid' as any)).toBe(0);

      expect(convertBytes('invalid', 'MB', { format: true })).toBe('0 MB');
      expect(convertBytes('10 MB', 'invalid' as any, { format: true })).toBe('0 B');
    });
  });
});


