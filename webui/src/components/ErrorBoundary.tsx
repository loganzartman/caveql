import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (!isRouteErrorResponse(error)) {
    return <div>An unknown error occurred</div>;
  }

  if (error.status === 404) {
    return <div>Page not found</div>;
  }

  return <div>An error occurred</div>;
}
