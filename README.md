# bytes-kit

A lightweight, type-safe, and zero-dependency utility for formatting, parsing, converting, comparing, and analyzing byte sizes (supporting both decimal base-1000 and binary base-1024 units).

## Features

- 🚀 **Zero dependencies** & lightweight
- 📦 **Dual package** (CommonJS & ES Modules)
- 🔒 **Fully type-safe** with TypeScript types included
- ⚙️ **Highly customizable** (decimal places, binary vs. decimal units, spacing, custom forced units)
- 🌍 **Global Configuration** with customizable error handling (throwOnError, onError)
- 🧭 **Parsing, Conversion & Manipulation** (parse strings back to bytes, convert between units, compare sizes, get differences, calculate stats on collections)
- 🌍 **Localization support** using `Intl.NumberFormat`

---

## Installation

```bash
npm install bytes-kit
# or
yarn add bytes-kit
# or
pnpm add bytes-kit
```

---


## Import

This package supports both ES Modules (`import`) and CommonJS (`require`) styles:

```typescript
// ES Modules (ESM)
import bytes, { formatBytes } from 'bytes-kit';

// CommonJS (CJS)
const bytes = require('bytes-kit').default;
const { formatBytes } = require('bytes-kit');
```


## Global Configuration

You can configure global defaults once. Per-call options always take precedence.

```typescript
import bytes from 'bytes-kit';

bytes.defaultConfig({
  binary: true,
  space: false,
  throwOnError: false, // Don't crash on invalid input
  onError(error) {
    console.error('[App error handler]', error.message);
  }
});
```

* `bytes.getConfig()`: Returns a read-only clone of the current configuration.
* `bytes.resetConfig()`: Restores config back to factory defaults.

---

## Usage

### 1. Formatting Bytes
Converts a raw number of bytes to a human-readable string:

```typescript
import { formatBytes } from 'bytes-kit';

formatBytes(1000);       // => '1 KB'
formatBytes(1337);       // => '1.34 KB'
formatBytes(1024, { binary: true }); // => '1 KiB'
formatBytes(-1000);      // => '-1 KB'
```

### 2. Parsing Byte Strings
Converts a human-readable string back to a number representing raw bytes:

```typescript
import { parseBytes } from 'bytes-kit';

parseBytes('1.5 MB');  // => 1500000
parseBytes('20 KiB');  // => 20480
parseBytes('-5 KB');   // => -5000
parseBytes('100');     // => 100
```

### 3. Comparing Byte Sizes
Finds the larger or smaller value between two inputs. Returns a formatted string.

```typescript
import { getLargerByte, getSmallerByte } from 'bytes-kit';

getLargerByte('1.5 MB', '2000 KB');  // => '2 MB'
getSmallerByte('1.5 MB', 2000000);   // => '1.5 MB'
```

### 4. Byte Equality & Difference
Checks equality or computes the difference between two byte sizes (`a - b`).

```typescript
import { isEqualBytes, diffBytes } from 'bytes-kit';

isEqualBytes('1 MB', '1000 KB'); // => true
isEqualBytes('1 MiB', '1024 KiB'); // => true

diffBytes('1.5 MB', '500 KB'); // => '1 MB'
diffBytes('500 KB', '1.5 MB'); // => '-1 MB'
```

### 5. Summing Collections
Sums an array of byte sizes and returns the formatted sum.

```typescript
import { sumBytes } from 'bytes-kit';

sumBytes(['1 MB', '500 KB']); // => '1.5 MB'
```

### 6. Sorting Collections
Sorts an array of byte values while preserving their original formats (string or number). Returns a new array.

```typescript
import { sortBytes } from 'bytes-kit';

sortBytes(['1 MB', '200 KB', '2 GB']); // => ['200 KB', '1 MB', '2 GB']
sortBytes(['1 MB', '200 KB', '2 GB'], 'desc'); // => ['2 GB', '1 MB', '200 KB']
```

### 7. Converting Byte Units
Converts a byte value (number or string) to a target unit (e.g. `'KB'`, `'MiB'`). Returns a raw number by default, or a formatted string if `{ format: true }` is provided:

```typescript
import { convertBytes } from 'bytes-kit';

convertBytes('10 MB', 'KB');                  // => 10000 (number)
convertBytes('1 GiB', 'MiB');                 // => 1024 (number)
convertBytes('1 GiB', 'MB');                  // => 1073.741824 (number)
convertBytes('1.5 MB', 'KB', { format: true }); // => '1500 KB' (string)
```

### 8. Helper Utilities
Validate representations or detect units:

```typescript
import { isValidByte, detectUnit } from 'bytes-kit';

isValidByte('1 MB');   // => true
isValidByte('invalid'); // => false

detectUnit('5 GiB');   // => 'GiB'
detectUnit('500');     // => 'B'
```

### 9. Analyzing Collections
Parses a list of mixed sizes and returns an analysis object:

```typescript
import { analyzeBytes } from 'bytes-kit';

const stats = analyzeBytes(['500 KB', '1.2 MB', 3000000, '4.5 MiB']);
/*
Returns:
{
  largest: '4.72 MB',
  smallest: '500 KB',
  average: '2.35 MB'
}
*/
```

---

## API Reference

### `formatBytes(bytes: number, options?: FormatOptions): string`
Formats a numeric number of bytes.

#### `FormatOptions`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `binary` | `boolean` | `false` | Use binary units (base-1024, e.g. KiB, MiB). |
| `decimalPlaces` | `number` | `2` | The maximum number of decimal places to include. |
| `fixedDecimals` | `boolean` | `false` | If `true`, always displays trailing zeros in the decimal part. |
| `space` | `boolean` | `true` | Include a space between the value and the unit. |
| `unit` | `UnitType` | `undefined` | Forces conversion to a specific unit (e.g., `'MB'`, `'GiB'`). |
| `locale` | `string \| boolean` | `false` | Localizes the formatted string using `Intl.NumberFormat`. |

### `parseBytes(input: string): number`
Parses a string size back to bytes. Supports standard decimal (B, KB, MB...) and binary (KiB, MiB, GiB...) units case-insensitively.

### `getLargerByte(a: number | string, b: number | string, options?: FormatOptions): string`
Compares `a` and `b` and returns the larger size formatted as a string.

### `getSmallerByte(a: number | string, b: number | string, options?: FormatOptions): string`
Compares `a` and `b` and returns the smaller size formatted as a string.

### `diffBytes(a: number | string, b: number | string, options?: FormatOptions): string`
Returns the difference `a - b` formatted as a string.

### `isEqualBytes(a: number | string, b: number | string): boolean`
Returns true if `a` and `b` represent equivalent byte capacities.

### `sumBytes(values: (number | string)[], options?: FormatOptions): string`
Sums the array of byte sizes and returns the formatted sum.

### `sortBytes(values: (number | string)[], order?: 'asc' | 'desc'): (number | string)[]`
Sorts the collection of byte sizes and returns a new sorted array.

### `isValidByte(value: number | string): boolean`
Returns true if `value` is a valid byte representation.

### `detectUnit(value: string): UnitType`
Returns the detected `UnitType` symbol of the byte representation.

### `convertBytes(input: number | string, targetFormat: UnitType, options?: FormatOptions & { format?: boolean }): number | string`
Converts a byte value (number or string) to a target unit. If `options.format` is true, returns a formatted string using the specified formatting options; otherwise, returns the raw converted number.

---

## License

MIT © [Cool Dev Master](https://github.com/cool-Dev-master)
