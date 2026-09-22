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
import { useLanguage } from '@/context/LanguageContext';
import { getDemoDelayDuration } from '@/utils/demoDelay';
import PageLoader from '@/components/common/PageLoader';
import styles from './AuthModal.module.scss';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialMode = 'welcome' }) {
  const { t } = useLanguage();
  // Modes: 'welcome' | 'login' | 'register'
  const [mode, setMode] = useState(initialMode);
  
  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (Step 1: Credentials, Step 2: Profile)
  const [registerStep, setRegisterStep] = useState(1);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  // Step 2 profile fields
  const [regFullName, setRegFullName] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatar, setRegAvatar] = useState('');
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

    setTimeout(() => {
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
        setError(err.message || t('auth.loginFailed', 'Login failed. Please check your credentials.'));
      }
    }, getDemoDelayDuration(450));
  };

  const handleProceedToProfile = (e) => {
    e.preventDefault();
    setError('');

    if (!regUsername.trim()) {
      setError(t('auth.usernameRequired', 'Please enter a username.'));
      return;
    }
    if (!regEmail.trim()) {
      setError(t('auth.emailRequired', 'Please enter a valid email address.'));
      return;
    }
    if (!regPassword) {
      setError(t('auth.passwordRequired', 'Please enter a password.'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError(t('auth.passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }
    if (regPassword.length < 4) {
      setError(t('auth.passwordTooShort', 'Password must be at least 4 characters long.'));
      return;
    }

    if (!regFullName.trim()) {
      setRegFullName(regUsername.trim());
    }
    setRegisterStep(2);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError(t('auth.mustAgreeTerms', 'Please accept the Terms and Conditions and Privacy Policy.'));
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const user = register({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          name: regFullName.trim() || regUsername.trim(),
          title: regTitle.trim(),
          bio: regBio.trim(),
          avatar: regAvatar.trim(),
        });
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      } catch (err) {
        setIsLoading(false);
        setError(err.message || t('auth.registerFailed', 'Registration could not be completed.'));
      }
    }, getDemoDelayDuration(450));
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

        {/* Modal-scoped loader covering the entire dialog frame */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <PageLoader
              variant="popup"
              text={
                mode === 'register'
                  ? t('auth.creatingAccount', 'Hesap oluşturuluyor...')
                  : t('auth.signingIn', 'Giriş yapılıyor...')
              }
              subtext={t('auth.verifyingCredentials', 'Kimlik bilgileri doğrulanıyor')}
            />
          </div>
        )}

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
              <span>{t('auth.artBadge', 'Guidora Intelligence')}</span>
            </div>
            <h2 className={styles.artTitle}>{t('auth.artTitle', 'Unleash AI Innovation')}</h2>
            <p className={styles.artSubtitle}>
              {t('auth.artSubtitle', 'Curating high-precision models, developer workflows, and verified generative tooling.')}
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
                    <img src="/logo.svg" alt="Guidora Logo" />
                  </div>
                </div>
                <h1 className={styles.mainTitle}>{t('auth.welcomeTitle', 'Welcome to Guidora')}</h1>
                <p className={styles.subtitle}>{t('auth.welcomeSubtitle', 'Tools For Developers And Designers')}</p>
              </div>

              <div className={styles.socialStack}>
                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={() => {
                    setError('Google OAuth sandbox modunda. Lütfen aşağıdaki Kayıt Ol veya Giriş Yap seçeneğini kullanın.');
                  }}
                  title="Continue with Google"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t('auth.continueGoogle', 'Continue with Google')}</span>
                </button>

                <button
                  type="button"
                  className={styles.githubBtn}
                  onClick={() => {
                    setError('GitHub OAuth sandbox modunda. Lütfen aşağıdaki Kayıt Ol veya Giriş Yap seçeneğini kullanın.');
                  }}
                  title="Continue with Github"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>{t('auth.continueGithub', 'Continue with Github')}</span>
                </button>

                <div className={styles.authDivider}>
                  <span>{t('auth.orDivider', 'or')}</span>
                </div>

                <button
                  type="button"
                  className={styles.registerActionBtn}
                  onClick={() => {
                    setError('');
                    setRegisterStep(1);
                    setMode('register');
                  }}
                  title={t('auth.createAccount', 'Kayıt Ol')}
                >
                  <Sparkles size={16} />
                  <span>{t('auth.signUpBtn', 'Kayıt Ol (Create Account)')}</span>
                </button>

                <button
                  type="button"
                  className={styles.loginActionBtn}
                  onClick={() => {
                    setError('');
                    setMode('login');
                  }}
                  title={t('auth.signIn', 'Giriş Yap')}
                >
                  <User size={16} />
                  <span>{t('auth.signInBtn', 'Giriş Yap (Sign In)')}</span>
                </button>
              </div>

              <div className={styles.formFooter}>
                <span>{t('auth.adminQuickHint', 'Demo / Admin test hesabı:')}</span>
                <button type="button" onClick={() => { handleFillDemoAdmin(); setMode('login'); }}>
                  TahsinCr
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: LOGIN */}
          {mode === 'login' && (
            <div>
              <div className={styles.formHeader}>
                <div className={styles.brandLogoWrap}>
                  <div className={styles.brandLogoIcon}>
                    <img src="/logo.svg" alt="Guidora Logo" />
                  </div>
                </div>
                <h1 className={styles.mainTitle}>{t('auth.signInTitle', 'Sign In to Guidora')}</h1>
                <p className={styles.subtitle}>{t('auth.signInSubtitle', 'Enter your credentials to access your account')}</p>
              </div>

              {/* Demo Quick Fill Box */}
              <div className={styles.demoQuickFill}>
                <span>{t('auth.adminTest', 'Admin test:')} <strong>TahsinCr / TahsinCr</strong></span>
                <button type="button" onClick={handleFillDemoAdmin}>
                  {t('auth.quickFill', 'Quick Fill')}
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className={styles.inputGroup}>
                  <label>
                    <User size={14} />
                    <span>{t('auth.usernameOrEmail', 'Username or Email')}</span>
                  </label>
                  <div className={styles.inputFieldWrap}>
                    <input
                      type="text"
                      placeholder={t('auth.usernamePlaceholder', 'e.g. TahsinCr or tahsincrs@gmail.com')}
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    <Lock size={14} />
                    <span>{t('auth.password', 'Password')}</span>
                  </label>
                  <div className={styles.inputFieldWrap}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
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
                  {isLoading ? t('auth.signingIn', 'Signing In...') : t('auth.signIn', 'Sign In')}
                </button>

                <button
                  type="button"
                  className={styles.cancelActionBtn}
                  onClick={() => setMode('welcome')}
                >
                  {t('auth.back', 'Back')}
                </button>
              </form>

              <div className={styles.formFooter}>
                <span>{t('auth.needAccount', 'Need an account?')}</span>
                <button type="button" onClick={() => { setRegisterStep(1); setMode('register'); }}>
                  {t('auth.registerNow', 'Register now')}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: 2-STEP REGISTRATION */}
          {mode === 'register' && (
            <div>
              <div className={styles.formHeader}>
                <div className={styles.brandLogoWrap}>
                  <div className={styles.brandLogoIcon}>
                    <img src="/logo.svg" alt="Guidora Logo" />
                  </div>
                </div>
                <h1 className={styles.mainTitle}>{t('auth.createAccountTitle', 'Create Your Account')}</h1>
                <p className={styles.subtitle}>
                  {registerStep === 1
                    ? t('auth.step1Subtitle', 'Step 1 of 2: Set up your account credentials')
                    : t('auth.step2Subtitle', 'Step 2 of 2: Complete your platform profile')}
                </p>
              </div>

              {/* Step Progress Dots */}
              <div className={styles.stepIndicator}>
                <div className={`${styles.stepDot} ${registerStep >= 1 ? styles.stepActive : ''}`}>
                  <span className={styles.dotNumber}>1</span>
                  <span>{t('auth.stepCredentials', 'Credentials')}</span>
                </div>
                <div className={`${styles.stepLine} ${registerStep === 2 ? styles.stepLineActive : ''}`} />
                <div className={`${styles.stepDot} ${registerStep === 2 ? styles.stepActive : ''}`}>
                  <span className={styles.dotNumber}>2</span>
                  <span>{t('auth.stepProfile', 'Profile Details')}</span>
                </div>
              </div>

              {registerStep === 1 ? (
                <form onSubmit={handleProceedToProfile}>
                  <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                      <label>
                        <User size={14} />
                        <span>{t('auth.username', 'Username*')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type="text"
                          placeholder="e.g. alexrivera"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>
                        <Mail size={14} />
                        <span>{t('auth.emailAddress', 'Email Address*')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type="email"
                          placeholder="you@example.com"
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
                        <span>{t('auth.password', 'Password*')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="••••••••"
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
                        <span>{t('auth.confirmPassword', 'Confirm Password*')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitActionBtn}
                  >
                    <span>{t('auth.nextProfileStep', 'Next: Profile Information')} &rarr;</span>
                  </button>

                  <button
                    type="button"
                    className={styles.cancelActionBtn}
                    onClick={() => setMode('welcome')}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                      <label>
                        <User size={14} />
                        <span>{t('user.fullName', 'Full Name')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type="text"
                          placeholder="e.g. Alex Rivera"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>
                        <Sparkles size={14} />
                        <span>{t('user.jobTitle', 'Professional Title')}</span>
                      </label>
                      <div className={styles.inputFieldWrap}>
                        <input
                          type="text"
                          placeholder="e.g. AI Systems Architect"
                          value={regTitle}
                          onChange={(e) => setRegTitle(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <User size={14} />
                      <span>{t('admin.avatarOrInitials', 'Avatar (Initials or Image URL)')}</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type="text"
                        placeholder="e.g. AR or https://images.unsplash.com/..."
                        value={regAvatar}
                        onChange={(e) => setRegAvatar(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>
                      <span>{t('user.bio', 'Bio / Short Introduction')}</span>
                    </label>
                    <div className={styles.inputFieldWrap}>
                      <input
                        type="text"
                        placeholder="Passionate about LLM agents, open-source AI models..."
                        value={regBio}
                        onChange={(e) => setRegBio(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className={styles.checkboxWrap}>
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span>
                      {t('auth.agreeTerms', 'I agree to the Terms and Conditions and Privacy Policy')}
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className={styles.cancelActionBtn}
                      style={{ flex: '0 0 100px' }}
                      onClick={() => setRegisterStep(1)}
                    >
                      &larr; {t('auth.back', 'Back')}
                    </button>
                    <button
                      type="submit"
                      className={styles.submitActionBtn}
                      style={{ flex: 1 }}
                      disabled={isLoading}
                    >
                      {isLoading ? t('auth.creatingAccount', 'Creating Account...') : t('auth.completeSignUp', 'Complete Registration')}
                    </button>
                  </div>
                </form>
              )}

              <div className={styles.formFooter}>
                <span>{t('auth.alreadyHaveAccount', 'Already have an account?')}</span>
                <button type="button" onClick={() => setMode('login')}>
                  {t('auth.signInHere', 'Sign in here')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

