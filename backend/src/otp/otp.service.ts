import { Injectable } from '@nestjs/common';

interface OtpData {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private otpStore: Map<string, OtpData> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_MINUTES = 15;
  private rateLimitStore: Map<string, { count: number; resetAt: Date }> = new Map();

  /**
   * Generate a 6-digit numeric OTP
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP for an email
   */
  storeOtp(email: string, otp: string): void {
    // Remove any existing OTP for this email
    this.otpStore.delete(email);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    this.otpStore.set(email, {
      code: otp,
      email,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired OTPs periodically
    this.cleanupExpiredOtps();
  }

  /**
   * Verify OTP for an email
   */
  verifyOtp(email: string, otp: string): boolean {
    const otpData = this.otpStore.get(email);

    if (!otpData) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return false;
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(email);
      return false;
    }

    // Increment attempts
    otpData.attempts++;

    // Verify OTP
    if (otpData.code === otp) {
      // OTP verified successfully, remove it
      this.otpStore.delete(email);
      return true;
    }

    // If max attempts reached after this attempt, remove OTP
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(email);
    }

    return false;
  }

  /**
   * Check if email can request a new OTP (rate limiting)
   */
  canRequestOtp(email: string): { allowed: boolean; resetAt?: Date } {
    const rateLimit = this.rateLimitStore.get(email);

    if (!rateLimit) {
      return { allowed: true };
    }

    // Check if rate limit period has passed
    if (new Date() > rateLimit.resetAt) {
      this.rateLimitStore.delete(email);
      return { allowed: true };
    }

    // Check if max requests exceeded (3 requests per 15 minutes)
    if (rateLimit.count >= 3) {
      return { allowed: false, resetAt: rateLimit.resetAt };
    }

    return { allowed: true };
  }

  /**
   * Record an OTP request for rate limiting
   */
  recordOtpRequest(email: string): void {
    const rateLimit = this.rateLimitStore.get(email);

    if (!rateLimit || new Date() > rateLimit.resetAt) {
      // Create new rate limit entry
      const resetAt = new Date();
      resetAt.setMinutes(resetAt.getMinutes() + this.RATE_LIMIT_MINUTES);
      this.rateLimitStore.set(email, { count: 1, resetAt });
    } else {
      // Increment count
      rateLimit.count++;
    }
  }

  /**
   * Remove verified OTP (called after successful verification)
   */
  removeOtp(email: string): void {
    this.otpStore.delete(email);
  }

  /**
   * Check if email has a valid (non-expired) OTP
   */
  hasValidOtp(email: string): boolean {
    const otpData = this.otpStore.get(email);
    if (!otpData) {
      return false;
    }
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return false;
    }
    return true;
  }

  /**
   * Clean up expired OTPs
   */
  private cleanupExpiredOtps(): void {
    const now = new Date();
    for (const [email, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(email);
      }
    }

    // Clean up expired rate limits
    for (const [email, rateLimit] of this.rateLimitStore.entries()) {
      if (now > rateLimit.resetAt) {
        this.rateLimitStore.delete(email);
      }
    }
  }

  /**
   * Get remaining time for OTP (in seconds)
   */
  getRemainingTime(email: string): number {
    const otpData = this.otpStore.get(email);
    if (!otpData) {
      return 0;
    }
    const remaining = Math.max(0, Math.floor((otpData.expiresAt.getTime() - Date.now()) / 1000));
    return remaining;
  }
}
