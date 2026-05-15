import { NextResponse, type NextRequest } from "next/server";
import { adminPassword, adminConfigured } from "@/lib/supabase/config";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get("password") ?? "");
  const base = req.nextUrl.origin;

  if (!adminConfigured || pw !== adminPassword) {
    return NextResponse.redirect(`${base}/admin?e=1`, 303);
  }

  const res = NextResponse.redirect(`${base}/admin`, 303);
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
