import type { TokenInfo } from '../types.js';
import { INDEX_SIZE, TOKEN_ADDRESS_SIZE, MAX_SYMBOL_LENGTH } from '../constants.js';
import { ValidationError } from '../errors.js';

export function buildGetPublicKeyData(index: number): Uint8Array {
  if (!Number.isInteger(index) || index < 0 || index > 0xffffffff) {
    throw new ValidationError(`Index must be a uint32, got: ${index}`);
  }
  const buf = new Uint8Array(INDEX_SIZE);
  const view = new DataView(buf.buffer);
  view.setUint32(0, index, false);
  return buf;
}

/**
 * Build data payload for PROVIDE_TOKEN_INFO.
 *
 * Wire format:
 *   [symbol_len: 1B][symbol: 1-8B][token_address: 33B][decimals: 1B][chain_id: 4B BE][DER_signature: var]
 */
export function buildProvideTokenData(info: TokenInfo): Uint8Array {
  const symbolBytes = new TextEncoder().encode(info.symbol);

  if (symbolBytes.length === 0 || symbolBytes.length > MAX_SYMBOL_LENGTH) {
    throw new ValidationError(
      `Token symbol must be 1-${MAX_SYMBOL_LENGTH} bytes, got: ${symbolBytes.length}`,
    );
  }
  if (info.tokenAddress.length !== TOKEN_ADDRESS_SIZE) {
    throw new ValidationError(
      `Token address must be exactly ${TOKEN_ADDRESS_SIZE} bytes, got: ${info.tokenAddress.length}`,
    );
  }
  if (!Number.isInteger(info.decimals) || info.decimals < 0 || info.decimals > 255) {
    throw new ValidationError(`Decimals must be 0-255, got: ${info.decimals}`);
  }
  if (!Number.isInteger(info.chainId) || info.chainId < 0 || info.chainId > 0xffffffff) {
    throw new ValidationError(`Chain ID must be a uint32, got: ${info.chainId}`);
  }
  if (info.signature.length < 8 || info.signature.length > 72) {
    throw new ValidationError(
      `DER signature must be 8-72 bytes, got: ${info.signature.length}`,
    );
  }

  const totalLen =
    1 +
    symbolBytes.length +
    TOKEN_ADDRESS_SIZE +
    1 +
    4 +
    info.signature.length;

  const buf = new Uint8Array(totalLen);
  let offset = 0;

  buf[offset++] = symbolBytes.length;

  buf.set(symbolBytes, offset);
  offset += symbolBytes.length;

  buf.set(info.tokenAddress, offset);
  offset += TOKEN_ADDRESS_SIZE;

  buf[offset++] = info.decimals;

  const chainView = new DataView(buf.buffer, offset, 4);
  chainView.setUint32(0, info.chainId, false);
  offset += 4;

  buf.set(info.signature, offset);

  return buf;
}
