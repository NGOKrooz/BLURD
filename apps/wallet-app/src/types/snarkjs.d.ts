declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  }

  export interface Groth16PublicSignals {
    [key: number]: string;
  }

  export interface Groth16 {
    fullProve(
      input: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{
      proof: Groth16Proof;
      publicSignals: Groth16PublicSignals;
    }>;
    verify(
      vk: any,
      publicSignals: Groth16PublicSignals,
      proof: Groth16Proof
    ): Promise<boolean>;
  }

  export const groth16: Groth16;
}

