import {
  formatBytes,
  parseBytes,
  getLargeByte,
  getSmallerByte,
  diffBytes,
  analyzeBytes,
} from './src/index.js';

console.log('=== Bytes Kit Playground ===\n');

// 1. Formatting Bytes
console.log('--- 1. Formatting Bytes ---');
const bytes = 123456789;
console.log(`Input value: ${bytes} bytes`);
console.log('Default format:     ', formatBytes(bytes));
console.log('Binary units:       ', formatBytes(bytes, { binary: true }));
console.log('Fixed decimals (3): ', formatBytes(bytes, { decimalPlaces: 3, fixedDecimals: true }));
console.log('German locale:      ', formatBytes(bytes, { locale: 'de-DE' }));
console.log();

// 2. Parsing Bytes
console.log('--- 2. Parsing Byte Strings ---');
const string1 = '1.5 MB';
const string2 = '20 KiB';
console.log(`parseBytes("${string1}"):`, parseBytes(string1), 'bytes');
console.log(`parseBytes("${string2}"):`, parseBytes(string2), 'bytes');
console.log();

// 3. Finding Larger / Smaller Sizes (mixed arguments, returns string)
console.log('--- 3. Larger / Smaller Comparisons ---');
const sizeA = '1.5 MB';
const sizeB = '2000 KB'; // 2.0 MB
console.log(`getLargeByte("${sizeA}", "${sizeB}"):   `, getLargeByte(sizeA, sizeB));
console.log(`getSmallerByte("${sizeA}", "${sizeB}"): `, getSmallerByte(sizeA, sizeB));
console.log();

// 4. Calculating Difference (returns string)
console.log('--- 4. Difference ---');
console.log(`diffBytes("1.5 MB", "500 KB"): `, diffBytes('1.5 MB', '500 KB'));
console.log(`diffBytes("500 KB", "1.5 MB"): `, diffBytes('500 KB', '1.5 MB'));
console.log();

// 5. Analyzing Collection Stats (returns formatted strings)
console.log('--- 5. Collection Analysis ---');
const fileSizes = ['500 KB', '1.2 MB', 3000000, '4.5 MiB'];
const stats = analyzeBytes(fileSizes);
console.log('Input Array:', fileSizes);
console.log('Stats:');
console.log('  Largest:  ', stats.largest);
console.log('  Smallest: ', stats.smallest);
console.log('  Average:  ', stats.average);
