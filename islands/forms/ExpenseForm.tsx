import { useEffect, useRef, useState } from "preact/hooks";
import { PaymentType } from "@/utils/constants.ts";
import InputSelector from "@/islands/InputSelector.tsx";
import { daysInMonth, formDate, stripDate } from "@/utils/date.ts";
import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { activeMonth, activeYear } from "@/signals/menu.ts";
import {
  categories,
  paymentMethods,
  updateAfterSubmit,
} from "@/signals/inputData.ts";
import useModal from "@/islands/hooks/useModal.tsx";
import { ConfirmationModal } from "@/components/Modal.tsx";

type ExpenseFormProps = {
  expense?: ExpenseWithoutUser;
  paymentType: PaymentType;
  closeModal: () => void;
};

export default function ExpenseForm(props: ExpenseFormProps) {
  const { expense, paymentType, closeModal } = props;
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const {
    modalId: confirmationModalId,
    openModal: openConfirmationModal,
    closeModal: closeConfirmationModal,
  } = useModal();

  useEffect(() => {
    if (expense && formRef.current) {
      (formRef.current.elements.namedItem("name") as HTMLInputElement).value =
        expense.name;
      (formRef.current.elements.namedItem("paymentDate") as HTMLInputElement)
        .value = new Date(expense.payment.date).toISOString().split("T")[0];

      if (expense.payment.type !== PaymentType.OVER_TIME) {
        (formRef.current.elements.namedItem("price") as HTMLInputElement)
          .value = `${expense.price}`;
      }
    }
  }, [expense]);

  const cleanAndClose = () => {
    formRef.current?.reset();
    closeModal();
  };

  const submitUpdate = async () => {
    setSaveDisabled(true);

    if (!expense) {
      // TODO show error message
      closeConfirmationModal();
      setSaveDisabled(false);
      return;
    }

    const formData = new FormData(formRef.current!);
    if (expense.payment.type === PaymentType.OVER_TIME) {
      formData.delete("installments");
      formData.delete("price");
    }

    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) {
      // TODO show error message
      closeConfirmationModal();
      setSaveDisabled(false);
      return;
    }

    const updatedExpense = await res.json() as ExpenseWithoutUser;
    const updatedExpenseDate = stripDate(new Date(updatedExpense.payment.date));

    if (
      updatedExpenseDate.month === activeMonth.value &&
      updatedExpenseDate.year === activeYear.value
    ) {
      expenses.value = expenses.value.map((exp) =>
        exp.id === updatedExpense.id ? updatedExpense : exp
      );
    }

    // TODO trigger toast
    updateAfterSubmit(
      updatedExpense.payment.category,
      updatedExpense.payment.method,
    );
    setSaveDisabled(false);
    closeConfirmationModal();
    cleanAndClose();
  };

  const onSubmitUpdate = (e: Event) => {
    e.preventDefault();

    if (expense && expense.payment.type !== PaymentType.CURRENT) {
      setModalMessage(
        "Are you sure you want to edit this expense? This will also modify expense entries from the next months.",
      );

      openConfirmationModal();
    } else {
      submitUpdate();
    }
  };

  const onSubmitCreate = async (e: Event) => {
    e.preventDefault();
    setSaveDisabled(true);
    const formData = new FormData(formRef.current!);

    const res = await fetch("/api/expenses", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // TODO show error message
      setSaveDisabled(false);
      return;
    }

    const addedExpense = await res.json() as ExpenseWithoutUser;
    const addedExpenseDate = stripDate(new Date(addedExpense.payment.date));

    if (
      addedExpenseDate.month === activeMonth.value &&
      addedExpenseDate.year === activeYear.value
    ) {
      expenses.value = [...expenses.value, addedExpense];
    }

    // TODO trigger toast
    updateAfterSubmit(
      addedExpense.payment.category,
      addedExpense.payment.method,
    );
    setSaveDisabled(false);
    cleanAndClose();
  };

  return (
    <>
      <form
        onSubmit={expense ? onSubmitUpdate : onSubmitCreate}
        ref={formRef}
      >
        <h3 class="font-bold text-lg">
          {expense ? "Edit Expense" : "Add Expense"}
        </h3>
        <div className="form-control">
          <label for="name" className="label">
            <span className="label-text">Name</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Expense name"
            className="input input-sm input-bordered"
            autoFocus={true}
            required
          />
        </div>
        <div className="form-control">
          <label for="paymentDate" className="label">
            <span className="label-text">Payment date</span>
          </label>
          <input
            id="paymentDate"
            name="paymentDate"
            type="date"
            placeholder="Payment date"
            className="input input-sm input-bordered"
            value={expense ? formDate(expense.payment.date) : formDate()}
            min={expense
              ? `${activeYear.value}-${
                activeMonth.value.toString().padStart(2, "0")
              }-01`
              : undefined}
            max={expense
              ? `${activeYear.value}-${
                activeMonth.value.toString().padStart(2, "0")
              }-${daysInMonth(activeMonth.value, activeYear.value)}`
              : undefined}
            required
          />
        </div>
        <div className="form-control">
          <label for="paymentMethod" className="label">
            <span className="label-text">Payment method</span>
          </label>
          <InputSelector
            id="paymentMethod"
            name="paymentMethod"
            placeholder="Credit"
            options={paymentMethods.value}
            value={expense ? expense.payment.method : undefined}
            required
          />
        </div>
        <div className="form-control">
          <label for="paymentCategory" className="label">
            <span className="label-text">Category</span>
          </label>
          <InputSelector
            id="paymentCategory"
            name="paymentCategory"
            placeholder="Subscription"
            options={categories.value}
            value={expense ? expense.payment.category : undefined}
            required
          />
        </div>
        {paymentType === PaymentType.OVER_TIME && !expense && (
          <div className="form-control">
            <label for="installments" className="label">
              <span className="label-text">Installments</span>
            </label>
            <input
              id="installments"
              name="installments"
              type="number"
              step="1"
              min={1}
              placeholder="How many installments?"
              className="input input-sm input-bordered"
              required
            />
          </div>
        )}
        {expense?.payment.type !== PaymentType.OVER_TIME && (
          <div className="form-control">
            <label for="price" className="label">
              <span className="label-text">Price</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="Expense price"
              className="input input-sm input-bordered"
              required
            />
          </div>
        )}
        {!expense && (
          <input type="hidden" name="paymentType" value={paymentType} />
        )}
        <div className="flex justify-end mt-6">
          <button
            className="btn btn-md btn-primary"
            type="submit"
            disabled={saveDisabled}
          >
            Save
          </button>
        </div>
      </form>
      <ConfirmationModal
        id={confirmationModalId}
        closeModal={closeConfirmationModal}
        title="Edit expense"
        message={modalMessage}
        onConfirm={submitUpdate}
      />
    </>
  );
}
