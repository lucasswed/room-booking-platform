"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { saveAccessToken } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email: workEmail,
          phone: phone || null,
          password: newPassword,
        }),
      });

      const payload = (await response.json()) as {
        access_token?: string;
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "Sign up failed. Please try again.");
        return;
      }

      if (payload.access_token) {
        saveAccessToken(payload.access_token);
        router.push("/home");
        router.refresh();
        return;
      }

      router.push("/login");
    } catch {
      setErrorMessage("Unable to reach the server. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-10 sm:px-8 lg:px-10">
      <section className="card-surface w-full rounded-3xl p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-brand">Create account</p>
        <h1 className="mt-2 font-[family-name:var(--font-source-serif)] text-4xl text-brand-deep sm:text-5xl">
          Start booking rooms in minutes.
        </h1>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-foreground/85">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Alex"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-foreground/85">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Miller"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="workEmail" className="mb-1 block text-sm font-medium text-foreground/85">
              Work email
            </label>
            <input
              id="workEmail"
              name="workEmail"
              type="email"
              placeholder="alex@company.com"
              value={workEmail}
              onChange={(event) => setWorkEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground/85">
              Phone (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 555 0123"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-foreground/85">
              Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground/85">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>
          {errorMessage ? <p className="text-sm font-medium text-red-700 sm:col-span-2">{errorMessage}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-deep sm:col-span-2"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-foreground/80">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-deep">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
