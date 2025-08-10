declare module 'jwks-client' {
  export interface SigningKey {
    getPublicKey(): string;
  }

  export interface JwksClientOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
  }

  export interface JwksClient {
    getSigningKey(kid: string, callback: (err: Error | null, key?: SigningKey) => void): void;
  }

  declare function jwksClient(options: JwksClientOptions): JwksClient;
  export default jwksClient;
}
