/**
 * Supported cryptographic algorithms.
 * Values match P2 bytes sent to the Ledger device.
 */
export enum Algorithm {
	Secp256k1 = 0x00,
	Ed25519 = 0x01,
	Secp256r1 = 0x06
}

/**
 * Streaming phase for SIGN_BLOCK and SIGN_MESSAGE.
 */
export enum SignPhase {
	First = 0x00,
	Add = 0x01,
	Last = 0x02
}

/**
 * Application version returned by GET_VERSION.
 */
export interface Version {
	/** Device flags byte. Bit 0 (0x01): blind signing enabled. */
	flags: number;
	major: number;
	minor: number;
	patch: number;
}

/**
 * Public key and address from GET_PUBLIC_KEY.
 */
export interface PublicKeyResponse {
	/** Compressed public key (33 bytes for secp256k1/r1, 32 bytes for Ed25519). */
	publicKey: Uint8Array;
	/** Keeta address string (keeta_...). */
	address: string;
}

/**
 * 64-byte raw signature (r || s).
 */
export interface Signature {
	raw: Uint8Array;
}

/**
 * Token metadata for PROVIDE_TOKEN_INFO command.
 */
export interface TokenInfo {
	/** Token symbol, 1-8 ASCII characters. */
	symbol: string;
	/** Compressed public key of the token account (exactly 33 bytes). */
	tokenAddress: Uint8Array;
	/** Number of decimal places (0-255). */
	decimals: number;
	/** Network chain ID (uint32). */
	chainId: number;
	/** DER-encoded secp256k1 signature over SHA3-256(symbol || tokenAddress || decimals || chainId). */
	signature: Uint8Array;
}

/**
 * Keeta block data to be signed. Treated as opaque bytes streamed to the device.
 */
export type KeetaBlock = Uint8Array;
