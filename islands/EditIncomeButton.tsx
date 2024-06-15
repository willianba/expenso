import useModal from "@/islands/hooks/useModal.tsx";
import { EditIncomeModal } from "@/components/Modal.tsx";

export default function EditIncomeButton() {
  const { modalId, openModal, closeModal } = useModal();

  return (
    <>
      <div class="stat-actions">
        <button class="btn btn-sm" onClick={openModal}>View & Edit</button>
      </div>
      <EditIncomeModal
        id={modalId}
        closeModal={closeModal}
      />
    </>
  );
}
