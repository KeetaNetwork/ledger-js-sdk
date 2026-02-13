import type Transport from '@ledgerhq/hw-transport';
import { CLA, INS, STATUS_WORD } from './constants.js';
import { Algorithm, type TokenInfo } from './types.js';
import { buildGetPublicKeyData, buildProvideTokenData } from './apdu/builder.js';
import { createStreamChunks } from './apdu/chunker.js';
import { UserCancelledError, TransportError } from './errors.js';

/**
 * Low-level transport wrapper for the Keeta Ledger application.
 *
 * Sends raw APDUs via @ledgerhq/hw-transport. Each method corresponds
 * directly to one device command (or streaming sequence).
 */
export class KeetaTransport {
  private transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  private async send(
    ins: number,
    p1: number,
    p2: number,
    data?: Uint8Array,
  ): Promise<Uint8Array> {
    try {
      const buf = data ? Buffer.from(data) : Buffer.alloc(0);
      const response = await this.transport.send(CLA, ins, p1, p2, buf);
      return new Uint8Array(response);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const sw = (error as { statusCode: number }).statusCode;
        if (sw === STATUS_WORD.USER_CANCELLED) {
          throw new UserCancelledError();
        }
      }
      if (error instanceof Error && error.message.includes('cannot open device')) {
        throw new TransportError('Ledger device not connected or app not open');
      }
      throw error;
    }
  }

  async getVersion(): Promise<Uint8Array> {
    return this.send(INS.GET_VERSION, 0x00, 0x00);
  }

  async getPublicKey(
    index: number,
    algorithm: Algorithm,
    display: boolean,
  ): Promise<Uint8Array> {
    const data = buildGetPublicKeyData(index);
    return this.send(INS.GET_PUBLIC_KEY, display ? 0x01 : 0x00, algorithm, data);
  }

  /**
   * Execute a streaming sign sequence (SIGN_BLOCK or SIGN_MESSAGE).
   *
   * P2 must be a valid algorithm on ALL packets (device parses it every time).
   * Only the FIRST handler uses the algorithm for key derivation.
   */
  async streamSign(
    ins: number,
    index: number,
    algorithm: Algorithm,
    data: Uint8Array,
  ): Promise<Uint8Array> {
    const chunks = createStreamChunks(index, data);

    let response: Uint8Array = new Uint8Array(0);
    for (const chunk of chunks) {
      response = await this.send(ins, chunk.phase, algorithm, chunk.data) as Uint8Array;
    }

    return response;
  }

  async signBlock(index: number, algorithm: Algorithm, data: Uint8Array): Promise<Uint8Array> {
    return this.streamSign(INS.SIGN_BLOCK, index, algorithm, data);
  }

  async signMessage(index: number, algorithm: Algorithm, data: Uint8Array): Promise<Uint8Array> {
    return this.streamSign(INS.SIGN_MESSAGE, index, algorithm, data);
  }

  async provideTokenInfo(info: TokenInfo): Promise<void> {
    const data = buildProvideTokenData(info);
    await this.send(INS.PROVIDE_TOKEN, 0x00, 0x00, data);
  }
}
