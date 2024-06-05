import { monotonicUlid } from "@std/ulid";
import { useState } from "preact/hooks";

export default function useModal() {
  const [modalId] = useState(monotonicUlid());
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    const dialog = document.getElementById(modalId) as HTMLDialogElement;
    dialog.showModal();
    setIsOpen(true);
  };

  return { modalId, openModal, isOpen, setIsOpen };
}
