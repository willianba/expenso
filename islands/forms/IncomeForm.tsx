import { useRef } from "preact/hooks";
import { income } from "@/signals/income.ts";
import { RawIncome } from "@/db/models/income.ts";
import { formToday, stripDate, today } from "@/utils/date.ts";

type IncomeFormProps = {
  closeModal: () => void;
};

export default function IncomeForm(props: IncomeFormProps) {
  const { closeModal } = props;
  const formRef = useRef<HTMLFormElement>(null);

  const cleanAndClose = () => {
    formRef.current?.reset();
    closeModal();
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const res = await fetch("/api/income", {
      method: "POST",
      body: new FormData(formRef.current!),
    });

    if (!res.ok) {
      // TODO show error message
    }

    const addedIncome = await res.json() as RawIncome;
    const addedIncomeDate = stripDate(new Date(addedIncome.date));
    const { month, year } = today();

    if (addedIncomeDate.month === month && addedIncomeDate.year === year) {
      income.value = [...income.value, addedIncome];
    }

    // TODO trigger toast
    cleanAndClose();
  };

  return (
    <form onSubmit={onSubmit} ref={formRef}>
      <h3 class="font-bold text-lg">Add income</h3>
      <div className="form-control">
        <label for="source" className="label">
          <span className="label-text">Source</span>
        </label>
        <input
          id="source"
          type="text"
          name="source"
          placeholder="Source"
          className="input input-sm input-bordered"
          autoFocus={true}
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
          placeholder="Payment date"
          className="input input-sm input-bordered"
          value={formToday()}
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
          placeholder="Income price"
          className="input input-sm input-bordered"
          required
        />
      </div>
      <div className="form-control mt-6">
        <button className="btn btn-md btn-primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}
