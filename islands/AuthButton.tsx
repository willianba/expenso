import { useEffect, useState } from "preact/hooks";
import { User } from "@/db/models/user.ts";

type AuthButtonProps = {
  sessionUser?: User;
};

type ButtonData = {
  title: string;
  href: string;
  class: string;
};

const blacklistedPathnames = ["/login", "/password"];

export default function AuthButton(props: AuthButtonProps) {
  const { sessionUser } = props;
  const [showButton, setShowButton] = useState(false);
  const [data, setData] = useState<ButtonData>({
    title: "",
    href: "",
    class: "",
  });

  useEffect(() => {
    setShowButton(!blacklistedPathnames.includes(globalThis.location.pathname));
  }, []);

  useEffect(() => {
    if (sessionUser) {
      setData({
        title: "Log out",
        href: "/api/auth/logout?success_url=/",
        class: "btn-ghost",
      });
    } else {
      setData({
        title: "Log in",
        href: "/login",
        class: "btn-primary",
      });
    }
  }, [sessionUser]);

  return (
    showButton
      ? (
        <a href={data.href} class={`btn btn-md ${data.class}`}>
          {data.title}
        </a>
      )
      : null
  );
}
