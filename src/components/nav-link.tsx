"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  homePath,
  icoon,
}: {
  href: string;
  label: string;
  homePath: string;
  icoon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const path = href.split("#")[0].replace(/\/$/, "");
  const isSub = path && path !== homePath;
  const isHome = path === homePath && !href.includes("#");
  const active = isHome
    ? pathname === homePath || pathname === homePath + "/"
    : isSub && (pathname === path || pathname.startsWith(path + "/"));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-foreground underline decoration-accent decoration-2 underline-offset-8"
          : "group inline-flex items-center gap-1.5 whitespace-nowrap text-muted underline-offset-8 transition-colors hover:text-foreground"
      }
    >
      {icoon}
      {label}
    </Link>
  );
}
