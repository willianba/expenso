import useModal from "@/islands/hooks/useModal.tsx";
import { PaymentType } from "@/utils/constants.ts";
import ExpenseForm from "@/islands/forms/ExpenseForm.tsx";

type ExpenseButtonProps = {
  paymentType: PaymentType;
};

export default function AddExpenseButton(props: ExpenseButtonProps) {
  const { paymentType } = props;
  const { openModal, closeModal, Modal, isOpen: isModalOpen } = useModal();

  return (
    <>
      <button type="button" class="btn btn-sm btn-primary" onClick={openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="fill-current w-3 h-3"
          viewBox="0 0 24 24"
        >
          <path
            fill-rule="evenodd"
            d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"
          >
          </path>
        </svg>
      </button>
      {isModalOpen && (
        <Modal>
          <ExpenseForm
            paymentType={paymentType}
            closeModal={closeModal}
          />
        </Modal>
      )}
    </>
  );
}
