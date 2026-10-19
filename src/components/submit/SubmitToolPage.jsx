import React, { useState } from 'react';
import { LogIn, Info } from 'lucide-react';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import { addTool } from '@/services/toolsService';
import { useLanguage } from '@/context/LanguageContext';

export default function SubmitToolPage({
  currentUser,
  onOpenAuth,
  onBack,
  onToolCreated,
}) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSave = async (toolPayload) => {
    if (!currentUser) {
      setAuthError(
        t(
          'submit.authRequiredError',
          'Araç eklemek için öncelikle hesabınıza giriş yapmalısınız.'
        )
      );
      if (onOpenAuth) {
        onOpenAuth('login');
      }
      return;
    }

    setAuthError('');
    setIsSubmitting(true);
    try {
      const newTool = await addTool(toolPayload);
      if (onToolCreated) {
        onToolCreated(newTool);
      }
    } catch (err) {
      if (err.status === 401 || err.statusCode === 401) {
        setAuthError(
          t(
            'submit.sessionExpired',
            'Oturum süreniz doldu. Lütfen tekrar giriş yapın.'
          )
        );
        if (onOpenAuth) {
          onOpenAuth('login');
        }
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {!currentUser && (
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto 16px auto',
            padding: '14px 20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="var(--accent-purple, #6366f1)" />
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              {authError ||
                t(
                  'submit.authNotice',
                  'Kataloğa yeni araç eklemek ve doğrulanmış yayıncı olmak için lütfen oturum açın.'
                )}
            </span>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <LogIn size={15} />
              <span>{t('auth.login', 'Giriş Yap')}</span>
            </button>
          )}
        </div>
      )}

      <ToolStudioForm
        mode="create"
        isModal={false}
        onSave={handleSave}
        onCancel={onBack}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

