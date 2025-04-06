import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

export class YamaGenerator {
  mt: MT19937ar;

  constructor(b64seed: string) {
    const N_INIT = 624;

    const binary = Uint8Array.from(atob(b64seed), (c) => c.charCodeAt(0));
    const dataView = new DataView(binary.buffer);

    // unsigned intを624個読み取る
    const init = [];
    for (let i = 0; i < N_INIT; i++) {
      init.push(dataView.getUint32(i * 4, true)); // リトルエンディアン指定
    }

    this.mt = new MT19937ar();
    this.mt.init_by_array(init);
  }

  generate(): number[] {
    const N_SRC = 288;
    const src: number[] = [];
    for (let i = 0; i < N_SRC; i++) {
      src.push(Number(this.mt.genrand_int32()));
    }

    const N_RND = 136; // 実際は144
    const rnd: number[] = [];

    for (let i = 0; i < N_SRC / 32; i++) {
      const buffer = Buffer.alloc(32 * 4);
      for (let j = 0; j < 32; j++) {
        buffer.writeUInt32LE(src[32 * i + j], j * 4);
      }
      const hash = createHash("sha512").update(buffer).digest();

      for (let k = 0; k < 16; k++) {
        rnd.push(hash.readUInt32LE(k * 4));
      }
    }

    const yama = Array.from({ length: N_RND }, (_, i) => i);
    for (let i = 0; i < N_RND; i++) {
      const j = (rnd[i] % (N_RND - i)) + i;
      [yama[i], yama[j]] = [yama[j], yama[i]];
    }

    return yama;
  }
}

class MT19937ar {
  N: number;
  M: number;
  MATRIX_A: bigint;
  UPPER_MASK: bigint;
  LOWER_MASK: bigint;
  mt: bigint[];
  mti: number;

  constructor() {
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 0x9908b0dfn;
    this.UPPER_MASK = 0x80000000n;
    this.LOWER_MASK = 0x7fffffffn;
    this.mt = new Array(this.N).fill(BigInt(0));
    this.mti = this.N + 1;
  }
  init_genrand(s: number): void {
    this.mt[0] = BigInt(s) & 0xFFFFFFFFn;
    for (let mti = 1; mti < this.N; mti++) {
      this.mt[mti] = BigInt(1812433253) *
          (this.mt[mti - 1] ^ (this.mt[mti - 1] >> BigInt(30))) +
        BigInt(mti);
      this.mt[mti] &= 0xFFFFFFFFn;
    }
    this.mti = this.N;
  }

  init_by_array(init_key: number[]): void {
    this.init_genrand(19650218);
    let i = 1;
    let j = 0;
    const k = Math.max(this.N, init_key.length);
    for (let x = 0; x < k; x++) {
      this.mt[i] = (this.mt[i] ^
        ((this.mt[i - 1] ^ (this.mt[i - 1] >> BigInt(30))) *
          BigInt(1664525))) +
        BigInt(init_key[j]) + BigInt(j);
      this.mt[i] &= 0xFFFFFFFFn;
      i++;
      j++;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
      if (j >= init_key.length) j = 0;
    }
    for (let x = 0; x < this.N - 1; x++) {
      this.mt[i] = (this.mt[i] ^
        ((this.mt[i - 1] ^ (this.mt[i - 1] >> BigInt(30))) *
          BigInt(1566083941))) - BigInt(i);
      this.mt[i] &= 0xFFFFFFFFn;
      i++;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
    }

    this.mt[0] = 0x80000000n;
  }

  genrand_int32(): bigint {
    const mag01 = [0x0n, this.MATRIX_A];

    if (this.mti >= this.N) {
      if (this.mti == this.N + 1) {
        this.init_genrand(5489);
      }
      for (let kk = 0; kk < this.N - this.M; kk++) {
        const y = (this.mt[kk] & this.UPPER_MASK) |
          (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >> BigInt(1)) ^
          mag01[Number(y & BigInt(1))];
      }

      for (let kk = this.N - this.M; kk < this.N - 1; kk++) {
        const y = (this.mt[kk] & this.UPPER_MASK) |
          (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >> BigInt(1)) ^
          mag01[Number(y & BigInt(1))];
      }

      const y = (this.mt[this.N - 1] & this.UPPER_MASK) |
        (this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >> BigInt(1)) ^
        mag01[Number(y & BigInt(1))];

      this.mti = 0;
    }

    let y = this.mt[this.mti];
    this.mti += 1;

    y ^= y >> BigInt(11);
    y ^= (y << BigInt(7)) & 0x9D2C5680n;
    y ^= (y << BigInt(15)) & 0xEFC60000n;
    y ^= y >> BigInt(18);

    return y;
  }
}
