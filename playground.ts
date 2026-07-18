import bytes, {
  formatBytes,
  parseBytes,
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
} from './src/index.js';

console.log('=== Bytes Kit Playground ===\n');

// 1. Configure Defaults
bytes.defaultConfig({
  binary: true,
  space: false,
  throwOnError: false,
  onError(err) {
    console.log('[Global Config onError Hook] Caught error:', err.message);
  }
});

console.log('--- 1. Configuration Check ---');
console.log('Current Config:', bytes.getConfig());
console.log();

// 2. Formatting Bytes
console.log('--- 2. Formatting Bytes ---');
const bytesVal = 123456789;
console.log(`Input value: ${bytesVal} bytes`);
console.log('Default format (binary & no space via config):', formatBytes(bytesVal));
console.log('Per-call override (decimal & space):          ', formatBytes(bytesVal, { binary: false, space: true }));
console.log();

// 3. Parsing Bytes
console.log('--- 3. Parsing Byte Strings ---');
const string1 = '1.5 MB';
const string2 = '20 KiB';
console.log(`parseBytes("${string1}"):`, parseBytes(string1), 'bytes');
console.log(`parseBytes("${string2}"):`, parseBytes(string2), 'bytes');
console.log();

// 4. Verification & Helpers
console.log('--- 4. Verification & Helpers ---');
console.log('isValidByte("1.5 MB"):', isValidByte('1.5 MB'));
console.log('isValidByte("abc"):   ', isValidByte('abc'));
console.log('detectUnit("5 GiB"):  ', detectUnit('5 GiB'));
console.log('detectUnit("500"):    ', detectUnit('500'));
console.log();

// 5. Comparisons, Equality & Differences
console.log('--- 5. Comparisons, Equality & Differences ---');
console.log('isEqualBytes("1 MB", "1000 KB"):   ', isEqualBytes('1 MB', '1000 KB'));
console.log('getLargerByte("1.5 MB", "2000 KB"):', getLargerByte('1.5 MB', '2000 KB'));
console.log('getSmallerByte("1.5 MB", 2000000):  ', getSmallerByte('1.5 MB', 2000000));
console.log('diffBytes("1.5 MB", "500 KB"):      ', diffBytes('1.5 MB', '500 KB'));
console.log();

// 6. Math & Collection Operations
console.log('--- 6. Math & Collection Operations ---');
const arr = ['1 MB', '500 KB', '2 GB'];
console.log('Array of sizes:', arr);
console.log('sumBytes(arr):                  ', sumBytes(arr));
console.log('sumBytes(arr, { unit: "MB" }):  ', sumBytes(arr, { unit: 'MB' }));
console.log('sortBytes(arr): ', sortBytes(arr));
console.log('analyzeBytes(arr):', analyzeBytes(arr));
console.log();

// 7. Conversion Operations
console.log('--- 6.5. Conversion Operations ---');
console.log('convertBytes("10 MB", "KB"):                  ', convertBytes('10 MB', 'KB'));
console.log('convertBytes("1 GiB", "MiB"):                 ', convertBytes('1 GiB', 'MiB'));
console.log('convertBytes("1 GiB", "MB"):                  ', convertBytes('1 GiB', 'MB'));
console.log('convertBytes("1.5 MB", "KB", { format: true }):', convertBytes('1.5 MB', 'KB', { format: true }));
console.log();

// 8. Error Handling Fallback Check
console.log('--- 7. Error Handling Fallback Check ---');
console.log('isValidByte("invalid"):          ', isValidByte('invalid')); // never calls onError
console.log('parseBytes("invalid"):           ', parseBytes('invalid'));  // calls onError, returns 0
console.log('sumBytes(["1 MB", "invalid"]):   ', sumBytes(['1 MB', 'invalid'])); // calls onError, returns fallback
console.log();

// Reset config
bytes.resetConfig();
console.log('--- 8. Configuration Reset ---');
console.log('Reset Config:', bytes.getConfig());
