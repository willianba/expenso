import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { RawIncome } from "@/db/models/income.ts";
import { incomeList } from "@/signals/income.ts";
import { activeMonth, activeYear } from "@/signals/menu.ts";

const months = [
  { name: "January", number: 1 },
  { name: "February", number: 2 },
  { name: "March", number: 3 },
  { name: "April", number: 4 },
  { name: "May", number: 5 },
  { name: "June", number: 6 },
  { name: "July", number: 7 },
  { name: "August", number: 8 },
  { name: "September", number: 9 },
  { name: "October", number: 10 },
  { name: "November", number: 11 },
  { name: "December", number: 12 },
];

// TODO make this dynamic
const years = [
  2024,
  2025,
  2026,
];

const allowedPathnames = ["/app"];

export default function Menu() {
  const showButton = useSignal(false);
  const monthRef = useRef<HTMLDetailsElement>(null);
  const yearRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        monthRef.current && !monthRef.current.contains(e.target as Node) &&
        yearRef.current && !yearRef.current.contains(e.target as Node)
      ) {
        closeOpenSummary();
      }
    };

    document.addEventListener("click", onClickOutside);
    showButton.value = allowedPathnames.includes(location.pathname);

    return () => {
      document.removeEventListener("click", onClickOutside);
    };
  }, []);

  const fetchData = async (month: number, year: number) => {
    if (month === activeMonth.value && year === activeYear.value) {
      return;
    }

    const [expenseRes, incomeRes] = await Promise.all([
      fetch(`/api/expenses/date?year=${year}&month=${month}`).then((res) =>
        res.json() as Promise<ExpenseWithoutUser[]>
      ),
      fetch(`/api/income/date?year=${year}&month=${month}`).then((res) =>
        res.json() as Promise<RawIncome[]>
      ),
    ]);

    expenses.value = expenseRes;
    incomeList.value = incomeRes;
    activeMonth.value = month;
    activeYear.value = year;

    closeOpenSummary();
  };

  const closeOpenSummary = () => {
    if (yearRef.current && monthRef.current) {
      yearRef.current.open = false;
      monthRef.current.open = false;
    }
  };

  return (
    showButton.value
      ? (
        <ul class="menu menu-horizontal bg-neutral rounded-box gap-1">
          <li>
            <details ref={monthRef}>
              <summary>
                {months.find((m) => m.number === activeMonth.value)!.name}
              </summary>
              <ul>
                {months.map((month) => (
                  <li>
                    <a
                      class={activeMonth.value === month.number ? "active" : ""}
                      onClick={() => fetchData(month.number, activeYear.value)}
                    >
                      {month.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
          <li>
            <details ref={yearRef}>
              <summary>
                {years.find((y) => y === activeYear.value)}
              </summary>
              <ul>
                {years.map((year) => (
                  <li>
                    <a
                      class={activeYear.value === year ? "active" : ""}
                      onClick={() => fetchData(activeMonth.value, year)}
                    >
                      {year}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        </ul>
      )
      : null
  );
}
