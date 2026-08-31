import { useEffect, useRef } from 'react';

/**
 * Custom hook providing accessible modal behavior:
 * - Focus containment (focus trap)
 * - Initial focus on open
 * - Focus restoration upon close
 * - Keyboard Escape dismissal
 *
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {() => void} onClose - Callback invoked when modal is dismissed
 * @returns {import('react').RefObject<HTMLDivElement>} Reference to attach to modal container
 */
export const useModalA11y = (isOpen, onClose) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Capture element with focus prior to modal opening
    previousActiveElementRef.current = document.activeElement;

    const focusModal = () => {
      const modalElement = modalRef.current;
      if (!modalElement) return;

      const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusables = modalElement.querySelectorAll(focusableSelectors);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!modalElement.hasAttribute('tabindex')) {
          modalElement.setAttribute('tabindex', '-1');
        }
        modalElement.focus();
      }
    };

    // Defer initial focus check by requestAnimationFrame to allow child modal containers to mount
    const frameId = requestAnimationFrame(focusModal);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(modalRef.current.querySelectorAll(focusableSelectors));

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  return modalRef;
};
