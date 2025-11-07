// Type override for @ethereumjs/tx to fix overload signature compatibility issue
// This fixes the TypeScript error: "This overload signature is not compatible with its implementation signature"
declare module '@ethereumjs/tx' {
  export class LegacyTransaction {
    getMessageToSign(hashMessage: false): Buffer[];
    getMessageToSign(hashMessage: true): Buffer;
    getMessageToSign(hashMessage?: boolean): Buffer | Buffer[];
  }
}

declare module '@ethereumjs/tx/src/legacyTransaction' {
  export class LegacyTransaction {
    getMessageToSign(hashMessage: false): Buffer[];
    getMessageToSign(hashMessage: true): Buffer;
    getMessageToSign(hashMessage?: boolean): Buffer | Buffer[];
  }
}

