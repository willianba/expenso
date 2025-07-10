import { PageProps } from "fresh";

export default function Centered({ Component }: PageProps) {
  return (
    <div class="min-w-full min-h-full mx-auto flex items-center justify-center">
      <Component />
    </div>
  );
}
