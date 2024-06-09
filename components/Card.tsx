import { type ComponentChild, type ComponentChildren } from "preact";

type CardProps = {
  title: ComponentChild | string;
  children: ComponentChildren;
  actionButton?: ComponentChild;
  classes?: string;
};

export default function Card(props: CardProps) {
  const { classes, title, actionButton, children } = props;

  return (
    <div
      class={`card card-compact w-full bg-base-100 shadow-s ${classes}`}
    >
      <div class="card-body h-full">
        <div class="flex justify-between">
          {typeof title === "string"
            ? <h2 class="card-title">{title}</h2>
            : title}
          {actionButton}
        </div>
        <span class="divider m-0 h-2" />
        {children}
      </div>
    </div>
  );
}
