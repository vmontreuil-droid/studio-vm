"use client";

import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { Send, Check, AlertCircle, Mail } from "lucide-react";
import { sendContact, type ContactState } from "@/app/actions/contact";

const initial: ContactState = { ok: false, message: "" };

export type ContactFormLabels = {
  name: string;
  email: string;
  subject: string;
  body: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  subjectPlaceholder: string;
  bodyPlaceholder: string;
  submit: string;
  submitting: string;
  openMail: string;
};

export function ContactForm({ t }: { t: ContactFormLabels }) {
  const [state, setState] = useState<ContactState>(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await sendContact(formData);
          setState(result);
          if (result.ok) track("contact_submitted");
        });
      }}
      className="space-y-4"
    >
      {/* Honeypot — verborgen voor mensen, ingevuld door bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.name} required placeholder={t.namePlaceholder} />
        <Field
          name="email"
          label={t.email}
          type="email"
          required
          placeholder={t.emailPlaceholder}
        />
      </div>

      <Field
        name="subject"
        label={t.subject}
        placeholder={t.subjectPlaceholder}
      />

      <Field
        name="body"
        label={t.body}
        textarea
        required
        placeholder={t.bodyPlaceholder}
      />

      {state.message && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            state.ok
              ? "border-accent/30 bg-accent/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          {state.ok ? (
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" strokeWidth={2} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" strokeWidth={2} />
          )}
          <div className="flex-1">
            <p>{state.message}</p>
            {state.fallbackMailto && (
              <a
                href={state.fallbackMailto}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Mail className="h-3 w-3" strokeWidth={2} />
                {t.openMail}
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
        <Send className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
};

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  textarea,
}: FieldProps) {
  const baseClass =
    "mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";
  return (
    <div>
      <label
        htmlFor={name}
        className="block font-mono text-xs uppercase tracking-widest text-muted"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          rows={5}
          placeholder={placeholder}
          className={baseClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={
            name === "email" ? "email" : name === "name" ? "name" : "off"
          }
          className={baseClass}
        />
      )}
    </div>
  );
}
