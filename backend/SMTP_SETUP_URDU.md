# SMTP Configuration Guide (اردو)

## Gmail ke liye SMTP Setup (سب سے آسان طریقہ)

### Step 1: Gmail Account mein 2-Step Verification Enable کریں

1. Google Account Settings پر جائیں: https://myaccount.google.com/
2. **Security** tab پر کلک کریں
3. **2-Step Verification** کو enable کریں (اگر پہلے سے enabled نہیں ہے)

### Step 2: App Password Generate کریں

1. Google Account → **Security** → **2-Step Verification** پر جائیں
2. نیچے scroll کریں اور **App passwords** پر کلک کریں
3. **Select app** dropdown سے **Mail** select کریں
4. **Select device** dropdown سے **Other (Custom name)** select کریں
5. Name میں "IHIS Backend" type کریں
6. **Generate** button پر کلک کریں
7. ایک 16-character password ملے گا (مثال: `abcd efgh ijkl mnop`)
8. اس password کو کاپی کریں (spaces کے بغیر)

### Step 3: .env File Update کریں

`backend/.env` file میں یہ lines add کریں:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=apna-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@ihis.com
```

**مثال:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bilal@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@ihis.com
```

**Important:** 
- `SMTP_USER` میں اپنا Gmail address لکھیں
- `SMTP_PASS` میں app password لکھیں (spaces کے ساتھ یا بغیر دونوں کام کریں گے)
- `SMTP_FROM` میں sender name لکھیں

### Step 4: Backend Server Restart کریں

```bash
cd backend
npm run restart
```

یا اگر server چل رہا ہے تو:
1. Server stop کریں (Ctrl+C)
2. Phir se start کریں: `npm run start:dev`

### Step 5: Test کریں

1. Registration page پر جائیں
2. Email enter کریں
3. "Send Verification Code" button پر کلک کریں
4. Email check کریں - OTP code ملنا چاہیے

---

## دوسرے Email Providers کے لیے

### Outlook/Hotmail

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=apna-email@outlook.com
SMTP_PASS=apna-password
SMTP_FROM=noreply@ihis.com
```

### Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

---

## Troubleshooting

### Problem: "Email service is not configured" / "SMTP placeholders detected"
**Solution:** 
- `.env` میں **اصل values** daalein. `your-email@gmail.com` aur `your-app-password-here` placeholder hain — inko apna Gmail aur **App Password** se replace karein.
- App Password yahan se banayein: https://myaccount.google.com/apppasswords

### Problem: "Authentication failed" / Invalid login
**Solution:** 
- Gmail ke liye **App Password** use karein, normal account password nahi.
- 2-Step Verification enable honi chahiye, tab hi App Password milega.
- App password mein spaces daalna ya hataana dono try karein (code ab spaces auto-trim karta hai).

### Problem: "Connection timeout"
**Solution:**
- Internet theek hai ya nahi check karein.
- Firewall / antivirus port 587 block to nahi kar raha.
- Kabhi kabhi office/college network SMTP block karta hai — mobile hotspot se try karein.

### Problem: Email asal inbox par nahi ja rahi
**Solution (step by step):**
1. **Backend console dekhein** — server start par ye log aana chahiye: `Email service initialized (smtp.gmail.com:587)`. Agar "SMTP placeholders detected" aaye to .env sahi se update nahi hua.
2. **Send OTP click karne ke baad** backend console mein dekhein: "Sending OTP email to: your@email.com" aur phir koi error (Error code, Error response). Wahi error batata hai email kyun fail hui.
3. **Spam / Junk folder** zaroor check karein — Gmail kabhi OTP ko spam mein daal deta hai.
4. **Recipient email sahi hai?** — Jo email registration form mein daala hai, wahi address par jati hai. Galat type mat karein.
5. **App Password sahi hai?** — Naya App Password bana kar .env mein `SMTP_PASS` update karein, phir backend **restart** karein.

---

## Security Tips

1. ✅ `.env` file کو **کبھی git میں commit نہ کریں**
2. ✅ App password use کریں، main password نہیں
3. ✅ Production میں dedicated email service use کریں (SendGrid, AWS SES)

---

## Quick Checklist

- [ ] Gmail account mein 2-Step Verification enabled ہے
- [ ] App password generate کیا ہے
- [ ] `.env` file میں sab variables set ہیں
- [ ] Backend server restart کیا ہے
- [ ] Test email بھیج کر verify کیا ہے
