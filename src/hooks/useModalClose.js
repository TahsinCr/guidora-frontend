import { useEffect, useCallback } from 'react';

/**
 * Reusable modal dismissal hook.
 * Handles ESC keydown, optional body scroll-lock, and outside clicks cleanly.
 *
 * @param {boolean} isOpen Whether the modal is currently open
 * @param {() => void} onClose Callback to trigger when modal should close
 * @param {boolean} [lockScroll=true] Whether to prevent body background scrolling while open
 */
export function useModalClose(isOpen, onClose, lockScroll = true) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);

    let originalOverflow = '';
    if (lockScroll) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isOpen, handleKeyDown, lockScroll]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  return { handleBackdropClick };
}

