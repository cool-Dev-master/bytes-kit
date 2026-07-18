import { FormatOptions, UnitType, ByteStats, GlobalConfig } from './types.js';
import { getConfig, mergeConfig, handleError } from './config.js';

const DECIMAL_UNITS: UnitType[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const BINARY_UNITS: UnitType[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

// Map of lower-cased unit symbols to their base and power multiplier.
const UNIT_POWER_MAP: Record<string, { base: number; exponent: number }> = {};
DECIMAL_UNITS.forEach((unit, idx) => {
  UNIT_POWER_MAP[unit.toLowerCase()] = { base: 1000, exponent: idx };
});
BINARY_UNITS.forEach((unit, idx) => {
  UNIT_POWER_MAP[unit.toLowerCase()] = { base: 1024, exponent: idx };
});

// ---------------------------------------------------------------------------
// Internal core: performs the actual formatting. Always throws on invalid
// input — callers are responsible for wrapping with handleError when needed.
// ---------------------------------------------------------------------------
function _formatBytesCore(bytes: number, opts: FormatOptions): string {
  const {
    decimalPlaces = 2,
    fixedDecimals = false,
    binary = false,
    space = true,
    locale = false,
  } = opts;

  const isNegative = bytes < 0;
  const absoluteBytes = Math.abs(bytes);

  let base = binary ? 1024 : 1000;
  let units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  let index = -1;

  // 1. Determine Unit and Base
  if (opts.unit) {
    if (opts.unit === 'B') {
      index = 0;
    } else {
      const decIndex = DECIMAL_UNITS.indexOf(opts.unit);
      if (decIndex !== -1) {
        base = 1000;
        units = DECIMAL_UNITS;
        index = decIndex;
      } else {
        const binIndex = BINARY_UNITS.indexOf(opts.unit);
        if (binIndex !== -1) {
          base = 1024;
          units = BINARY_UNITS;
          index = binIndex;
        } else {
          throw new Error(`Invalid unit forced: ${opts.unit}`);
        }
      }
    }
  }

  // 2. Handle 0 Bytes
  if (absoluteBytes === 0) {
    const unitSymbol = opts.unit || 'B';
    let formattedZero: string;

    if (locale) {
      const localeStr = typeof locale === 'string' ? locale : undefined;
      formattedZero = new Intl.NumberFormat(localeStr, {
        minimumFractionDigits: fixedDecimals ? decimalPlaces : 0,
        maximumFractionDigits: decimalPlaces,
      }).format(0);
    } else {
      formattedZero = (0).toFixed(decimalPlaces);
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
  if (!opts.unit) {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Formats a number of bytes into a human-readable string (e.g., '10.5 MB' or '2 GiB').
 *
 * @param bytes The number of bytes to format. Must be a finite number.
 * @param options Per-call formatting options. Overrides any global defaults.
 * @returns The formatted string, or `'0 B'` if `throwOnError` is false and input is invalid.
 */
export function formatBytes(bytes: number, options?: FormatOptions): string {
  const cfg = mergeConfig(options);

  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) {
    return handleError(
      new TypeError('Expected a finite number of bytes'),
      '0 B',
      cfg,
    );
  }

  try {
    return _formatBytesCore(bytes, cfg);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), '0 B', cfg);
  }
}

/**
 * Parses a human-readable byte string (e.g. '10 MB', '2.5 GiB', '-500 KB') into bytes.
 *
 * @param input The string to parse.
 * @returns The parsed number of bytes, or `0` if `throwOnError` is false and input is invalid.
 */
export function parseBytes(input: string): number {
  const cfg = getConfig();

  if (typeof input !== 'string') {
    return handleError(
      new TypeError('Expected a string to parse'),
      0,
      cfg,
    );
  }

  const match = /^\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/.exec(input);
  if (!match) {
    return handleError(
      new Error(`Invalid byte representation: "${input}"`),
      0,
      cfg,
    );
  }

  const numericValue = parseFloat(match[1]);
  const unitStr = match[2].trim().toLowerCase();

  if (!unitStr) {
    return numericValue;
  }

  const unitConfig = UNIT_POWER_MAP[unitStr];
  if (!unitConfig) {
    return handleError(
      new Error(`Invalid unit: "${match[2]}"`),
      0,
      cfg,
    );
  }

  return numericValue * Math.pow(unitConfig.base, unitConfig.exponent);
}

/**
 * Normalizes input (number or string) to a raw number of bytes.
 *
 * @returns Raw bytes as a number, or `0` if `throwOnError` is false and input is invalid.
 */
export function toBytes(input: number | string): number {
  const cfg = getConfig();

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      return handleError(
        new TypeError('Expected a finite number of bytes'),
        0,
        cfg,
      );
    }
    return input;
  }
  if (typeof input === 'string') {
    return parseBytes(input);
  }
  return handleError(
    new TypeError('Expected a number or a string representing bytes'),
    0,
    cfg,
  );
}

/**
 * Compares two byte sizes and returns the larger size formatted as a string.
 * Accepts both raw numbers and human-readable strings (e.g. '1.5 MB').
 *
 * @returns Formatted string of the larger value, or `''` on error when `throwOnError` is false.
 */
export function getLargerByte(
  a: number | string,
  b: number | string,
  options?: FormatOptions,
): string {
  const cfg = mergeConfig(options);
  try {
    return _formatBytesCore(Math.max(toBytes(a), toBytes(b)), cfg);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), '', cfg);
  }
}

