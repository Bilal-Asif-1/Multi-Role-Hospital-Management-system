# Email OTP Verification Setup

This document explains how to configure email sending for OTP verification in the registration process.

## Environment Variables

Add the following environment variables to your `.env` file in the `backend` directory:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ihis.com
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS`

3. **Update `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=noreply@ihis.com
   ```

## Other Email Providers

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Testing Email Connection

The email service will automatically verify the connection when the server starts. Check the console logs for any connection errors.

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of your main account password
- For production, use a dedicated email service (SendGrid, AWS SES, etc.)
- Consider using environment-specific email addresses

## Troubleshooting

### "Failed to send verification email"
- Check that SMTP credentials are correct
- Verify SMTP server allows connections from your IP
- Check firewall settings
- For Gmail, ensure 2-Step Verification is enabled and app password is used

### "Connection timeout"
- Verify SMTP_HOST and SMTP_PORT are correct
- Check network connectivity
- Some providers require specific ports (587 for TLS, 465 for SSL)
