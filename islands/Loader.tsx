import { useEffect } from "preact/hooks";
import { moneySig } from "@/signals/money.ts";
import { today } from "@/utils/date.ts";

export default function Loader() {
  useEffect(() => {
    const { year, month } = today();

    fetch(`/api/money/date?year=${year}&month=${month}`).then(async (res) => {
      const moneyFromThisMonth = await res.json();
      moneySig.value = moneyFromThisMonth;
    });
  }, []);
}
