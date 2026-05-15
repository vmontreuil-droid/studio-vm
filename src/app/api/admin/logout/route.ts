import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(
    `${req.nextUrl.origin}/admin/aanvragen`,
    303,
  );
  res.cookies.set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  return res;
}