/**
 * Compares two byte sizes and returns the smaller size formatted as a string.
 * Accepts both raw numbers and human-readable strings.
 *
 * @returns Formatted string of the smaller value, or `''` on error when `throwOnError` is false.
 */
export function getSmallerByte(
  a: number | string,
  b: number | string,
  options?: FormatOptions,
): string {
  const cfg = mergeConfig(options);
  try {
    return _formatBytesCore(Math.min(toBytes(a), toBytes(b)), cfg);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), '', cfg);
  }
}

/**
 * Calculates the difference between two byte sizes (`a − b`) and returns it formatted as a string.
 * Accepts both raw numbers and human-readable strings. Result may be negative.
 *
 * @returns Formatted difference string, or `''` on error when `throwOnError` is false.
 */
export function diffBytes(
  a: number | string,
  b: number | string,
  options?: FormatOptions,
): string {
  const cfg = mergeConfig(options);
  try {
    return _formatBytesCore(toBytes(a) - toBytes(b), cfg);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), '', cfg);
  }
}

/** Fallback returned by `analyzeBytes` when input is invalid and `throwOnError` is false. */
const EMPTY_STATS: Readonly<ByteStats> = { largest: '', smallest: '', average: '' };

/**
 * Analyzes an array of byte sizes and returns the largest, smallest, and average
 * formatted as human-readable strings.
 *
 * @returns A `ByteStats` object, or `{ largest: '', smallest: '', average: '' }` on error
 * when `throwOnError` is false.
 */
export function analyzeBytes(
  inputs: (number | string)[],
  options?: FormatOptions,
): ByteStats {
  const cfg = mergeConfig(options);

  if (!Array.isArray(inputs)) {
    return handleError(
      new TypeError('Expected an array of byte values'),
      { ...EMPTY_STATS },
      cfg,
    );
  }
  if (inputs.length === 0) {
    return handleError(
      new Error('Cannot analyze an empty array'),
      { ...EMPTY_STATS },
      cfg,
    );
  }

  try {
    const byteValues = inputs.map(toBytes);
    const largest = Math.max(...byteValues);
    const smallest = Math.min(...byteValues);
    const sum = byteValues.reduce((acc, val) => acc + val, 0);
    const average = sum / byteValues.length;

    return {
      largest: _formatBytesCore(largest, cfg),
      smallest: _formatBytesCore(smallest, cfg),
      average: _formatBytesCore(average, cfg),
    };
  } catch (err) {
    return handleError(
      err instanceof Error ? err : new Error(String(err)),
      { ...EMPTY_STATS },
      cfg,
    );
  }
}

/**
 * Validates whether a value is a valid byte representation (finite number or properly formatted string).
 * Never throws and never calls the global onError callback.
 *
 * @param value The value to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidByte(value: number | string): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    const match = /^\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/.exec(value);
    if (!match) {
      return false;
    }
    const unitStr = match[2].trim().toLowerCase();
    if (!unitStr) {
      return true;
    }
    return unitStr in UNIT_POWER_MAP;
  }
  return false;
}

/**
 * Detects the unit used in a human-readable byte string.
 * Respects global error handling if the value or unit is invalid.
 *
 * @param value The string to inspect.
 * @returns The detected UnitType (defaults to 'B' on fallback).
 */
