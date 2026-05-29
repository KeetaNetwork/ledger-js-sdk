/** APDU Class byte for the Keeta application. */
export const CLA = 0xe0;

/** APDU Instruction codes. */
export const INS = {
	GET_VERSION: 0x00,
	GET_PUBLIC_KEY: 0x01,
	SIGN_BLOCK: 0x02,
	SIGN_MESSAGE: 0x03,
	PROVIDE_TOKEN: 0x04
} as const;

/** Maximum data payload per APDU (Lc field is a single byte). */
export const MAX_APDU_DATA_SIZE = 255;

/** Size of the key derivation index in bytes (uint32 big-endian). */
export const INDEX_SIZE = 4;

/** Token address size (compressed public key). */
export const TOKEN_ADDRESS_SIZE = 33;

/** Maximum token symbol length. */
export const MAX_SYMBOL_LENGTH = 8;

/** Ledger status words. */
export const STATUS_WORD = {
	OK: 0x9000,
	BAD_LEN: 0x6700,
	USER_CANCELLED: 0x6985,
	BAD_P1P2: 0x6b00,
	BAD_INS: 0x6d00,
	BAD_CLA: 0x6e00,
	SDK_ERROR: 0x6e02,
	UNKNOWN: 0x6f00
} as const;
