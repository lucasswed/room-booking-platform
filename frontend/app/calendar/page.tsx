"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAccessToken } from "@/lib/auth";
import {
  END_HOUR,
  ROW_HEIGHT_PX,
  SLOT_COUNT,
  SLOT_MINUTES,
  START_HOUR,
  addDays,
  clamp,
  localDateKey,
  minutesFromDate,
  slotToLabel,
  startOfWeek,
} from "@/lib/calendar";

type Room = {
  id: number;
  name: string;
};

type Meeting = {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  amount_of_people: number;
  start_time: string;
  end_time: string;
};

type Mode = "mine" | "room";

function weekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function CalendarPage() {
  const [mode, setMode] = useState<Mode>("mine");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [weekStartDate, setWeekStartDate] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setErrorMessage("You must be logged in to view calendar meetings.");
      return;
    }

    const loadRooms = async () => {
      try {
        const response = await fetch("/api/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json()) as Room[] | { message?: string };

        if (!response.ok || !Array.isArray(payload)) {
          return;
        }

        setRooms(payload);
        if (payload.length > 0) {
          setSelectedRoomId(payload[0].id);
        }
      } catch {
        // Non-fatal for "my meetings" mode.
      }
    };

    void loadRooms();
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const loadMeetings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const query =
          mode === "mine"
            ? "/api/bookings?scope=mine"
            : selectedRoomId
              ? `/api/bookings?scope=room&roomId=${selectedRoomId}`
              : null;

        if (!query) {
          setMeetings([]);
          setIsLoading(false);
          return;
        }

        const response = await fetch(query, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json()) as Meeting[] | { message?: string };

        if (!response.ok || !Array.isArray(payload)) {
          setErrorMessage(Array.isArray(payload) ? "Unable to load meetings." : (payload.message ?? "Unable to load meetings."));
          setMeetings([]);
          return;
        }

        setMeetings(payload);
      } catch {
        setErrorMessage("Unable to reach server. Make sure backend and frontend are running.");
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMeetings();
  }, [mode, selectedRoomId]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)),
    [weekStartDate],
  );

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();

    for (const meeting of meetings) {
      const key = localDateKey(new Date(meeting.start_time));
      const list = map.get(key) ?? [];
      list.push(meeting);
      map.set(key, list);
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      map.set(key, list);
    }

    return map;
  }, [meetings]);

  const timelineHeight = SLOT_COUNT * ROW_HEIGHT_PX;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
      <section className="card-surface rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand">Meeting Calendar</p>
            <h1 className="mt-2 font-[family-name:var(--font-source-serif)] text-4xl text-brand-deep">
              Weekly schedule calendar.
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("mine")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "mine" ? "bg-brand text-white" : "border border-line bg-white text-foreground"
              }`}
            >
              My Meetings
            </button>
            <button
              type="button"
              onClick={() => setMode("room")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "room" ? "bg-brand text-white" : "border border-line bg-white text-foreground"
              }`}
            >
              Room Meetings
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              Prev Week
            </button>
            <p className="min-w-64 text-center font-semibold text-brand-deep">{weekRangeLabel(weekStartDate)}</p>
            <button
              type="button"
              onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              Next Week
            </button>
          </div>

          {mode === "room" ? (
            <select
              value={selectedRoomId ?? ""}
              onChange={(event) => setSelectedRoomId(Number(event.target.value))}
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-[70px_repeat(7,minmax(140px,1fr))] gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <p className="text-center">Time</p>
          {weekDays.map((day) => (
            <p key={localDateKey(day)} className="text-center">
              {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </p>
          ))}
        </div>

        <div className="mt-2 overflow-auto rounded-2xl border border-line bg-white" style={{ height: "680px" }}>
          <div className="grid min-w-[1080px] grid-cols-[70px_repeat(7,minmax(140px,1fr))]">
            <div>
              {Array.from({ length: SLOT_COUNT }, (_, index) => (
                <div
                  key={`label-${index}`}
                  className="border-b border-line/60 px-2 text-[11px] text-foreground/65"
                  style={{ height: `${ROW_HEIGHT_PX}px` }}
                >
                  {index % 2 === 0 ? slotToLabel(index) : ""}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const key = localDateKey(day);
              const dayMeetings = meetingsByDay.get(key) ?? [];

              return (
                <div key={key} className="relative border-l border-line/70" style={{ height: `${timelineHeight}px` }}>
                  {Array.from({ length: SLOT_COUNT }, (_, index) => (
                    <div key={`${key}-row-${index}`} className="border-b border-line/60" style={{ height: `${ROW_HEIGHT_PX}px` }} />
                  ))}

                  {dayMeetings.map((meeting) => {
                    const start = new Date(meeting.start_time);
                    const end = new Date(meeting.end_time);
                    const minStart = START_HOUR * 60;
                    const minEnd = END_HOUR * 60;
                    const startMin = clamp(minutesFromDate(start), minStart, minEnd);
                    const endMin = clamp(minutesFromDate(end), minStart, minEnd);

                    if (endMin <= startMin) {
                      return null;
                    }

                    const topPx = ((startMin - minStart) / SLOT_MINUTES) * ROW_HEIGHT_PX;
                    const heightPx = ((endMin - startMin) / SLOT_MINUTES) * ROW_HEIGHT_PX;

                    return (
                      <article
                        key={meeting.id}
                        className="absolute left-1 right-1 overflow-hidden rounded-md border border-brand/50 bg-brand/20 px-2 py-1 text-xs text-brand-deep"
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      >
                        <p className="truncate font-semibold">{meeting.title}</p>
                        <p className="truncate">
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="truncate opacity-80">Room #{meeting.room_id}</p>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-foreground/80">Loading meetings...</p> : null}
        {errorMessage ? <p className="mt-4 text-sm font-medium text-red-700">{errorMessage}</p> : null}

        <p className="mt-5 text-sm text-foreground/80">
          Back to{" "}
          <Link href="/home" className="font-semibold text-brand hover:text-brand-deep">
            Home
          </Link>
        </p>
      </section>
    </main>
  );
}