export function detectUnit(value: string): UnitType {
  const cfg = getConfig();
  if (typeof value !== 'string') {
    return handleError(
      new TypeError('Expected a string to detect unit'),
      'B' as UnitType,
      cfg,
    );
  }
  const match = /^\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/.exec(value);
  if (!match) {
    return handleError(
      new Error(`Invalid byte representation: "${value}"`),
      'B' as UnitType,
      cfg,
    );
  }
  const unitStr = match[2].trim();
  if (!unitStr) {
    return 'B';
  }
  const unitLower = unitStr.toLowerCase();
  if (!(unitLower in UNIT_POWER_MAP)) {
    return handleError(
      new Error(`Invalid unit: "${unitStr}"`),
      'B' as UnitType,
      cfg,
    );
  }
  const foundUnit =
    BINARY_UNITS.find((u) => u.toLowerCase() === unitLower) ||
    DECIMAL_UNITS.find((u) => u.toLowerCase() === unitLower);
  return (foundUnit || 'B') as UnitType;
}

/**
 * Checks if two byte sizes are equal by comparing their normalized byte values.
 * Respects global error handling.
 *
 * @param a The first byte size.
 * @param b The second byte size.
 * @returns True if equal, false otherwise.
 */
export function isEqualBytes(a: number | string, b: number | string): boolean {
  const cfg = getConfig();
  try {
    return toBytes(a) === toBytes(b);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), false, cfg);
  }
}

/**
 * Sums an array of byte sizes and returns the formatted sum.
 * Respects global configuration, per-call options, and global error handling.
 *
 * @param values Array of numbers or strings representing byte sizes.
 * @param options Per-call formatting options for the output.
 * @returns Formatted representation of the sum.
 */
export function sumBytes(values: (number | string)[], options?: FormatOptions): string {
  const cfg = mergeConfig(options);
  if (!Array.isArray(values)) {
    return handleError(
      new TypeError('Expected an array of byte values'),
      '0 B',
      cfg,
    );
  }
  try {
    const sum = values.reduce<number>((acc, val) => acc + toBytes(val), 0);
    return _formatBytesCore(sum, cfg);
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), '0 B', cfg);
  }
}

/**
 * Sorts an array of byte sizes, preserving their original string/number representation.
 * Returns a new array. Respects global error handling.
 *
 * @param values Array of byte values to sort.
 * @param order Sort direction: 'asc' or 'desc' (defaults to 'asc').
 * @returns A new sorted array.
 */
export function sortBytes(
  values: (number | string)[],
  order: 'asc' | 'desc' = 'asc',
): (number | string)[] {
  const cfg = getConfig();
  if (!Array.isArray(values)) {
    return handleError(
      new TypeError('Expected an array to sort'),
      [],
      cfg,
    );
  }
  try {
    const parsedMap = new Map<number | string, number>();
    for (const val of values) {
      parsedMap.set(val, toBytes(val));
    }
    const sorted = [...values].sort((a, b) => {
      const valA = parsedMap.get(a) ?? 0;
      const valB = parsedMap.get(b) ?? 0;
      return order === 'desc' ? valB - valA : valA - valB;
    });
    return sorted;
  } catch (err) {
    return handleError(err instanceof Error ? err : new Error(String(err)), [], cfg);
  }
}

/**
 * Converts a byte value (number or string) to a target unit.
 *
 * @param input The input byte value (e.g. '10 MB', or raw number of bytes).
 * @param targetFormat The unit to convert to (e.g. 'KB', 'MiB').
 * @param options Additional options. If `format` is true, returns a formatted string (e.g. "10000 KB").
 *                You can also pass formatting options (like `decimalPlaces`, `fixedDecimals`, `space`, `locale`).
 * @returns The converted value as a number, or as a formatted string if `options.format` is true.
 */
export function convertBytes(
  input: number | string,
  targetFormat: UnitType,
  options?: FormatOptions & { format?: boolean },
): number | string {
  const cfg = mergeConfig(options);
  try {
    const bytes = toBytes(input);
    const unitLower = targetFormat.toLowerCase();
    const unitConfig = UNIT_POWER_MAP[unitLower];
    if (!unitConfig) {
      throw new Error(`Invalid target unit: "${targetFormat}"`);
    }

    const convertedValue = bytes / Math.pow(unitConfig.base, unitConfig.exponent);

    if (options?.format) {
      return _formatBytesCore(bytes, { ...cfg, unit: targetFormat });
    }

    return convertedValue;
  } catch (err) {
    const fallback = options?.format ? '0 B' : 0;
    return handleError(
      err instanceof Error ? err : new Error(String(err)),
      fallback,
      cfg,
    );
  }
}


