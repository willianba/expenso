import { ComponentChildren } from "preact";

type CardProps = {
  children: ComponentChildren;
  title: string;
  classes?: string;
};

export default function Card(props: CardProps) {
  const { classes, children, title } = props;

  return (
    <div
      class={`card card-compact w-full bg-base-100 shadow-s ${classes}`}
    >
      <div class="card-body h-full">
        <div class="flex justify-between">
          <h2 class="card-title">{title}</h2>
          <button class="btn btn-sm btn-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current w-3 h-3"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="evenodd"
                d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"
              >
              </path>
            </svg>
          </button>
        </div>
        <span class="divider m-0 h-2"></span>
        {children}
      </div>
    </div>
  );
}
