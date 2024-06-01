import { ComponentChildren } from "preact";

type CenteredProps = {
  children: ComponentChildren;
};

export default function Centered(props: CenteredProps) {
  const { children } = props;
  return (
    <div class="min-w-full min-h-full mx-auto flex items-center justify-center">
      {children}
    </div>
  );
}
