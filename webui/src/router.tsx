import { forwardRef } from "react";
import {
  type LinkProps,
  type NavigateProps,
  type NavLinkProps,
  Link as RRLink,
  Navigate as RRNavigate,
  NavLink as RRNavLink,
  type To,
  useLocation,
} from "react-router";

export * from "react-router";

function preserveQueryParam(to: To, searchParams: URLSearchParams): To {
  const q = searchParams.get("q");
  if (!q) return to;

  let toObj = to;
  if (typeof toObj === "string") {
    const [pathname, search] = toObj.split("?", 2);
    toObj = { pathname, search };
  }

  const search = new URLSearchParams(toObj.search);
  search.set("q", q);
  return { ...toObj, search: search.toString() };
}

/** @deprecated Use useLocation() and navigate() instead. */
export function useSearchParams() {
  throw new Error(
    [
      "Use useLocation() and navigate() instead.",
      "useSearchParams() returns an unstable setter function, which is a footgun.",
    ].join("\n"),
  );
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, ...props },
  ref,
) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <RRLink ref={ref} to={preserveQueryParam(to, searchParams)} {...props} />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ to, ...props }, ref) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    return (
      <RRNavLink
        ref={ref}
        to={preserveQueryParam(to, searchParams)}
        {...props}
      />
    );
  },
);

export const Navigate = (props: NavigateProps) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <RRNavigate {...props} to={preserveQueryParam(props.to, searchParams)} />
  );
};
