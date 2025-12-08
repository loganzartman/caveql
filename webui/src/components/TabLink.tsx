import clsx from "clsx";
import { NavLink } from "../router";

export function TabLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
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
      <div className="w-[1em]">{icon}</div>
      {children}
    </NavLink>
  );
}
