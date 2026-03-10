"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { getAccessToken } from "@/lib/auth";

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [openingHours, setOpeningHours] = useState("09:00");
  const [closingHours, setClosingHours] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = getAccessToken();
    if (!token) {
      setErrorMessage("You must be logged in to create a room.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          capacity,
          opening_hours: `${openingHours}:00`,
          closing_hours: `${closingHours}:00`,
        }),
      });

      const payload = (await response.json()) as { message?: string; name?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? "Unable to create room.");
        return;
      }

      setSuccessMessage(`Room ${payload.name ?? name} created successfully.`);
      setName("");
      setCapacity(4);
    } catch {
      setErrorMessage("Unable to reach server. Make sure backend and frontend are running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-10 sm:px-8 lg:px-10">
      <section className="card-surface w-full rounded-3xl p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-brand">Room Management</p>
        <h1 className="mt-2 font-[family-name:var(--font-source-serif)] text-4xl text-brand-deep sm:text-5xl">
          Create a new room.
        </h1>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground/85">
              Room name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="North Star Boardroom"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-foreground/85">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>

          <div>
            <label htmlFor="openingHours" className="mb-1 block text-sm font-medium text-foreground/85">
              Opening hour
            </label>
            <input
              id="openingHours"
              name="openingHours"
              type="time"
              value={openingHours}
              onChange={(event) => setOpeningHours(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="closingHours" className="mb-1 block text-sm font-medium text-foreground/85">
              Closing hour
            </label>
            <input
              id="closingHours"
              name="closingHours"
              type="time"
              value={closingHours}
              onChange={(event) => setClosingHours(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
            />
          </div>

          {errorMessage ? <p className="text-sm font-medium text-red-700 sm:col-span-2">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm font-medium text-brand-deep sm:col-span-2">{successMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-deep sm:col-span-2"
          >
            {isSubmitting ? "Creating Room..." : "Create Room"}
          </button>
        </form>

        <p className="mt-6 text-sm text-foreground/80">
          Back to{" "}
          <Link href="/home" className="font-semibold text-brand hover:text-brand-deep">
            Home
          </Link>
        </p>
      </section>
    </main>
  );
}
