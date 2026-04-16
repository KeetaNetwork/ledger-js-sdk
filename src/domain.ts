import { DOMAIN_SEPARATION_MAGIC_BYTE, MAX_TAG_LENGTH } from './constants.js';
import { ValidationError } from './errors.js';

/**
 * Build `[0x19][tag_len:1B][tag][data]` for domain-separated message signing.
 *
 * String tags are UTF-8 encoded; Uint8Array tags are used verbatim.
 * See `KeetaLedger.signMessage` for the full signing/verification contract.
 *
 * @throws ValidationError if the encoded tag is empty or longer than `MAX_TAG_LENGTH` bytes.
 */
export function domainSeparate(
  tag: string | Uint8Array,
  data: Uint8Array,
): Uint8Array {
  let tagBytes: Uint8Array;
  if (typeof tag === 'string') {
    tagBytes = new TextEncoder().encode(tag);
  } else {
    tagBytes = tag;
  }

  if (tagBytes.length === 0) {
    throw new ValidationError('Domain separation tag must not be empty');
  }
  if (tagBytes.length > MAX_TAG_LENGTH) {
    throw new ValidationError(
      `Domain separation tag must be 1-${MAX_TAG_LENGTH} bytes, got: ${tagBytes.length}`,
    );
  }

  const out = new Uint8Array(1 + 1 + tagBytes.length + data.length);
  let offset = 0;
  out[offset++] = DOMAIN_SEPARATION_MAGIC_BYTE;
  out[offset++] = tagBytes.length;
  out.set(tagBytes, offset);
  offset += tagBytes.length;
  out.set(data, offset);

  return out;
}
