import { useEffect, useRef, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { PaymentType } from "@/utils/constants.ts";
import InputSelector from "@/islands/InputSelector.tsx";
import { daysInMonth, formDate, getUserTimezoneOffset } from "@/utils/date.ts";
import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { activeMonth, activeYear } from "@/signals/menu.ts";
import {
  categories,
  paymentMethods,
  updateAfterSubmit,
} from "@/signals/input-data.ts";
import useModal from "@/islands/hooks/useModal.tsx";
import { ConfirmationModalContent } from "@/components/ConfirmationModalContent.tsx";

type ExpenseFormProps = {
  expense?: ExpenseWithoutUser;
  paymentType: PaymentType;
  closeModal: () => void;
};

export default function ExpenseForm(props: ExpenseFormProps) {
  const { expense, paymentType, closeModal } = props;
  const formSubmitted = useSignal(false);
  const [modalMessage, setModalMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const {
    Modal: ConfirmationModal,
    isOpen: isConfirmationModalOpen,
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

  const submitUpdate = async (propagate?: boolean) => {
    formSubmitted.value = true;

    if (!expense) {
      // TODO show error message
      closeConfirmationModal();
      formSubmitted.value = false;
      return;
    }

    const formData = new FormData(formRef.current!);

    // Add timezone information
    const userTimezoneOffset = getUserTimezoneOffset();
    formData.append("timezoneOffset", userTimezoneOffset.toString());

    if (propagate !== undefined) {
      formData.append("propagate", propagate.toString());
    }

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
      formSubmitted.value = false;
      return;
    }

    const updatedExpense = await res.json() as ExpenseWithoutUser;
    expenses.value = expenses.value.map((exp) =>
      exp.id === updatedExpense.id ? updatedExpense : exp
    );

    // TODO trigger toast
    updateAfterSubmit(
      updatedExpense.payment.category,
      updatedExpense.payment.method,
    );
    formSubmitted.value = false;
    closeConfirmationModal();
    cleanAndClose();
  };

  const onSubmitUpdate = () => {
    const isFormValid = formRef.current?.reportValidity();

    if (!isFormValid) {
      return;
    }

    if (expense && expense.payment.type !== PaymentType.CURRENT) {
      setModalMessage(
        "Are you sure you want to edit this expense? This will also modify expense entries from the next months.",
      );

      openConfirmationModal();
    } else {
      submitUpdate();
    }
  };

  const submitAndCreateNew = () => {
    onSubmitCreate(true);
  };

  const submitAndClose = () => {
    onSubmitCreate(false);
  };

  const onSubmitCreate = async (keepOpen: boolean) => {
    const isFormValid = formRef.current?.reportValidity();

    if (!isFormValid) {
      return;
    }

    formSubmitted.value = true;
    const formData = new FormData(formRef.current!);

    // Add timezone information
    const userTimezoneOffset = getUserTimezoneOffset();
    formData.append("timezoneOffset", userTimezoneOffset.toString());

    const res = await fetch("/api/expenses", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // TODO show error message
      formSubmitted.value = false;
      return;
    }

    const addedExpense = await res.json() as ExpenseWithoutUser;
    expenses.value = [...expenses.value, addedExpense];

    // TODO trigger toast
    updateAfterSubmit(
      addedExpense.payment.category,
      addedExpense.payment.method,
    );

    formSubmitted.value = false;
    if (keepOpen) {
      formRef.current?.reset();
      const nameInput = formRef.current?.elements.namedItem(
        "name",
      ) as HTMLInputElement;
      nameInput.focus();
    } else {
      cleanAndClose();
    }
  };

  const preventDefault = (e: Event) => {
    e.preventDefault();
  };

  return (
    <>
      <form ref={formRef} onSubmit={preventDefault}>
        <h3 class="font-bold text-lg">
          {expense ? "Edit expense" : "Add expense"}
        </h3>
        <fieldset class="fieldset w-full">
          <label for="name" class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Expense name"
            class="input input-sm w-full"
            autoFocus
            required
          />
        </fieldset>
        <fieldset class="fieldset">
          <label for="paymentDate" class="label">
            <span class="label-text">Payment date</span>
          </label>
          <input
            id="paymentDate"
            name="paymentDate"
            type="date"
            placeholder="Payment date"
            class="input input-sm w-full"
            value={expense ? undefined : formDate()}
            defaultValue={expense ? formDate(expense.payment.date) : undefined}
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
        </fieldset>
        <fieldset class="fieldset">
          <label for="paymentMethod" class="label">
            <span class="label-text">Payment method</span>
          </label>
          <InputSelector
            id="paymentMethod"
            name="paymentMethod"
            placeholder="Credit"
            options={paymentMethods.value}
            value={expense ? expense.payment.method : undefined}
            formSubmitted={formSubmitted}
            required
          />
        </fieldset>
        <fieldset class="fieldset">
          <label for="paymentCategory" class="label">
            <span class="label-text">Category</span>
          </label>
          <InputSelector
            id="paymentCategory"
            name="paymentCategory"
            placeholder="Subscription"
            options={categories.value}
            value={expense ? expense.payment.category : undefined}
            formSubmitted={formSubmitted}
            required
          />
        </fieldset>
        {paymentType === PaymentType.OVER_TIME && !expense && (
          <fieldset class="fieldset">
            <label for="installments" class="label">
              <span class="label-text">Installments</span>
            </label>
            <input
              id="installments"
              name="installments"
              type="number"
              step="1"
              min={1}
              placeholder="How many installments?"
              class="input input-sm w-full"
              required
            />
          </fieldset>
        )}
        {expense?.payment.type !== PaymentType.OVER_TIME && (
          <fieldset class="fieldset">
            <label for="price" class="label">
              <span class="label-text">Price</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="Expense price"
              class="input input-sm w-full"
              required
            />
          </fieldset>
        )}
        {!expense && (
          <input type="hidden" name="paymentType" value={paymentType} />
        )}
        <div class="flex justify-end gap-2 mt-6">
          {!expense && (
            <button
              type="button"
              class="btn btn-md btn-accent"
              onClick={submitAndCreateNew}
              disabled={formSubmitted.value}
            >
              Save & New
            </button>
          )}
          <button
            type="button"
            class="btn btn-md btn-primary"
            onClick={expense ? onSubmitUpdate : submitAndClose}
            disabled={formSubmitted.value}
          >
            Save
          </button>
        </div>
      </form>
      {isConfirmationModalOpen && (
        <ConfirmationModal>
          <ConfirmationModalContent
            closeModal={closeConfirmationModal}
            title="Edit expense"
            message={modalMessage}
            onConfirm={submitUpdate}
            showPropagate
            buttonText="Edit"
          />
        </ConfirmationModal>
      )}
    </>
  );
}
