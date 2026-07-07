import { format } from './src/index.js';

console.log('--- Bytes Kit Playground ---');

// Feel free to modify the input bytes and options to test the output!
const testValue = 123456789;

console.log(`Input value: ${testValue} bytes\n`);
console.log('Default format:     ', format(testValue));
console.log('Binary units:       ', format(testValue, { binary: true }));
console.log('Fixed decimals (3): ', format(testValue, { decimalPlaces: 3, fixedDecimals: true }));
console.log('German locale:      ', format(testValue, { locale: 'de-DE' }));
console.log('No space:           ', format(testValue, { space: false }));
console.log('Forced unit (KB):   ', format(testValue, { unit: 'KB' }));
