import { expenses } from "@/signals/expenses.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { useEffect, useState } from "preact/hooks";
import { today } from "@/utils/date.ts";

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

const blacklistedPathnames = ["/", "/login", "/password"];

export default function Menu() {
  const [activeMonth, setActiveMonth] = useState(today().month);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setShowButton(!blacklistedPathnames.includes(location.pathname));
  }, []);

  const fetchExpenses = (month: number) => {
    fetch(`/api/expenses/date?year=2024&month=${month}`).then(async (res) => {
      const result = await res.json() as ExpenseWithoutUser[];
      expenses.value = result;
    });
    setActiveMonth(month);
  };

  return (
    showButton
      ? (
        <ul class="menu menu-horizontal bg-base-100 rounded-box">
          <li>
            <details>
              <summary>
                {months.find((m) => m.number === activeMonth)!.name}
              </summary>
              <ul>
                {months.map((month) => (
                  <li>
                    <a
                      class={activeMonth === month.number ? "active" : ""}
                      onClick={() => fetchExpenses(month.number)}
                    >
                      {month.name}
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
