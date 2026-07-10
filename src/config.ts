import type { GlobalConfig } from './types.js';

declare const console: any;

// ---------------------------------------------------------------------------
// Module-level singleton — the only source of truth for global config.
// ---------------------------------------------------------------------------
const _defaultState: GlobalConfig = {
  throwOnError: true,
};

let _config: GlobalConfig = { ..._defaultState };

/**
 * Sets global default options for all bytes-kit functions.
 * Per-call options always take precedence over these defaults.
 *
 * @example
 * import bytes from 'bytes-kit';
 * bytes.defaultConfig({ binary: true, throwOnError: false });
 */
export function defaultConfig(config: Partial<GlobalConfig>): void {
  _config = { ..._config, ...config };
}

/**
 * Returns the current global configuration snapshot.
 */
export function getConfig(): Readonly<GlobalConfig> {
  return { ..._config };
}

/**
 * Resets the global configuration back to factory defaults.
 * Primarily useful in tests to ensure isolation between test cases.
 */
export function resetConfig(): void {
  _config = { ..._defaultState };
}

/**
 * Centralised error handler. Respects the merged configuration of the
 * current global config and any per-call overrides.
 *
 * - When `throwOnError` is `true` (default): re-throws the error.
 * - When `throwOnError` is `false`: calls `onError(error)` if provided,
 *   otherwise calls `console.error`, then returns `fallback`.
 *
 * @internal
 */
export function handleError<T>(
  error: Error,
  fallback: T,
  mergedConfig: Readonly<GlobalConfig>,
): T {
  if (mergedConfig.throwOnError !== false) {
    throw error;
  }
  if (typeof mergedConfig.onError === 'function') {
    mergedConfig.onError(error);
  } else {
    console.error(`[bytes-kit] ${error.message}`);
  }
  return fallback;
}

/**
 * Merges the global config with per-call options.
 * Per-call options always win over global defaults.
 * @internal
 */
export function mergeConfig(options?: Partial<GlobalConfig>): GlobalConfig {
  return { ..._config, ...options };
}
