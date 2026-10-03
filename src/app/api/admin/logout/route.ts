import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, wisOudeAdminCookies } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(`${req.nextUrl.origin}/admin`, 303);
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  // Oude cookienamen ook wissen, met path=/ én een eventueel oud
  // overblijfsel met path=/admin (oude cookie-config).
  wisOudeAdminCookies(res.headers);
  return res;
}
