import { useEffect } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { today } from "@/utils/date.ts";

// this is created for making the signals work on the client
// idk if there's a better way to do this or if this is an anti-pattern
export default function Loader() {
  useEffect(() => {
    const { year, month } = today();

    fetch(`/api/expenses/date?year=${year}&month=${month}`).then(
      async (res) => {
        const expensesFromThisMonth = await res.json();
        expenses.value = expensesFromThisMonth;
      },
    );
  }, []);

  return <></>;
}
