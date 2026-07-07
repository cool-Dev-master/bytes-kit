import { describe, it, expect } from 'vitest';
import { format } from './formatter.js';

describe('bytes-kit formatter', () => {
  describe('validation', () => {
    it('throws TypeError for non-finite values', () => {
      // @ts-expect-error - testing runtime type validation
      expect(() => format(undefined)).toThrow(TypeError);
      // @ts-expect-error - testing runtime type validation
      expect(() => format('1000')).toThrow(TypeError);
      expect(() => format(NaN)).toThrow(TypeError);
      expect(() => format(Infinity)).toThrow(TypeError);
      expect(() => format(-Infinity)).toThrow(TypeError);
    });
  });

  describe('decimal base-1000 (default)', () => {
    it('formats 0 correctly', () => {
      expect(format(0)).toBe('0 B');
    });

    it('formats single digits and small values', () => {
      expect(format(9)).toBe('9 B');
      expect(format(999)).toBe('999 B');
    });

    it('formats KB and MB', () => {
      expect(format(1000)).toBe('1 KB');
      expect(format(1337)).toBe('1.34 KB');
      expect(format(999999)).toBe('1 MB'); // checks rounding overflow
      expect(format(1000000)).toBe('1 MB');
      expect(format(1500000)).toBe('1.5 MB');
    });

    it('formats large values up to YB', () => {
      expect(format(1e9)).toBe('1 GB');
      expect(format(1e12)).toBe('1 TB');
      expect(format(1e15)).toBe('1 PB');
      expect(format(1e18)).toBe('1 EB');
      expect(format(1e21)).toBe('1 ZB');
      expect(format(1e24)).toBe('1 YB');
      // beyond YB, keeps YB
      expect(format(1e27)).toBe('1000 YB');
    });
  });

  describe('binary base-1024', () => {
    it('formats small values', () => {
      expect(format(0, { binary: true })).toBe('0 B');
      expect(format(1023, { binary: true })).toBe('1023 B');
    });

    it('formats KiB and MiB', () => {
      expect(format(1024, { binary: true })).toBe('1 KiB');
      expect(format(1500, { binary: true })).toBe('1.46 KiB');
      expect(format(1024 * 1024, { binary: true })).toBe('1 MiB');
      expect(format(1.5 * 1024 * 1024, { binary: true })).toBe('1.5 MiB');
    });

    it('formats large binary units', () => {
      expect(format(Math.pow(1024, 3), { binary: true })).toBe('1 GiB');
      expect(format(Math.pow(1024, 4), { binary: true })).toBe('1 TiB');
      expect(format(Math.pow(1024, 5), { binary: true })).toBe('1 PiB');
      expect(format(Math.pow(1024, 6), { binary: true })).toBe('1 EiB');
      expect(format(Math.pow(1024, 7), { binary: true })).toBe('1 ZiB');
      expect(format(Math.pow(1024, 8), { binary: true })).toBe('1 YiB');
    });
  });

  describe('negative values', () => {
    it('formats negative numbers correctly', () => {
      expect(format(-1000)).toBe('-1 KB');
      expect(format(-1337)).toBe('-1.34 KB');
      expect(format(-1024, { binary: true })).toBe('-1 KiB');
    });
  });

  describe('custom decimalPlaces and fixedDecimals', () => {
    it('respects decimalPlaces', () => {
      expect(format(1337, { decimalPlaces: 0 })).toBe('1 KB');
      expect(format(1337, { decimalPlaces: 1 })).toBe('1.3 KB');
      expect(format(1337, { decimalPlaces: 3 })).toBe('1.337 KB');
    });

    it('respects fixedDecimals', () => {
      expect(format(1000, { decimalPlaces: 2, fixedDecimals: true })).toBe('1.00 KB');
      expect(format(1000, { decimalPlaces: 2, fixedDecimals: false })).toBe('1 KB');
      expect(format(1500, { decimalPlaces: 3, fixedDecimals: true })).toBe('1.500 KB');
      expect(format(0, { decimalPlaces: 2, fixedDecimals: true })).toBe('0.00 B');
    });
  });

  describe('spacing option', () => {
    it('can omit space between number and unit', () => {
      expect(format(1000, { space: false })).toBe('1KB');
      expect(format(1337, { space: false })).toBe('1.34KB');
      expect(format(1024, { binary: true, space: false })).toBe('1KiB');
    });
  });

  describe('forced units', () => {
    it('forces unit and formats value relative to forced unit', () => {
      expect(format(1000, { unit: 'B' })).toBe('1000 B');
      expect(format(1024, { unit: 'B', binary: true })).toBe('1024 B');
      expect(format(1e6, { unit: 'KB' })).toBe('1000 KB');
      expect(format(1024 * 1024 * 5, { unit: 'KiB' })).toBe('5120 KiB');
      expect(format(1000, { unit: 'MB', fixedDecimals: true })).toBe('0.00 MB');
      expect(format(1000, { unit: 'MB', decimalPlaces: 6 })).toBe('0.001 MB');
    });

    it('throws error for invalid forced unit', () => {
      // @ts-expect-error - testing invalid forced unit
      expect(() => format(1000, { unit: 'XYZ' })).toThrow();
    });
  });

  describe('locale formatting', () => {
    it('applies locale formatting', () => {
      // German uses comma as decimal separator and dot for thousand separation
      // Standard Node.js environment has full ICU support.
      expect(format(1234567, { locale: 'de-DE' })).toBe('1,23 MB');
      expect(format(1000000, { unit: 'KB', locale: 'de-DE', fixedDecimals: true, decimalPlaces: 2 })).toBe('1.000,00 KB');
    });
  });
});
