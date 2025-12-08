import { CodeBracketIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { NavLink, Outlet } from "../../router";

function InspectTabLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-row items-center gap-2 transition-colors shadow-inner px-4 py-1.5",
          isActive
            ? "bg-stone-700 z-10"
            : "bg-stone-800 hover:bg-stone-600 hover:text-stone-50 hover:transition-none",
        )
      }
    >
      <div className="w-[1em]">
        <CodeBracketIcon />
      </div>
      {children}
    </NavLink>
  );
}

export function InspectTab() {
  return (
    <div className="flex-1 flex flex-col">
      <nav className="shrink-0 flex flex-row">
        <InspectTabLink to="/inspect/parsed">parse tree</InspectTabLink>
        <InspectTabLink to="/inspect/generated">generated</InspectTabLink>
        <InspectTabLink to="/inspect/formatted">formatted</InspectTabLink>
      </nav>
      <div className="flex-1 flex flex-col bg-stone-800">
        <Outlet />
      </div>
    </div>
  );
}
