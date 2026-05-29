import type { Version, PublicKeyResponse, Signature } from '../types.js';
import { KeetaLedgerError } from '../errors.js';

/**
 * Parse GET_VERSION response: [flags, major, minor, patch]
 */
export function parseVersion(data: Uint8Array): Version {
	if (data.length < 4) {
		throw(new KeetaLedgerError(
			`GET_VERSION response too short: expected 4 bytes, got ${data.length}`
		));
	}
	return({
		flags: data[0],
		major: data[1],
		minor: data[2],
		patch: data[3]
	});
}

/**
 * Parse GET_PUBLIC_KEY response: [pubkey_len, pubkey..., addr_len, addr...]
 */
export function parsePublicKey(data: Uint8Array): PublicKeyResponse {
	if (data.length < 4) {
		throw(new KeetaLedgerError('GET_PUBLIC_KEY response too short'));
	}

	let offset = 0;

	const pubkeyLen = data[offset++];
	if (offset + pubkeyLen >= data.length) {
		throw(new KeetaLedgerError(
			`GET_PUBLIC_KEY: pubkey length ${pubkeyLen} exceeds response size`
		));
	}

	const publicKey = new Uint8Array(data.slice(offset, offset + pubkeyLen));
	offset += pubkeyLen;

	const addrLen = data[offset++];
	if (offset + addrLen > data.length) {
		throw(new KeetaLedgerError(
			`GET_PUBLIC_KEY: address length ${addrLen} exceeds response size`
		));
	}

	const addressBytes = data.slice(offset, offset + addrLen);
	const address = new TextDecoder().decode(addressBytes);

	return({ publicKey, address });
}

/**
 * Parse a 64-byte raw signature: [r: 32 bytes][s: 32 bytes]
 */
export function parseSignature(data: Uint8Array): Signature {
	if (data.length !== 64) {
		throw(new KeetaLedgerError(
			`Signature response invalid: expected 64 bytes, got ${data.length}`
		));
	}
	return({
		raw: new Uint8Array(data)
	});
}
