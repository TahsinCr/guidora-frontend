import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { login, register } from '@/services/authService';
import styles from './AuthModal.module.scss';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialMode = 'welcome' }) {
  // Modes: 'welcome' | 'login' | 'register'
  const [mode, setMode] = useState(initialMode);
  
  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  // Feedback states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Auto fill demo admin credentials
  const handleFillDemoAdmin = () => {
    setLoginInput('TahsinCr');
    setLoginPassword('TahsinCr');
    setError('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = login({
        usernameOrEmail: loginInput,
        password: loginPassword,
      });
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!agreeTerms) {
      setError('Lütfen Kullanım Şartları ve Gizlilik Politikasını kabul ediniz.');
      return;
    }

    setIsLoading(true);
    try {
      const user = register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      setIsLoading(false);
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Kayıt işlemi gerçekleştirilemedi.');
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.authContainer} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Left Side: Organic Blue-Purple Waves Graphic Art */}
        <div className={styles.artSide}>
          <svg
            className={styles.waveGraphic}
            viewBox="0 0 500 500"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4338ca" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path
              d="M0,0 C150,90 200,300 500,200 L500,500 L0,500 Z"
              fill="url(#waveGrad1)"
            />
            <path
              d="M0,100 C220,180 180,380 500,320 L500,500 L0,500 Z"
              fill="url(#waveGrad2)"
              opacity="0.8"
            />
            <path
              d="M0,250 C180,280 260,420 500,390 L500,500 L0,500 Z"
              fill="url(#waveGrad3)"
              opacity="0.75"
            />
          </svg>

          <div className={styles.artContent}>
            <div className={styles.artBadge}>
              <Sparkles size={14} />
              <span>Guidora Intelligence</span>
            </div>
            <h2 className={styles.artTitle}>Unleash AI Innovation</h2>
            <p className={styles.artSubtitle}>
              Curating high-precision models, developer workflows, and verified generative tooling.
            </p>
          </div>
        </div>

        {/* Right Side: Form Content based on Mode */}
        <div className={styles.formSide}>
          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* SCREEN 1: WELCOME / SOCIAL */}
          {mode === 'welcome' && (
            <div>
              <div className={styles.formHeader}>
                <div className={styles.brandLogoWrap}>
                  <div className={styles.brandLogoIcon}>
                    <img src="/logo.svg" alt="Guidora" />
                  </div>
                </div>
                <h1 className={styles.mainTitle}>Welcome to Guidora</h1>
                <p className={styles.subtitle}>Tools For Developers And Designers</p>
              </div>

              <div className={styles.socialStack}>
                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={() => {
                    handleFillDemoAdmin();
                    setMode('login');
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#fff" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  className={styles.githubBtn}
                  onClick={() => {
                    handleFillDemoAdmin();
                    setMode('login');
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Continue with Github</span>
                </button>

                <button
                  type="button"
                  className={styles.emailBtn}
                  onClick={() => setMode('login')}
                >
                  <Mail size={16} />
                  <span>Continue with email</span>
                </button>
              </div>

              <div className={styles.formFooter}>
                <span>Don't have an account yet?</span>
                <button type="button" onClick={() => setMode('register')}>
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: LOGIN */}
          {mode === 'login' && (
            <div>
              <div className={styles.formHeader}>
                <h1 className={styles.mainTitle}>Sign In to Guidora</h1>
                <p className={styles.subtitle}>Enter your credentials to access your account</p>
              </div>

              {/* Demo Quick Fill Box */}
              <div className={styles.demoQuickFill}>
                <span>Admin test: <strong>TahsinCr / TahsinCr</strong></span>
                <button type="button" onClick={handleFillDemoAdmin}>
                  Hızlı Doldur
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className={styles.inputGroup}>
                  <label>
                    <User size={14} />
                    <span>Username or Email</span>
                  </label>
                  <div className={styles.inputFieldWrap}>
                    <input
                      type="text"
                      placeholder="e.g. TahsinCr or tahsincrs@gmail.com"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    <Lock size={14} />
                    <span>Password</span>
                  </label>
                  <div className={styles.inputFieldWrap}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassBtn}
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitActionBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Giriş Yapılıyor...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  className={styles.cancelActionBtn}
                  onClick={() => setMode('welcome')}
                >
                  Back
                </button>
              </form>

              <div className={styles.formFooter}>
                <span>Need an account?</span>
                <button type="button" onClick={() => setMode('register')}>
                  Register now
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: REGISTER */}
          {mode === 'register' && (
            <div>
              <div className={styles.formHeader}>
                <h1 className={styles.mainTitle}>Create Your Account</h1>
                <p className={styles.subtitle}>Join us today and get started with your journey</p>
              </div>

              <form onSubmit={handleRegisterSubmit}>
                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label>
                      <User size={14} />
                      <span>Username</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type="text"
                        placeholder="Create a username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <Mail size={14} />
                      <span>Email Address</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label>
                      <Lock size={14} />
                      <span>Password</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={styles.togglePassBtn}
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <Lock size={14} />
                      <span>Confirm Password</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Rewrite password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <label className={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#terms">Terms and Conditions</a> and Privacy Policy
                  </span>
                </label>

                <label className={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                  />
                  <span>Subscribe to our newsletter for updates and special offers</span>
                </label>

                <button
                  type="submit"
                  className={styles.submitActionBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <button
                  type="button"
                  className={styles.cancelActionBtn}
                  onClick={() => setMode('welcome')}
                >
                  Cancel
                </button>
              </form>

              <div className={styles.formFooter}>
                <span>Already have an account?</span>
                <button type="button" onClick={() => setMode('login')}>
                  Sign in here
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
