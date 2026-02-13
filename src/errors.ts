export class KeetaLedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeetaLedgerError';
  }
}

export class UserCancelledError extends KeetaLedgerError {
  constructor() {
    super('User rejected the operation on the Ledger device');
    this.name = 'UserCancelledError';
  }
}

export class TransportError extends KeetaLedgerError {
  constructor(message: string) {
    super(message);
    this.name = 'TransportError';
  }
}

export class ValidationError extends KeetaLedgerError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
