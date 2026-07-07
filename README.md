# bytes-kit

A lightweight, type-safe, and zero-dependency utility for formatting, parsing, comparing, and analyzing byte sizes (supporting both decimal base-1000 and binary base-1024 units).

## Features

- 🚀 **Zero dependencies** & lightweight
- 📦 **Dual package** (CommonJS & ES Modules)
- 🔒 **Fully type-safe** with TypeScript types included
- ⚙️ **Highly customizable** (decimal places, binary vs. decimal units, spacing, custom forced units)
- 🧭 **Parsing & Manipulation** (parse strings back to bytes, compare sizes, get differences, calculate stats on collections)
- 🌍 **Localization support** using `Intl.NumberFormat`

---

## Installation

```bash
npm install bytes-kit
```

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
Finds the larger or smaller value between two inputs. Accepts both `number` and `string` types.

```typescript
import { getLargeByte, getSmallerByte } from 'bytes-kit';

getLargeByte('1.5 MB', '2000 KB');  // => 2000000 (which is 2 MB)
getSmallerByte('1.5 MB', 2000000);  // => 1500000 (which is 1.5 MB)
```

### 4. Byte Difference
Computes the difference between two byte sizes (`a - b`).

```typescript
import { diffBytes } from 'bytes-kit';

diffBytes('1.5 MB', '500 KB'); // => 1000000 (1 MB)
diffBytes('500 KB', '1.5 MB'); // => -1000000 (-1 MB)
```

### 5. Analyzing Collections
Parses a list of mixed sizes and returns an analysis object:

```typescript
import { analyzeBytes } from 'bytes-kit';

const stats = analyzeBytes(['500 KB', '1.2 MB', 3000000, '4.5 MiB']);
/*
Returns:
{
  largest: 4718592,   // 4.5 MiB
  smallest: 500000,   // 500 KB
  average: 2354648    // 2.35 MB
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

### `getLargeByte(a: number | string, b: number | string): number`
Compares `a` and `b` and returns the larger size in bytes.

### `getSmallerByte(a: number | string, b: number | string): number`
Compares `a` and `b` and returns the smaller size in bytes.

### `diffBytes(a: number | string, b: number | string): number`
Returns the difference `a - b` in bytes.

### `analyzeBytes(inputs: (number | string)[]): ByteStats`
Returns the `largest`, `smallest`, and `average` byte sizes from an array of mixed byte inputs.

---

## License

MIT © [Cool Dev Master](https://github.com/cool-Dev-master)
