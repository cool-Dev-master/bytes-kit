export {
  formatBytes,
  parseBytes,
  toBytes,
  getLargerByte,
  getSmallerByte,
  isEqualBytes,
  diffBytes,
  sumBytes,
  sortBytes,
  analyzeBytes,
  isValidByte,
  detectUnit,
  convertBytes,
} from './formatter.js';

export { defaultConfig, getConfig, resetConfig } from './config.js';

export type { FormatOptions, UnitType, ByteStats, GlobalConfig } from './types.js';

// ---------------------------------------------------------------------------
// Default export: a convenient namespace object that mirrors the named exports.
// ---------------------------------------------------------------------------
import { defaultConfig, getConfig, resetConfig } from './config.js';
import {
  formatBytes,
  parseBytes,
  toBytes,
  getLargerByte,
  getSmallerByte,
  isEqualBytes,
  diffBytes,
  sumBytes,
  sortBytes,
  analyzeBytes,
  isValidByte,
  detectUnit,
  convertBytes,
} from './formatter.js';

const bytes = {
  formatBytes,
  parseBytes,
  toBytes,
  getLargerByte,
  getSmallerByte,
  isEqualBytes,
  diffBytes,
  sumBytes,
  sortBytes,
  analyzeBytes,
  isValidByte,
  detectUnit,
  convertBytes,
  defaultConfig,
  getConfig,
  resetConfig,
};

export default bytes;
