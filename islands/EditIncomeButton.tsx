import useModal from "@/islands/hooks/useModal.tsx";
import IncomeTable from "@/islands/tables/IncomeTable.tsx";

export default function EditIncomeButton() {
  const { Modal: EditIncomeModal, openModal, isOpen: isModalOpen } = useModal();

  return (
    <>
      <div class="stat-actions">
        <button class="btn btn-sm" onClick={openModal}>View & Edit</button>
      </div>
      {isModalOpen && (
        <EditIncomeModal>
          <div class="max-h-60">
            <IncomeTable />
          </div>
        </EditIncomeModal>
      )}
    </>
  );
}
