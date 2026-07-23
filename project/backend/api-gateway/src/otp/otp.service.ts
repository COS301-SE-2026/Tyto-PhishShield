import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface OtpEntry {
  code: string;
  expiry: number;
}

@Injectable()
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();

  generate(email: string): string {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    this.store.set(email.toLowerCase(), {
      code,
      expiry: Date.now() + 10 * 60 * 1000,
    });
    return code;
  }

  verify(email: string, code: string): boolean {
    const entry = this.store.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.store.delete(email.toLowerCase());
      return false;
    }
    if (entry.code !== code) return false;
    this.store.delete(email.toLowerCase());
    return true;
  }
}
