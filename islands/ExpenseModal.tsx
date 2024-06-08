import { useEffect, useRef, useState } from "preact/hooks";
import { PaymentType } from "@/utils/constants.ts";
import InputSelector from "@/islands/InputSelector.tsx";
import { formToday, stripDate, today } from "@/utils/date.ts";
import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";

type ModalProps = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  paymentType: PaymentType;
};

export default function ExpenseModal(props: ModalProps) {
  const { id, paymentType, isOpen, setIsOpen } = props;
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = document.getElementById(id);
    if (dialog) {
      const handleClose = () => {
        if (formRef.current) {
          formRef.current.reset();
        }
      };

      dialog.addEventListener("close", handleClose);

      return () => {
        dialog.removeEventListener("close", handleClose);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      };

      const fetchPaymentMethods = async () => {
        const res = await fetch("/api/paymentMethods");
        if (res.ok) {
          const data = await res.json();
          setPaymentMethods(data);
        }
      };

      Promise.all([fetchCategories(), fetchPaymentMethods()]);
    }
  }, [isOpen]);

  const closeDialog = () => {
    formRef.current?.reset();
    const dialog = document.getElementById(id) as HTMLDialogElement;
    dialog?.close();
    setIsOpen(false);
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      body: new FormData(formRef.current!),
    });

    if (!res.ok) {
      // TODO show error message
    }

    const addedExpense = await res.json() as ExpenseWithoutUser;
    const addedExpenseDate = stripDate(new Date(addedExpense.payment.date));
    const { month, year } = today();

    if (addedExpenseDate.month === month && addedExpenseDate.year === year) {
      expenses.value = [...expenses.value, addedExpense];
    }

    // TODO trigger toast
    closeDialog();
  };

  return (
    <dialog id={id} class="modal modal-bottom sm:modal-middle" open={isOpen}>
      <div class="modal-box">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            x
          </button>
        </form>
        <h3 class="font-bold text-lg">Add expense</h3>
        <form onSubmit={onSubmit} ref={formRef}>
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
              value={formToday()}
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
              options={paymentMethods}
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
              options={categories}
              required
            />
          </div>
          {paymentType === PaymentType.OVER_TIME &&
            (
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
          <input type="hidden" name="paymentType" value={paymentType} />
          <div className="form-control mt-6">
            <button className="btn btn-md btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
