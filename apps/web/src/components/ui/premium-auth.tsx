'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,  
  Shield,
  AlertTriangle,
  KeyRound,
  Phone,
  Loader2,
} from 'lucide-react';
import { loginAction, registerAction } from "@/app/(auth)/actions";

// Types
type AuthMode = 'login' | 'signup' | 'reset';
type RegistrationStep = 'details' | 'verification' | 'complete';

interface AuthFormProps {
  /**
   * Callback triggered when authentication is successful
   */
  onSuccess?: (userData: { email: string; name?: string }) => void;
  /**
   * Callback triggered when the form should close
   */
  onClose?: () => void;
  /**
   * Initial authentication mode
   * @default 'login'
   */
  initialMode?: AuthMode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
  general?: string;
  verificationCode?: string;
}

// Password strength utility
interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('Minimal 8 karakter');
  if (!requirements.uppercase) feedback.push('1 huruf besar');
  if (!requirements.lowercase) feedback.push('1 huruf kecil');
  if (!requirements.number) feedback.push('1 angka');
  if (!requirements.special) feedback.push('1 karakter khusus');

  return { score, feedback, requirements };
};

// Password Strength Indicator Component
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'text-destructive';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-primary';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Sangat Lemah';
    if (score <= 2) return 'Lemah';
    if (score <= 3) return 'Cukup';
    if (score <= 4) return 'Bagus';
    return 'Kuat';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-bottom-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(strength.score)} bg-current rounded-full transition-all`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 min-w-[70px] font-medium">
          {getStrengthText(strength.score)}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {strength.feedback.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-[11px] text-amber-600 font-medium"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function AuthForm({
  onSuccess,
  onClose: _onClose,
  initialMode = 'login',
  className,
}: AuthFormProps) {
  // State
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  // Sync mode if initialMode prop changes
  React.useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  // Load saved email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && authMode === 'login') {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe }));
    }
  }, [authMode]);

  // Field validation
  const validateField = useCallback((field: keyof FormData, value: string | boolean) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (typeof value === 'string' && authMode === 'signup' && !value.trim()) {
          error = 'Nama lengkap wajib diisi';
        }
        break;
        
      case 'email':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'Alamat email wajib diisi';
        } else if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Format alamat email tidak valid';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password wajib diisi';
        } else if (typeof value === 'string') {
          if (value.length < 8) {
            error = 'Password minimal 8 karakter';
          } else if (authMode === 'signup') {
            const strength = calculatePasswordStrength(value);
            if (strength.score < 2) {
              error = 'Password terlalu lemah';
            }
          }
        }
        break;
        
      case 'confirmPassword':
        if (authMode === 'signup' && value !== formData.password) {
          error = 'Konfirmasi password tidak cocok';
        }
        break;
        
      case 'phone':
        if (typeof value === 'string' && value && !/^\+?[\d\s\-()]+$/.test(value)) {
          error = 'Nomor telepon tidak valid';
        }
        break;
        
      case 'agreeToTerms':
        if (authMode === 'signup' && !value) {
          error = 'Anda harus menyetujui Ketentuan Layanan';
        }
        break;
    }
    
    return error;
  }, [formData.password, authMode]);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (fieldTouched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [fieldTouched, validateField]);

  // Handle field blur
  const handleFieldBlur = useCallback((field: keyof FormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = ['email', 'password'];
    
    if (authMode === 'signup') {
      fieldsToValidate.push('name', 'confirmPassword', 'agreeToTerms');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) (newErrors as Record<string, string>)[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, formData, validateField]);

  // Real authentication submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      if (authMode === 'login') {
        if (formData.rememberMe) {
          localStorage.setItem('userEmail', formData.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('rememberMe');
        }
        
        const res = await loginAction({
          email: formData.email,
          password: formData.password,
        });

        if (res?.error) {
          setErrors({ general: res.error });
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Berhasil masuk! Mengalihkan ke dasbor...');
        onSuccess?.({ email: formData.email });
        window.location.href = '/dashboard';
        
      } else if (authMode === 'signup') {
        const res = await registerAction({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        if (res?.error) {
          setErrors({ general: res.error });
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Akun berhasil dibuat! Mengalihkan ke dasbor...');
        onSuccess?.({ email: formData.email, name: formData.name });
        window.location.href = '/dashboard';
        
      } else if (authMode === 'reset') {
        setSuccessMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
        setTimeout(() => setAuthMode('login'), 2500);
      }
      
    } catch (_error: unknown) {
      const err = _error as { message?: string; digest?: string };
      if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
        window.location.href = '/dashboard';
        return;
      }
      setErrors({ 
        general: 'Autentikasi gagal. Periksa kembali data Anda.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseCls = "w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/50 transition-all text-sm";

  // Render auth form content based on mode
  const renderAuthContent = () => {
    // Password reset form
    if (authMode === 'reset') {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1.5">Pemulihan Kata Sandi</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              Masukkan alamat email Anda untuk menerima tautan pemulihan kata sandi.
            </p>
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="Alamat Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                className={cn(
                  inputBaseCls,
                  "pl-10 pr-4",
                  errors.email ? "border-rose-400 bg-rose-50/50" : ""
                )}
                aria-label="Alamat Email"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.email}
            className={cn(
              "w-full bg-primary text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs",
              "hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:opacity-50 active:scale-[0.99]"
            )}
          >
            <span className="flex items-center justify-center gap-2 text-sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Kirim Tautan Reset
                </>
              )}
            </span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrors({});
              }}
              className="text-primary hover:underline text-xs sm:text-sm font-semibold transition-colors"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        </div>
      );
    }

    // Default Login & Sign Up Form
    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                className={cn(
                  inputBaseCls,
                  "pl-10 pr-4",
                  errors.name ? "border-rose-400 bg-rose-50/50" : ""
                )}
                aria-label="Nama Lengkap"
              />
            </div>
            {errors.name && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>
        )}

        <div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder="Alamat Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              className={cn(
                inputBaseCls,
                "pl-10 pr-4",
                errors.email ? "border-rose-400 bg-rose-50/50" : ""
              )}
              aria-label="Alamat Email"
            />
          </div>
          {errors.email && (
            <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kata Sandi"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              className={cn(
                inputBaseCls,
                "pl-10 pr-11",
                errors.password ? "border-rose-400 bg-rose-50/50" : ""
              )}
              aria-label="Kata Sandi"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {errors.password}
            </p>
          )}
          {authMode === 'signup' && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi Kata Sandi"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                className={cn(
                  inputBaseCls,
                  "pl-10 pr-11",
                  errors.confirmPassword ? "border-rose-400 bg-rose-50/50" : ""
                )}
                aria-label="Konfirmasi Kata Sandi"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showConfirmPassword ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Nomor Telepon (Opsional)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                className={cn(
                  inputBaseCls,
                  "pl-10 pr-4",
                  errors.phone ? "border-rose-400 bg-rose-50/50" : ""
                )}
                aria-label="Nomor Telepon"
              />
            </div>
            {errors.phone && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.phone}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {authMode === 'login' ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  aria-label="Ingat saya"
                  className="w-4 h-4 rounded border-slate-300 bg-white text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 font-medium">Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('reset');
                  setErrors({});
                }}
                className="text-xs sm:text-sm text-primary hover:underline font-semibold transition-colors"
              >
                Lupa kata sandi?
              </button>
            </>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 bg-white text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-600 leading-snug">
                Saya menyetujui{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Ketentuan Layanan
                </a>{' '}
                dan{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Kebijakan Privasi
                </a>
              </span>
            </label>
          )}
        </div>

        {errors.agreeToTerms && (
          <p className="text-rose-500 text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {errors.agreeToTerms}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full relative bg-primary text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs",
            "hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:opacity-50 active:scale-[0.99] mt-2"
          )}
        >
          <span className="flex items-center justify-center gap-2 text-sm font-bold">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              authMode === 'login' ? 'Masuk' : 'Buat Akun'
            )}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div 
      className={cn("p-6 sm:p-8 text-slate-900", className)}
      role="region"
      aria-labelledby="auth-title"
    >
      {/* Success Banner */}
      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 font-semibold animate-in fade-in-0 slide-in-from-top-3">
          <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Error Banner */}
      {errors.general && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-rose-700 font-medium animate-in fade-in-0 slide-in-from-top-3">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Header Title */}
      <div className="text-center mb-6">
        <h2 
          id="auth-title"
          className="text-2xl font-bold tracking-tight text-slate-900 mb-1"
        >
          {authMode === 'login' ? 'Welcome Back' : 
           authMode === 'reset' ? 'Reset Password' : 'Create Account'}
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm">
          {authMode === 'login' ? 'Sign in to your account' : 
           authMode === 'reset' ? 'Recover your account access' :
           'Create a new account to get started'}
        </p>
      </div>

      {/* Mode Toggle Tabs (Login / Sign Up) */}
      {authMode !== 'reset' && (
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setAuthMode('login');
              setErrors({});
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all",
              authMode === 'login'
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            )}
            type="button"
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setRegistrationStep('details');
              setErrors({});
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all",
              authMode === 'signup'
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            )}
            type="button"
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderAuthContent()}
      </form>

      {/* Toggle between login/signup at bottom */}
      {authMode !== 'reset' && registrationStep === 'details' && (
        <div className="text-center mt-6 pt-2 border-t border-slate-100">
          <p className="text-slate-500 text-xs sm:text-sm">
            {authMode === 'login' ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setErrors({});
              }}
              className="text-primary hover:underline font-bold transition-colors ml-1"
            >
              {authMode === 'login' ? 'Daftar sekarang' : 'Masuk sekarang'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
