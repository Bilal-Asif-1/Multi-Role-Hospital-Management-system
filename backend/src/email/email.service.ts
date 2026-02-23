import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Only create transporter if SMTP config is provided (and not placeholder values)
    const isPlaceholder = !smtpUser || !smtpPass ||
      smtpUser === 'your-email@gmail.com' || smtpPass === 'your-app-password-here';

    if (smtpHost && smtpPort && smtpUser && smtpPass && !isPlaceholder) {
      try {
        const port = parseInt(smtpPort, 10);
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465, // 465 = SSL, 587 = TLS
          auth: {
            user: smtpUser.trim(),
            pass: String(smtpPass).trim().replace(/\s/g, ''), // Remove spaces from app password
          },
          ...(port === 587 && {
            requireTLS: true,
            tls: { rejectUnauthorized: false }, // Allow self-signed in dev only
          }),
        });
        this.logger.log(`Email service initialized (${smtpHost}:${smtpPort})`);
      } catch (error) {
        this.logger.error('Failed to initialize email transporter:', error);
        this.transporter = null;
      }
    } else if (isPlaceholder) {
      this.logger.warn('SMTP placeholders detected. Update .env with real Gmail and App Password.');
      this.transporter = null;
    } else {
      this.logger.warn('Email service not configured. SMTP settings missing in environment variables.');
      this.logger.warn('Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file');
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error('Email service not configured. Configure SMTP in .env to send OTP to user email.');
      throw new Error('Email service is not configured. Please configure SMTP settings (SMTP_USER, SMTP_PASS) in .env to send verification code to your email.');
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
    
    const mailOptions = {
      from: `IHIS <${fromEmail}>`,
      to: email,
      subject: 'Your IHIS Registration Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #000000; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">IHIS</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Hospital Management System</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with IHIS. Please use the following verification code to complete your registration:
            </p>
            <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666666; letter-spacing: 2px;">Your verification code:</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 8px;">${otp}</p>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      this.logger.log(`Sending OTP email to: ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error('Error sending OTP email:', error);
      this.logger.error('Recipient was:', email);
      this.logger.error('Error code:', error?.code);
      this.logger.error('Error response:', error?.response);
      throw new Error(error?.message || 'Failed to send verification email. Please try again.');
    }
  }

  async sendPasswordResetOtpEmail(email: string, otp: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error('Email service not configured. Configure SMTP in .env to send password reset code.');
      throw new Error('Email service is not configured. Please configure SMTP settings to send password reset code.');
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');

    const mailOptions = {
      from: `IHIS <${fromEmail}>`,
      to: email,
      subject: 'IHIS – Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #000000; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">IHIS</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Hospital Management System</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333333; margin-top: 0;">Password Reset</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
              Use the code below to reset your password. If you did not request this, please ignore this email.
            </p>
            <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666666; letter-spacing: 2px;">Your code:</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 8px;">${otp}</p>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              This code expires in <strong>10 minutes</strong>.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    };

    try {
      this.logger.log(`Sending password reset OTP to: ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error('Error sending password reset email:', error);
      throw new Error(error?.message || 'Failed to send password reset email.');
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email service connection error:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}
