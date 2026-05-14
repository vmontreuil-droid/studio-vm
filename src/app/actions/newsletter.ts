"use server";

export type NewsletterState = {
  ok: boolean;
  message: string;
};

export async function subscribe(formData: FormData): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();

  if (honeypot) {
    return { ok: true, message: "Bedankt!" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Dat e-mailadres lijkt niet te kloppen." };
  }

  // In productie: opslaan in Supabase + Resend Audiences
  console.log("[newsletter] subscribe:", email);

  return {
    ok: true,
    message: "Bedankt — ik mail je bij de eerste editie.",
  };
}
