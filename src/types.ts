export type UnitType =
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'PB'
  | 'EB'
  | 'ZB'
  | 'YB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB'
  | 'PiB'
  | 'EiB'
  | 'ZiB'
  | 'YiB';

export interface FormatOptions {
  /**
   * Force conversion to a specific unit (e.g. 'MB', 'GiB').
   * If not specified, the unit will be automatically selected based on the byte magnitude.
   */
  unit?: UnitType;

  /**
   * The maximum number of decimal places to include in the output.
   * @default 2
   */
  decimalPlaces?: number;

  /**
   * If true, always display exactly `decimalPlaces` digits after the decimal point (including trailing zeros).
   * If false, trailing zeros in the decimal part are omitted.
   * @default false
   */
  fixedDecimals?: boolean;

  /**
   * If true, uses binary units (base-1024, e.g. KiB, MiB, GiB...).
   * If false, uses decimal units (base-1000, e.g. KB, MB, GB...).
   * @default false
   */
  binary?: boolean;

  /**
   * Whether to include a space between the formatted value and the unit symbol.
   * E.g., '10 MB' vs '10MB'.
   * @default true
   */
  space?: boolean;

  /**
   * Localize the formatted number using Intl.NumberFormat.
   * If a string is provided, it uses that locale (e.g., 'de-DE').
   * If true, it uses the host environment's default locale.
   * If false or undefined, it formats as a standard JavaScript string representation.
   * @default false
   */
  locale?: string | boolean;
}

export interface ByteStats {
  largest: string;
  smallest: string;
  average: string;
}

/**
 * Global configuration that applies to all bytes-kit functions by default.
 * Per-call options always override these.
 */
export interface GlobalConfig {
  /**
   * Default formatting options applied to every function call.
   * Any per-call `options` argument will override these.
   */
  space?: boolean;
  binary?: boolean;
  decimalPlaces?: number;
  fixedDecimals?: boolean;
  locale?: string | boolean;

  /**
   * If true (default), functions throw on invalid input — matching the original behavior.
   * If false, errors are handled gracefully via `onError` and a safe fallback is returned.
   * @default true
   */
  throwOnError?: boolean;

  /**
   * Called with the Error when `throwOnError` is false and an error occurs.
   * If not provided, falls back to `console.error`.
   */
  onError?: (error: Error) => void;
}
