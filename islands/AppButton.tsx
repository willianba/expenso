import { useEffect, useState } from "preact/hooks";
import { User } from "@/db/models/user.ts";

type AppButtonProps = {
  sessionUser?: User;
};

const whitelistedPathnames = ["/"];

export default function AppButton(props: AppButtonProps) {
  const { sessionUser } = props;
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (
      sessionUser && whitelistedPathnames.includes(globalThis.location.pathname)
    ) {
      setShowButton(true);
    }
  }, []);

  return (showButton
    ? (
      <button
        type="button"
        class="btn btn-primary"
        onClick={() => {
          location.href = "/app";
        }}
      >
        Go to app
      </button>
    )
    : null);
}
