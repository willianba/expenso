import { HttpError, PageProps } from "fresh";
import { asset } from "fresh/runtime";

type ErrorPageProps = {
  title: string;
  description: string;
};

function ErrorPage(props: ErrorPageProps) {
  return (
    <div class="px-4 pb-8 pt-12 mx-auto bg-base-200">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src={asset("/logo.png")}
          width="200"
          height="200"
        />
        <h1 class="text-4xl font-bold">{props.title}</h1>
        <p class="my-4">{props.description}</p>
        <a href="/" class="underline">Go back home</a>
      </div>
    </div>
  );
}

export default function NotFoundError(props: PageProps) {
  const { error } = props;

  if (error instanceof HttpError) {
    if (error.status === 404) {
      return (
        <ErrorPage
          title="404 - Page not found"
          description="The page you were looking for doesn't exist."
        />
      );
    }
  }

  return (
    <ErrorPage
      title="500 - Oops, something went wrong"
      description="An unexpected error occurred. Please try again later."
    />
  );
}
