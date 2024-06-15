import { useRef, useState } from "preact/hooks";
import { incomeList } from "@/signals/income.ts";
import { RawIncome } from "@/db/models/income.ts";
import { daysInMonth, formDate, stripDate } from "@/utils/date.ts";
import { activeMonth, activeYear } from "@/signals/menu.ts";

type IncomeFormProps = {
  income?: RawIncome;
  closeModal: () => void;
};

export default function IncomeForm(props: IncomeFormProps) {
  const { income, closeModal } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const [saveDisabled, setSaveDisabled] = useState(false);

  const cleanAndClose = () => {
    formRef.current?.reset();
    closeModal();
  };

  const onSubmitUpdate = async (e: Event) => {
    e.preventDefault();
    setSaveDisabled(true);

    if (!income) {
      // TODO show error message
      setSaveDisabled(false);
      return;
    }

    const formData = new FormData(formRef.current!);
    const res = await fetch(`/api/income/${income.id}`, {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) {
      // TODO show error message
      setSaveDisabled(false);
      return;
    }

    const updatedIncome = await res.json() as RawIncome;
    const updatedIncomeDate = stripDate(new Date(updatedIncome.date));

    if (
      updatedIncomeDate.month === activeMonth.value &&
      updatedIncomeDate.year === activeYear.value
    ) {
      incomeList.value = incomeList.value.map((exp) =>
        exp.id === updatedIncome.id ? updatedIncome : exp
      );
    }

    // TODO trigger toast
    setSaveDisabled(false);
    cleanAndClose();
  };

  const onSubmitCreate = async (e: Event) => {
    e.preventDefault();
    setSaveDisabled(true);

    const formData = new FormData(formRef.current!);
    const res = await fetch("/api/income", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // TODO show error message
      setSaveDisabled(false);
      return;
    }

    const addedIncome = await res.json() as RawIncome;
    const addedIncomeDate = stripDate(new Date(addedIncome.date));

    if (
      addedIncomeDate.month === activeMonth.value &&
      addedIncomeDate.year === activeYear.value
    ) {
      incomeList.value = [...incomeList.value, addedIncome];
    }

    // TODO trigger toast
    setSaveDisabled(false);
    cleanAndClose();
  };

  return (
    <>
      <form
        onSubmit={income ? onSubmitUpdate : onSubmitCreate}
        ref={formRef}
      >
        <h3 class="font-bold text-lg">
          {income ? "Edit income" : "Add income"}
        </h3>
        <div className="form-control">
          <label for="source" className="label">
            <span className="label-text">Source</span>
          </label>
          <input
            id="source"
            type="text"
            name="source"
            placeholder="1/2 salary"
            className="input input-sm input-bordered"
            autoFocus={true}
            value={income ? income.source : ""}
            required
          />
        </div>
        <div className="form-control">
          <label for="date" className="label">
            <span className="label-text">Date</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            placeholder="Date"
            className="input input-sm input-bordered"
            value={income ? formDate(income.date) : formDate()}
            min={income
              ? `${activeYear.value}-${
                activeMonth.value.toString().padStart(2, "0")
              }-01`
              : undefined}
            max={income
              ? `${activeYear.value}-${
                activeMonth.value.toString().padStart(2, "0")
              }-${daysInMonth(activeMonth.value, activeYear.value)}`
              : undefined}
            required
          />
        </div>
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
            value={income ? income.price : ""}
            required
          />
        </div>
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
    </>
  );
}
