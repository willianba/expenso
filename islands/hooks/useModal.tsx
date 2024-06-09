import { monotonicUlid } from "@std/ulid";
import { useState } from "preact/hooks";

export default function useModal() {
  const [modalId] = useState(monotonicUlid());

  const openModal = () => {
    const dialog = document.getElementById(modalId) as HTMLDialogElement;
    dialog.showModal();
  };

  const closeModal = () => {
    const dialog = document.getElementById(modalId) as HTMLDialogElement;
    dialog.close();
  };

  return { modalId, openModal, closeModal };
}
