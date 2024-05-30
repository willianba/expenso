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
    if (sessionUser && whitelistedPathnames.includes(location.pathname)) {
      setShowButton(true);
    }
  }, []);

  return (showButton
    ? (
      <a href="/app" class="btn btn-primary">
        Go to app
      </a>
    )
    : null);
}
