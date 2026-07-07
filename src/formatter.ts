import { FormatOptions, UnitType, ByteStats } from './types.js';

const DECIMAL_UNITS: UnitType[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const BINARY_UNITS: UnitType[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

/**
 * Formats a number of bytes into a human-readable string (e.g., '10.5 MB' or '2 GiB').
 *
 * @param bytes The number of bytes to format. Must be a finite number.
 * @param options Custom formatting options.
 * @returns The formatted string representation of the byte size.
 * @throws {TypeError} If the input bytes is not a finite number.
 */
export function formatBytes(bytes: number, options: FormatOptions = {}): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) {
    throw new TypeError('Expected a finite number of bytes');
  }

  const {
    decimalPlaces = 2,
    fixedDecimals = false,
    binary = false,
    space = true,
    locale = false,
  } = options;

  const isNegative = bytes < 0;
  const absoluteBytes = Math.abs(bytes);

  let base = binary ? 1024 : 1000;
  let units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  let index = -1;

  // 1. Determine Unit and Base
  if (options.unit) {
    if (options.unit === 'B') {
      index = 0;
    } else {
      const decIndex = DECIMAL_UNITS.indexOf(options.unit);
      if (decIndex !== -1) {
        base = 1000;
        units = DECIMAL_UNITS;
        index = decIndex;
      } else {
        const binIndex = BINARY_UNITS.indexOf(options.unit);
        if (binIndex !== -1) {
          base = 1024;
          units = BINARY_UNITS;
          index = binIndex;
        } else {
          throw new Error(`Invalid unit forced: ${options.unit}`);
        }
      }
    }
  }

  // 2. Handle 0 Bytes
  if (absoluteBytes === 0) {
    const unitSymbol = options.unit || 'B';
    const dec = decimalPlaces;
    let formattedZero: string;

    if (locale) {
      const localeStr = typeof locale === 'string' ? locale : undefined;
      formattedZero = new Intl.NumberFormat(localeStr, {
        minimumFractionDigits: fixedDecimals ? dec : 0,
        maximumFractionDigits: dec,
      }).format(0);
    } else {
      formattedZero = (0).toFixed(dec);
      if (!fixedDecimals && formattedZero.includes('.')) {
        formattedZero = formattedZero.replace(/0+$/, '').replace(/\.$/, '');
      }
    }

    return `${formattedZero}${space ? ' ' : ''}${unitSymbol}`;
  }

  // 3. Auto-calculate magnitude if unit is not forced
  if (index === -1) {
    index = Math.floor(Math.log(absoluteBytes) / Math.log(base));
    index = Math.max(0, Math.min(index, units.length - 1));
  }

  let value = absoluteBytes / Math.pow(base, index);

  // 4. Double-check for rounding up overflow (e.g. 999.999 KB -> 1.00 MB)
  // Only apply when the unit is not explicitly forced
  if (!options.unit) {
    const roundedValue = Number(value.toFixed(decimalPlaces));
    if (roundedValue >= base && index < units.length - 1) {
      index++;
      value = absoluteBytes / Math.pow(base, index);
    }
  }

  // 5. Format numeric value
  let formattedValue: string;
  if (locale) {
    const localeStr = typeof locale === 'string' ? locale : undefined;
    formattedValue = new Intl.NumberFormat(localeStr, {
      minimumFractionDigits: fixedDecimals ? decimalPlaces : 0,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  } else {
    formattedValue = value.toFixed(decimalPlaces);
    if (!fixedDecimals && formattedValue.includes('.')) {
      formattedValue = formattedValue.replace(/0+$/, '').replace(/\.$/, '');
    }
  }

  const unitSymbol = units[index];
  const sign = isNegative ? '-' : '';

  return `${sign}${formattedValue}${space ? ' ' : ''}${unitSymbol}`;
}

// Map of lower-cased unit symbols to their base and power multiplier.
const UNIT_POWER_MAP: Record<string, { base: number; exponent: number }> = {};
DECIMAL_UNITS.forEach((unit, idx) => {
  UNIT_POWER_MAP[unit.toLowerCase()] = { base: 1000, exponent: idx };
});
BINARY_UNITS.forEach((unit, idx) => {
  UNIT_POWER_MAP[unit.toLowerCase()] = { base: 1024, exponent: idx };
});

/**
 * Parses a human-readable byte string (e.g. '10 MB', '2.5 GiB', '-500 KB') into bytes.
 *
 * @param input The string to parse.
 * @returns The parsed number of bytes.
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the input format or unit is invalid.
 */
export function parseBytes(input: string): number {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string to parse');
  }

  const match = /^\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/.exec(input);
  if (!match) {
    throw new Error(`Invalid byte representation: "${input}"`);
  }

  const numericValue = parseFloat(match[1]);
  const unitStr = match[2].trim().toLowerCase();

  if (!unitStr) {
    return numericValue;
  }

  const unitConfig = UNIT_POWER_MAP[unitStr];
  if (!unitConfig) {
    throw new Error(`Invalid unit: "${match[2]}"`);
  }

  return numericValue * Math.pow(unitConfig.base, unitConfig.exponent);
}

/**
 * Normalizes input (number or string) to a number of bytes.
 */
export function toBytes(input: number | string): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new TypeError('Expected a finite number of bytes');
    }
    return input;
  }
  if (typeof input === 'string') {
    return parseBytes(input);
  }
  throw new TypeError('Expected a number or a string representing bytes');
}

/**
 * Compares two byte sizes and returns the larger size formatted as a string.
 */
export function getLargeByte(a: number | string, b: number | string, options?: FormatOptions): string {
  return formatBytes(Math.max(toBytes(a), toBytes(b)), options);
}

/**
 * Compares two byte sizes and returns the smaller size formatted as a string.
 */
export function getSmallerByte(a: number | string, b: number | string, options?: FormatOptions): string {
  return formatBytes(Math.min(toBytes(a), toBytes(b)), options);
}

/**
 * Calculates the difference between two byte sizes (a - b) and returns it formatted as a string.
 */
export function diffBytes(a: number | string, b: number | string, options?: FormatOptions): string {
  return formatBytes(toBytes(a) - toBytes(b), options);
}

/**
 * Analyzes an array of byte sizes to find the largest, smallest, and average, returning them formatted as strings.
 */
export function analyzeBytes(inputs: (number | string)[], options?: FormatOptions): ByteStats {
  if (!Array.isArray(inputs)) {
    throw new TypeError('Expected an array of byte values');
  }
  if (inputs.length === 0) {
    throw new Error('Cannot analyze an empty array');
  }

  const byteValues = inputs.map(toBytes);
  const largest = Math.max(...byteValues);
  const smallest = Math.min(...byteValues);
  const sum = byteValues.reduce((acc, val) => acc + val, 0);
  const average = sum / byteValues.length;

  return {
    largest: formatBytes(largest, options),
    smallest: formatBytes(smallest, options),
    average: formatBytes(average, options),
  };
}
