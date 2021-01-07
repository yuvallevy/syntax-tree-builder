import React, { PropsWithChildren } from 'react';
import './Modal.scss';

interface ModalProps {
  visible: boolean;
  header?: string | null;
  footer?: string | null;
  width?: number | string;
  onDismiss?: () => void;
}

const Modal: React.FC<PropsWithChildren<ModalProps>> = ({
  visible, header, footer, children, width, onDismiss
}: PropsWithChildren<ModalProps>) => {
  if (!visible) return null;

  const handleDismiss = (e: React.MouseEvent | React.TouchEvent) => {
    if (onDismiss && e.target === e.currentTarget) {
      onDismiss();
    }
  }

  return <div
    className="Modal-container"
    onClick={handleDismiss}
  >
    <div className="Modal-root" style={{ width }}>
      {header && <div className="Modal-header">
        {header}
      </div>}
      <div className="Modal-content">
        {children}
      </div>
      {footer && <div className="Modal-footer">
        {footer}
      </div>}
    </div>
  </div>;
};

export default Modal;
