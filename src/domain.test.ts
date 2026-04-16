import { test, describe, expect } from 'vitest';
import { domainSeparate } from './domain.js';
import { ValidationError } from './errors.js';

const EMPTY_TAG_MESSAGE = /must not be empty/i;
const TAG_TOO_LONG_MESSAGE = /255/;

function hex(bytes: Uint8Array): string {
  const encoded = Buffer.from(bytes).toString('hex');
  return encoded;
}

describe('domainSeparate', function () {
  test('prepends magic byte, tag length, and tag to data', function () {
    const data = new Uint8Array([0xaa, 0xbb, 0xcc]);
    const result = domainSeparate('AB', data);
    expect(hex(result)).toBe('19024142aabbcc');
  });

  test('string and Uint8Array tags are equivalent when bytes match', function () {
    const data = new Uint8Array([1, 2, 3]);
    const fromString = domainSeparate('AB', data);
    const fromBytes = domainSeparate(new Uint8Array([0x41, 0x42]), data);
    expect(Array.from(fromString)).toEqual(Array.from(fromBytes));
  });

  test('UTF-8 string is byte-counted not character-counted', function () {
    // "é" is 2 bytes in UTF-8 (0xc3 0xa9).
    const result = domainSeparate('é', new Uint8Array());
    expect(Array.from(result)).toEqual([0x19, 0x02, 0xc3, 0xa9]);
  });

  test('empty data body is allowed (produces just the prefix)', function () {
    const result = domainSeparate('tag', new Uint8Array());
    expect(Array.from(result)).toEqual([0x19, 0x03, 0x74, 0x61, 0x67]);
  });

  test.each([
    { label: 'empty string', tag: '' },
    { label: 'empty Uint8Array', tag: new Uint8Array() },
  ])('rejects $label tag', function ({ tag }) {
    expect(function () { domainSeparate(tag, new Uint8Array([1])); }).toThrow(ValidationError);
    expect(function () { domainSeparate(tag, new Uint8Array([1])); }).toThrow(EMPTY_TAG_MESSAGE);
  });

  test.each([
    { label: 'string tag of 256 bytes', tag: 'A'.repeat(256) },
    { label: 'Uint8Array tag of 256 bytes', tag: new Uint8Array(256).fill(0x41) },
  ])('rejects $label as too long', function ({ tag }) {
    expect(function () { domainSeparate(tag, new Uint8Array()); }).toThrow(ValidationError);
    expect(function () { domainSeparate(tag, new Uint8Array()); }).toThrow(TAG_TOO_LONG_MESSAGE);
  });

  test('accepts tag of exactly 255 bytes (boundary)', function () {
    const tag = 'A'.repeat(255);
    const result = domainSeparate(tag, new Uint8Array([0xff]));
    const expected = new Uint8Array([0x19, 255, ...new Uint8Array(255).fill(0x41), 0xff]);
    expect(Array.from(result)).toEqual(Array.from(expected));
  });
});
