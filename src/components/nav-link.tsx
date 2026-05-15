"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  homePath,
}: {
  href: string;
  label: string;
  homePath: string;
}) {
  const pathname = usePathname();
  const path = href.split("#")[0].replace(/\/$/, "");
  const isSub = path && path !== homePath;
  const active =
    isSub && (pathname === path || pathname.startsWith(path + "/"));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "font-medium text-foreground underline decoration-accent decoration-2 underline-offset-8"
          : "text-muted underline-offset-8 transition-colors hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
