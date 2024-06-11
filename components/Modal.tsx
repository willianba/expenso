import { ComponentChildren } from "preact";
import { PaymentType } from "@/utils/constants.ts";
import ExpenseForm from "@/islands/forms/ExpenseForm.tsx";
import IncomeForm from "@/islands/forms/IncomeForm.tsx";

type ModalProps = {
  id: string;
  closeModal: () => void;
  children: ComponentChildren;
};

function Modal(props: ModalProps) {
  const { id, closeModal, children } = props;

  return (
    <dialog id={id} class="modal modal-bottom sm:modal-middle">
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
}

type ExpenseModalProps = Omit<ModalProps, "children"> & {
  paymentType: PaymentType;
};

export function ExpenseModal(props: ExpenseModalProps) {
  const { id, closeModal, paymentType } = props;

  return (
    <Modal id={id} closeModal={closeModal}>
      <ExpenseForm paymentType={paymentType} closeModal={closeModal} />
    </Modal>
  );
}

type IncomeModalProps = Omit<ModalProps, "children">;

export function IncomeModal(props: IncomeModalProps) {
  const { id, closeModal } = props;

  return (
    <Modal id={id} closeModal={closeModal}>
      <IncomeForm closeModal={closeModal} />
    </Modal>
  );
}

type ConfirmationModalProps = Omit<ModalProps, "children"> & {
  onConfirm: () => void;
  title: string;
  message: string;
};

export function ConfirmationModal(props: ConfirmationModalProps) {
  const { id, closeModal, title, message, onConfirm } = props;

  return (
    <Modal id={id} closeModal={closeModal}>
      <h3 class="font-bold text-lg">{title}</h3>
      <p class="py-4">{message}</p>
      <div class="modal-action">
        <form method="dialog" class="flex gap-1">
          <button
            class="btn btn-secondary"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </form>
      </div>
    </Modal>
  );
}

