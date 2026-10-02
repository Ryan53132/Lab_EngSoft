import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export default function Modal({ titulo, onFechar, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="modal-corpo">
        <h2>{titulo}</h2>
        {children}
      </div>
    </dialog>
  );
}