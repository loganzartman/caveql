import { forwardRef } from "react";
import {
  type LinkProps,
  type NavLinkProps,
  Link as RRLink,
  NavLink as RRNavLink,
  useSearchParams,
} from "react-router";

export * from "react-router";

function preserveQueryParam(
  to: LinkProps["to"],
  searchParams: URLSearchParams,
): LinkProps["to"] {
  const q = searchParams.get("q");
  if (!q) return to;

  if (typeof to === "string") {
    const url = new URL(to, window.location.origin);
    url.searchParams.set("q", q);
    return `${url.pathname}${url.search}`;
  }

  const search = new URLSearchParams(to.search);
  search.set("q", q);
  return { ...to, search: search.toString() };
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, ...props },
  ref,
) {
  const [searchParams] = useSearchParams();
  return (
    <RRLink ref={ref} to={preserveQueryParam(to, searchParams)} {...props} />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ to, ...props }, ref) {
    const [searchParams] = useSearchParams();
    return (
      <RRNavLink
        ref={ref}
        to={preserveQueryParam(to, searchParams)}
        {...props}
      />
    );
  },
);
