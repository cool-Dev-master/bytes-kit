import { FormatOptions, UnitType } from './types.js';

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
export function format(bytes: number, options: FormatOptions = {}): string {
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
