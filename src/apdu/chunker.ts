import { SignPhase } from '../types.js';
import { MAX_APDU_DATA_SIZE, INDEX_SIZE } from '../constants.js';
import { ValidationError } from '../errors.js';

export interface StreamChunk {
  phase: SignPhase;
  data: Uint8Array;
}

/**
 * Split data into streaming APDU chunks (FIRST / ADD* / LAST).
 *
 * FIRST: [index:4BE] + data[0..N]
 * ADD:   data[N..N+255]  (zero or more)
 * LAST:  data[remaining]  (always emitted, may be empty)
 *
 * The device always expects a LAST packet to finalize signing.
 */
export function createStreamChunks(
  index: number,
  data: Uint8Array,
): StreamChunk[] {
  if (!Number.isInteger(index) || index < 0 || index > 0xffffffff) {
    throw new ValidationError(`Index must be a uint32, got: ${index}`);
  }

  const chunks: StreamChunk[] = [];

  // FIRST chunk: index prefix + initial data
  const maxFirstData = MAX_APDU_DATA_SIZE - INDEX_SIZE;
  const firstDataEnd = Math.min(data.length, maxFirstData);
  const firstPayload = new Uint8Array(INDEX_SIZE + firstDataEnd);
  const indexView = new DataView(firstPayload.buffer);
  indexView.setUint32(0, index, false);
  if (firstDataEnd > 0) {
    firstPayload.set(data.subarray(0, firstDataEnd), INDEX_SIZE);
  }

  chunks.push({ phase: SignPhase.First, data: firstPayload });

  let offset = firstDataEnd;

  while (offset < data.length) {
    const remaining = data.length - offset;

    if (remaining <= MAX_APDU_DATA_SIZE) {
      // Final portion -> LAST
      chunks.push({
        phase: SignPhase.Last,
        data: new Uint8Array(data.subarray(offset, offset + remaining)),
      });
      offset += remaining;
    } else {
      // Middle chunk -> ADD
      chunks.push({
        phase: SignPhase.Add,
        data: new Uint8Array(data.subarray(offset, offset + MAX_APDU_DATA_SIZE)),
      });
      offset += MAX_APDU_DATA_SIZE;
    }
  }

  // If all data fit in FIRST, still need an empty LAST
  if (chunks.length === 1) {
    chunks.push({ phase: SignPhase.Last, data: new Uint8Array(0) });
  }

  return chunks;
}
