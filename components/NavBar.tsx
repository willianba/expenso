import BackButton from "@/islands/BackButton.tsx";
import AuthButton from "@/islands/AuthButton.tsx";
import { User } from "@/db/models/user.ts";
import AppButton from "@/islands/AppButton.tsx";

type NavBarProps = {
  sessionUser?: User;
};

export default function NavBar(props: NavBarProps) {
  const { sessionUser } = props;

  return (
    <div class="navbar bg-base-100 fixed top-0 left-0 z-10 py-2 px-4">
      <div class="navbar-start">
        <BackButton />
      </div>
      <div class="navbar-center">
        <a class="text-xl font-semibold" href="/">Expenso</a>
      </div>
      <div class="navbar-end">
        <div class="flex space-x-2">
          <AuthButton sessionUser={sessionUser} />
          <AppButton sessionUser={sessionUser} />
        </div>
      </div>
    </div>
  );
}