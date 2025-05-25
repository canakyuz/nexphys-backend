import * as bcrypt from 'bcryptjs';
import { envConfig } from '@/config/env.config';

export class HashUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, envConfig.BCRYPT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
