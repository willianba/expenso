import { type ComponentChild, type ComponentChildren } from "preact";

type CardProps = {
  title: ComponentChild | string;
  children: ComponentChildren;
  actionButton?: ComponentChild;
};

export default function Card(props: CardProps) {
  const { title, actionButton, children } = props;

  return (
    <div class="card card-sm w-full bg-base-100 shadow-xs h-full">
      <div class="card-body h-full overflow-hidden flex flex-col">
        <div class="flex justify-between">
          {typeof title === "string"
            ? <h2 class="card-title">{title}</h2>
            : title}
          {actionButton}
        </div>
        <span class="divider m-0 h-2" />
        <div class="overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}
