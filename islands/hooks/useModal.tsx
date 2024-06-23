import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

type ModalProps = {
  children: ComponentChildren;
};

export default function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);

    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen && ref.current) {
      ref.current.showModal();
    } else if (ref.current) {
      ref.current.close();
    }
  }, [isOpen]);

  const Modal = (props: ModalProps) => {
    const { children } = props;

    return (
      <dialog ref={ref} class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <form method="dialog">
            <button
              class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={closeModal}
            >
              ✕
            </button>
          </form>
          {children}
        </div>
      </dialog>
    );
  };

  return { openModal, closeModal, Modal, isOpen };
}
