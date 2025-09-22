import { HttpError, PageProps } from "fresh";
import { asset } from "fresh/runtime";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";

type ErrorPageProps = {
  title: string;
  description: string;
};

function getStatusCode(error: Error) {
  if (error instanceof Deno.errors.NotFound) {
    return STATUS_CODE.NotFound;
  }
  if (error instanceof Deno.errors.AlreadyExists) {
    return STATUS_CODE.Conflict;
  }
  if (error instanceof Deno.errors.PermissionDenied) {
    return STATUS_CODE.Unauthorized;
  }
  if (error instanceof Deno.errors.InvalidData || error instanceof ZodError) {
    return STATUS_CODE.BadRequest;
  }
  return STATUS_CODE.InternalServerError;
}

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

  if (error instanceof ZodError) {
    const status = getStatusCode(error);
    const validationError = fromError(error);

    return (
      <ErrorPage
        title={`${status} - ${STATUS_TEXT[status]}`}
        description={validationError.message}
      />
    );
  }

  return (
    <ErrorPage
      title="500 - Oops, something went wrong"
      description="An unexpected error occurred. Please try again later."
    />
  );
}
