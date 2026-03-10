"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clearAccessToken, getAccessToken } from "@/lib/auth";

type Room = {
  id: number;
  name: string;
  capacity: number;
  opening_hours: string | null;
  closing_hours: string | null;
};

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    setIsAuthenticated(Boolean(accessToken));

    if (!accessToken) {
      setRooms([]);
      setRoomsError(null);
      return;
    }

    const loadRooms = async () => {
      setIsLoadingRooms(true);
      setRoomsError(null);

      try {
        const response = await fetch("/api/rooms", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = (await response.json()) as Room[] | { message?: string };

        if (!response.ok || !Array.isArray(payload)) {
          const message = Array.isArray(payload) ? "Unable to load rooms." : (payload.message ?? "Unable to load rooms.");
          setRoomsError(message);
          setRooms([]);
          return;
        }

        setRooms(payload);
      } catch {
        setRoomsError("Unable to reach the server. Make sure backend and frontend are running.");
        setRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    void loadRooms();
  }, []);

  const handleLogout = () => {
    clearAccessToken();
    setIsAuthenticated(false);
    setRooms([]);
    setRoomsError(null);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
      <header className="card-surface rounded-3xl px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand">Room Booking Platform</p>
            <h1 className="mt-2 font-[family-name:var(--font-source-serif)] text-4xl leading-tight text-brand-deep sm:text-5xl">
              Reserve spaces that keep teams in flow.
            </h1>
          </div>
          {isAuthenticated ? (
            <div className="flex flex-col gap-3 sm:min-w-56">
              <p className="rounded-xl bg-brand/10 px-5 py-3 text-center text-sm font-semibold text-brand-deep">
                You are signed in.
              </p>
              <Link
                href="/create-room"
                className="rounded-xl bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-deep"
              >
                Create Room
              </Link>
              <Link
                href="/create-meeting"
                className="rounded-xl bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-deep"
              >
                Create Meeting
              </Link>
              <Link
                href="/calendar"
                className="rounded-xl bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-deep"
              >
                View Calendar
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-line bg-white px-5 py-3 text-center font-semibold text-foreground transition hover:border-brand"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:min-w-56">
              <Link
                href="/login"
                className="rounded-xl bg-brand px-5 py-3 text-center font-semibold text-white transition hover:bg-brand-deep"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-line bg-white px-5 py-3 text-center font-semibold text-foreground transition hover:border-brand"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {isAuthenticated && isLoadingRooms ? (
          <article className="card-surface rounded-2xl p-5 md:col-span-3">
            <p className="text-sm text-foreground/80">Loading rooms...</p>
          </article>
        ) : null}

        {isAuthenticated && roomsError ? (
          <article className="card-surface rounded-2xl p-5 md:col-span-3">
            <p className="text-sm font-medium text-red-700">{roomsError}</p>
          </article>
        ) : null}

        {isAuthenticated && !isLoadingRooms && !roomsError && rooms.length === 0 ? (
          <article className="card-surface rounded-2xl p-5 md:col-span-3">
            <p className="text-sm text-foreground/80">No rooms found. Create rooms from the backend first.</p>
          </article>
        ) : null}

        {isAuthenticated
          ? rooms.map((room) => (
              <article key={room.id} className="card-surface rounded-2xl p-5">
                <h2 className="text-xl font-semibold text-brand-deep">{room.name}</h2>
                <p className="mt-2 text-sm text-foreground/80">Capacity: {room.capacity} people</p>
                <p className="mt-2 text-sm text-foreground/80">
                  Hours: {room.opening_hours ?? "N/A"} - {room.closing_hours ?? "N/A"}
                </p>
                <p className="mt-4 inline-block rounded-lg bg-accent/15 px-3 py-1 text-sm font-medium text-accent">
                  Room ID: {room.id}
                </p>
              </article>
            ))
          : [
              {
                name: "Harbor Boardroom",
                capacity: "12 people",
                amenities: "4K display, video conference, whiteboard",
                slot: "Next open: 2:30 PM",
              },
              {
                name: "Maple Collaboration Studio",
                capacity: "8 people",
                amenities: "Standing desks, smart screen, natural light",
                slot: "Next open: 1:45 PM",
              },
              {
                name: "Summit Focus Pod",
                capacity: "4 people",
                amenities: "Quiet zone, acoustic paneling, monitor",
                slot: "Next open: 3:00 PM",
              },
            ].map((room) => (
              <article key={room.name} className="card-surface rounded-2xl p-5">
                <h2 className="text-xl font-semibold text-brand-deep">{room.name}</h2>
                <p className="mt-2 text-sm text-foreground/80">{room.capacity}</p>
                <p className="mt-2 text-sm text-foreground/80">{room.amenities}</p>
                <p className="mt-4 inline-block rounded-lg bg-accent/15 px-3 py-1 text-sm font-medium text-accent">
                  {room.slot}
                </p>
              </article>
            ))}
      </section>

      <section className="card-surface rounded-3xl p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-source-serif)] text-3xl text-brand-deep">
              Manage meetings with less back-and-forth.
            </h2>
            <p className="mt-3 text-foreground/80">
              Use live room availability, booking history, and instant confirmation to keep planning effortless across departments.
            </p>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-2xl font-bold text-brand-deep">98%</p>
              <p className="mt-1 text-foreground/80">On-time meeting starts</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-2xl font-bold text-brand-deep">35%</p>
              <p className="mt-1 text-foreground/80">Less admin coordination</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
