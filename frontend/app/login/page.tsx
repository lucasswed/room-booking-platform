"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { saveAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        access_token?: string;
        message?: string;
      };

      if (!response.ok || !payload.access_token) {
        setErrorMessage(payload.message ?? "Login failed. Please verify your credentials.");
        return;
      }

      saveAccessToken(payload.access_token);
      router.push("/home");
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the server. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10 sm:px-8 lg:px-10">
      <section className="grid w-full gap-8 lg:grid-cols-2">
        <article className="card-surface rounded-3xl p-7 sm:p-9">
          <p className="text-sm uppercase tracking-[0.2em] text-brand">Welcome back</p>
          <h1 className="mt-3 font-[family-name:var(--font-source-serif)] text-4xl text-brand-deep sm:text-5xl">
            Sign in to your workspace.
          </h1>
          <p className="mt-4 text-foreground/80">
            View today&apos;s reservations, manage room capacity, and keep your team schedule moving.
          </p>
          <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-sm text-foreground/80">
            <p className="font-semibold text-brand-deep">Demo account</p>
            <p className="mt-1">email: demo@roomly.com</p>
            <p>password: demo1234</p>
          </div>
        </article>

        <article className="card-surface rounded-3xl p-7 sm:p-9">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground/85">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground/85">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
              />
            </div>
            {errorMessage ? <p className="text-sm font-medium text-red-700">{errorMessage}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-deep"
            >
              {isSubmitting ? "Signing In..." : "Log In"}
            </button>
          </form>

          <p className="mt-5 text-sm text-foreground/80">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-brand hover:text-brand-deep">
              Create one
            </Link>
          </p>
          <p className="mt-2 text-sm text-foreground/80">
            Back to{" "}
            <Link href="/home" className="font-semibold text-brand hover:text-brand-deep">
              Home
            </Link>
          </p>
        </article>
      </section>
    </main>
  );
}
