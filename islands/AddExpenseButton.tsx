import ExpenseModal from "@/islands/ExpenseModal.tsx";
import useModal from "@/islands/hooks/useModal.tsx";
import { MoneyType, PaymentType } from "@/utils/constants.ts";

type ExpenseButtonProps = {
  moneyType: MoneyType;
  paymentType?: PaymentType;
};

export default function AddExpenseButton(props: ExpenseButtonProps) {
  const { moneyType, paymentType } = props;
  const { modalId, openModal, isOpen, setIsOpen } = useModal();

  return (
    <>
      <button class="btn btn-sm btn-primary" onClick={openModal}>
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
      {paymentType && (
        <ExpenseModal
          id={modalId}
          moneyType={moneyType}
          paymentType={paymentType}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      )}
    </>
  );
}