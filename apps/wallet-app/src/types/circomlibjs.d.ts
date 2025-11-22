declare module 'circomlibjs' {
  export function poseidon(inputs: (bigint | number | string)[]): bigint;
  export function poseidonHash(inputs: (bigint | number | string)[]): string;
  export function buildPoseidon(): Promise<any>;
  export function buildPoseidonReference(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildEddsa(): Promise<any>;
}

