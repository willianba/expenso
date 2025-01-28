import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { RawIncome } from "@/db/models/income.ts";
import { incomeList } from "@/signals/income.ts";
import { activeMonth, activeYear } from "@/signals/menu.ts";
import { months } from "@/utils/constants.ts";

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
        closeAllDetails();
      }
    };

    document.addEventListener("click", onClickOutside);
    showButton.value = allowedPathnames.includes(globalThis.location.pathname);

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

    closeAllDetails();
  };

  const closeAllDetails = () => {
    closeMonthSummary();
    closeYearSummary();
  };

  const closeMonthSummary = () => {
    if (monthRef.current) {
      monthRef.current.open = false;
    }
  };

  const closeYearSummary = () => {
    if (yearRef.current) {
      yearRef.current.open = false;
    }
  };

  return (
    showButton.value
      ? (
        <ul class="menu menu-horizontal bg-neutral rounded-box gap-1">
          <li>
            <details ref={monthRef}>
              <summary onClick={closeYearSummary}>
                {months[activeMonth.value]}
              </summary>
              <ul>
                {Object.entries(months).map(([key, value]) => {
                  const monthNumber = Number(key);

                  return (
                    <li>
                      <a
                        class={activeMonth.value === monthNumber
                          ? "active"
                          : ""}
                        onClick={() => fetchData(monthNumber, activeYear.value)}
                      >
                        {value}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
          <li>
            <details ref={yearRef}>
              <summary onClick={closeMonthSummary}>
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
