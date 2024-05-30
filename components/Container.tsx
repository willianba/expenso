import { ComponentChildren } from "preact";
import NavBar from "@/components/NavBar.tsx";
import { User } from "@/db/models/user.ts";

type ContainerProps = {
  sessionUser?: User;
  children: ComponentChildren;
};

export default function Container(props: ContainerProps) {
  const { children, sessionUser } = props;

  return (
    <div class="w-screen h-screen p-4 mx-auto bg-base-200">
      <NavBar sessionUser={sessionUser} />
      <div class="max-w-full max-h-full mx-auto flex items-center justify-center navbar-offset">
        {children}
      </div>
    </div>
  );
}
