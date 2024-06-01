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
      <div class="navbar-offset">
        {children}
      </div>
    </div>
  );
}
