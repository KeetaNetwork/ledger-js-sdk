import type Transport from '@ledgerhq/hw-transport';
import { lib } from '@keetanetwork/keetanet-client';
import type { AccountKeyAlgorithm } from '@keetanetwork/keetanet-client/lib/account';

const { Account } = lib;
const { BufferStorage } = lib.Utils.Buffer;
import { KeetaTransport } from './KeetaTransport.js';
import { parseVersion, parsePublicKey, parseSignature } from './apdu/parser.js';
import {
  Algorithm,
  type Version,
  type PublicKeyResponse,
  type Signature,
  type TokenInfo,
  type KeetaBlock,
} from './types.js';

/**
 * High-level API for interacting with the Keeta Ledger application.
 *
 * Usage:
 *   const transport = await TransportWebHID.create();
 *   const keeta = new KeetaLedger(transport);
 *   const version = await keeta.getVersion();
 *   const address = await keeta.getAddress(0);
 */
export class KeetaLedger {
  private transport: KeetaTransport;

  constructor(transport: Transport) {
    this.transport = new KeetaTransport(transport);
  }

  async getVersion(): Promise<Version> {
    const response = await this.transport.getVersion();
    return parseVersion(response);
  }

  async getAddress(
    index: number,
    algorithm: Algorithm = Algorithm.Secp256k1,
    display: boolean = false,
  ): Promise<string> {
    const response = await this.transport.getPublicKey(index, algorithm, display);
    const { address } = parsePublicKey(response);
    return address;
  }

  async getPublicKey(
    index: number,
    algorithm: Algorithm = Algorithm.Secp256k1,
  ): Promise<Uint8Array> {
    const response = await this.transport.getPublicKey(index, algorithm, false);
    const { publicKey } = parsePublicKey(response);
    return publicKey;
  }

  async getPublicKeyAndAddress(
    index: number,
    algorithm: Algorithm = Algorithm.Secp256k1,
    display: boolean = false,
  ): Promise<PublicKeyResponse> {
    const response = await this.transport.getPublicKey(index, algorithm, display);
    return parsePublicKey(response);
  }

  async signBlock(
    index: number,
    block: KeetaBlock,
    algorithm: Algorithm = Algorithm.Secp256k1,
  ): Promise<Signature> {
    const response = await this.transport.signBlock(index, algorithm, block);
    return parseSignature(response);
  }

  /**
   * Sign an arbitrary message via the Ledger, optionally domain-separated
   * by `namespace`. Verifier MUST pass the same `namespace` to
   * `Account.verify(...)`. String namespaces are UTF-8 encoded; max
   * `MaxNamespaceLength` bytes.
   */
  async signMessage(
    index: number,
    message: Uint8Array,
    algorithm: Algorithm = Algorithm.Secp256k1,
    namespace?: string | ArrayBuffer,
  ): Promise<Signature> {
    const response = await this.transport.signMessage(index, algorithm, message, namespace);
    return parseSignature(response);
  }

  async provideToken(info: TokenInfo): Promise<void> {
    await this.transport.provideTokenInfo(info);
  }

  /**
   * Get a signing Account backed by the Ledger device.
   *
   * Returns Account constructed with ExternalKeyPair that signs
   * via the Ledger. The Account's sign function uses SIGN_BLOCK (the
   * primary use case for Account signing in the Keeta system).
   *
   * For raw message signing, use keeta.signMessage() directly.
   *
   * Usage:
   *   const account = await keeta.getAccount(0);
   *   const sig = await account.sign(blockData);
   */
  async getAccount(
    index: number,
    algorithm: Algorithm = Algorithm.Secp256k1,
  ): Promise<InstanceType<typeof Account>> {
    return this.externalKeyPairAccount(index, algorithm, (data) =>
      this.signBlock(index, data, algorithm),
    );
  }

  /**
   * Like `getAccount`, but the returned Account's `.sign(data, options?)`
   * routes through SIGN_MESSAGE instead of SIGN_BLOCK. Use this for
   * arbitrary-message signing, including namespaced signing via
   * `account.sign(data, { namespace })`.
   */
  async getMessageAccount(
    index: number,
    algorithm: Algorithm = Algorithm.Secp256k1,
  ): Promise<InstanceType<typeof Account>> {
    return this.externalKeyPairAccount(index, algorithm, (data) =>
      this.signMessage(index, data, algorithm),
    );
  }

  private async externalKeyPairAccount(
    index: number,
    algorithm: Algorithm,
    signFn: (data: Uint8Array) => Promise<Signature>,
  ): Promise<InstanceType<typeof Account>> {
    const { publicKey } = await this.getPublicKeyAndAddress(index, algorithm);

    const keyType = algorithm as number as AccountKeyAlgorithm;
    const publicKeyBuffer = new ArrayBuffer(publicKey.byteLength);
    new Uint8Array(publicKeyBuffer).set(publicKey);

    const externalKeyPair = new Account.ExternalKeyPair(
      {
        supportsEncryption: false,
        sign: async (data: ArrayBuffer) => {
          const sig = await signFn(new Uint8Array(data));
          const sigBuffer = new ArrayBuffer(sig.raw.byteLength);
          new Uint8Array(sigBuffer).set(sig.raw);
          return new BufferStorage(sigBuffer, sig.raw.length);
        },
      },
      publicKeyBuffer,
      keyType,
      true,
    );

    return new Account(externalKeyPair);
  }
}
