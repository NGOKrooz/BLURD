/**
 * Test route for validating proof generation
 * GET /api/test/proofs
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if circuit files exist
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const circuits = [
      { name: 'age18', wasm: '/zk/age18.wasm', zkey: '/zk/age18.zkey' },
      { name: 'country', wasm: '/zk/countryProof.wasm', zkey: '/zk/countryProof.zkey' },
    ];

    const results: Record<string, string> = {};

    for (const circuit of circuits) {
      try {
        // Try to fetch WASM file to check if it exists
        const wasmUrl = `${baseUrl}${circuit.wasm}`;
        const wasmResponse = await fetch(wasmUrl, { method: 'HEAD' });
        
        const zkeyUrl = `${baseUrl}${circuit.zkey}`;
        const zkeyResponse = await fetch(zkeyUrl, { method: 'HEAD' });

        if (wasmResponse.ok && zkeyResponse.ok) {
          results[`${circuit.name}Proof`] = 'ok';
        } else {
          results[`${circuit.name}Proof`] = `missing files (wasm: ${wasmResponse.ok ? 'ok' : 'missing'}, zkey: ${zkeyResponse.ok ? 'ok' : 'missing'})`;
        }
      } catch (error: any) {
        results[`${circuit.name}Proof`] = `error: ${error.message}`;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

