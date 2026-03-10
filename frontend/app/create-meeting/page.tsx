"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
} from "@/lib/calendar";

type Room = {
  id: number;
  name: string;
  capacity: number;
};

type Meeting = {
  id: number;
  room_id: number;
  title: string;
  start_time: string;
  end_time: string;
};

function toIsoForSelectedDate(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function defaultDateValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateMeetingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [amountOfPeople, setAmountOfPeople] = useState(2);
  const [date, setDate] = useState(defaultDateValue);
  const [existingMeetings, setExistingMeetings] = useState<Meeting[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setRoomsError("You must be logged in to schedule a meeting.");
      return;
    }

    const loadRooms = async () => {
      setRoomsError(null);

      try {
        const response = await fetch("/api/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json()) as Room[] | { message?: string };

        if (!response.ok || !Array.isArray(payload)) {
          setRoomsError(Array.isArray(payload) ? "Unable to load rooms." : (payload.message ?? "Unable to load rooms."));
          return;
        }

        setRooms(payload);
        if (payload.length > 0) {
          setSelectedRoomId(payload[0].id);
        }
      } catch {
        setRoomsError("Unable to reach server. Make sure backend and frontend are running.");
      }
    };

    void loadRooms();
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !selectedRoomId) {
      setExistingMeetings([]);
      return;
    }

    const loadMeetings = async () => {
      try {
        const response = await fetch(`/api/bookings?scope=room&roomId=${selectedRoomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json()) as Meeting[] | { message?: string };
        if (!response.ok || !Array.isArray(payload)) {
          setExistingMeetings([]);
          return;
        }

        setExistingMeetings(payload);
      } catch {
        setExistingMeetings([]);
      }
    };

    void loadMeetings();
  }, [selectedRoomId]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [isDragging]);

  const selection = useMemo(() => {
    if (dragStart === null || dragCurrent === null) {
      return null;
    }

    const start = Math.min(dragStart, dragCurrent);
    const end = Math.max(dragStart, dragCurrent);
    return {
      startSlot: start,
      endSlotInclusive: end,
      startTime: slotToLabel(start),
      endTime: slotToLabel(end + 1),
    };
  }, [dragCurrent, dragStart]);

  const dayMeetings = useMemo(() => {
    return existingMeetings
      .filter((meeting) => localDateKey(new Date(meeting.start_time)) === date)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [date, existingMeetings]);

  const existingBlocks = useMemo(() => {
    return dayMeetings
      .map((meeting) => {
        const start = new Date(meeting.start_time);
        const end = new Date(meeting.end_time);
        const dayStartMin = START_HOUR * 60;
        const dayEndMin = END_HOUR * 60;
        const startMin = clamp(minutesFromDate(start), dayStartMin, dayEndMin);
        const endMin = clamp(minutesFromDate(end), dayStartMin, dayEndMin);

        if (endMin <= startMin) {
          return null;
        }

        return {
          id: meeting.id,
          title: meeting.title,
          topPx: ((startMin - dayStartMin) / SLOT_MINUTES) * ROW_HEIGHT_PX,
          heightPx: ((endMin - startMin) / SLOT_MINUTES) * ROW_HEIGHT_PX,
          label: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
        };
      })
      .filter((block): block is NonNullable<typeof block> => block !== null);
  }, [dayMeetings]);

  const onSlotMouseDown = (index: number) => {
    setDragStart(index);
    setDragCurrent(index);
    setIsDragging(true);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const onSlotMouseEnter = (index: number) => {
    if (!isDragging) {
      return;
    }
    setDragCurrent(index);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const token = getAccessToken();
    if (!token) {
      setSubmitError("You must be logged in to create a meeting.");
      return;
    }

    if (!selectedRoomId) {
      setSubmitError("Select a room first.");
      return;
    }

    if (!selection) {
      setSubmitError("Select a meeting time by dragging on the calendar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: selectedRoomId,
          title,
          amount_of_people: amountOfPeople,
          start_time: toIsoForSelectedDate(date, selection.startTime),
          end_time: toIsoForSelectedDate(date, selection.endTime),
        }),
      });

      const payload = (await response.json()) as { message?: string; id?: number };

      if (!response.ok) {
        setSubmitError(payload.message ?? "Unable to create meeting.");
        return;
      }

      setSubmitSuccess(`Meeting #${payload.id ?? ""} created successfully.`.trim());
      setTitle("");
      setDragStart(null);
      setDragCurrent(null);
    } catch {
      setSubmitError("Unable to reach server. Make sure backend and frontend are running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineHeight = SLOT_COUNT * ROW_HEIGHT_PX;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-5 py-10 sm:px-8 lg:px-10">
      <section className="card-surface w-full rounded-3xl p-7 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-brand">Meeting Scheduler</p>
        <h1 className="mt-2 font-[family-name:var(--font-source-serif)] text-4xl text-brand-deep sm:text-5xl">
          Create a meeting with drag selection.
        </h1>

        <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground/85">
                Meeting title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Weekly product sync"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
              />
            </div>

            <div>
              <label htmlFor="room" className="mb-1 block text-sm font-medium text-foreground/85">
                Room
              </label>
              <select
                id="room"
                name="room"
                value={selectedRoomId ?? ""}
                onChange={(event) => setSelectedRoomId(Number(event.target.value))}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
                required
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amountOfPeople" className="mb-1 block text-sm font-medium text-foreground/85">
                Number of attendees
              </label>
              <input
                id="amountOfPeople"
                name="amountOfPeople"
                type="number"
                min={1}
                value={amountOfPeople}
                onChange={(event) => setAmountOfPeople(Number(event.target.value))}
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
              />
            </div>

            <div className="flex items-end gap-3">
              <label htmlFor="date" className="mb-1 block text-sm font-medium text-foreground/85">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-brand/30 transition focus:ring-4"
              />
              <button
                type="button"
                onClick={() => {
                  const current = new Date(`${date}T00:00:00`);
                  setDate(localDateKey(addDays(current, -1)));
                }}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = new Date(`${date}T00:00:00`);
                  setDate(localDateKey(addDays(current, 1)));
                }}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                Next
              </button>
            </div>

            {selection ? (
              <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm font-medium text-brand-deep">
                Selected time: {selection.startTime} - {selection.endTime}
              </p>
            ) : (
              <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground/85">
                Drag on the calendar to pick start and end time.
              </p>
            )}

            {roomsError ? <p className="text-sm font-medium text-red-700">{roomsError}</p> : null}
            {submitError ? <p className="text-sm font-medium text-red-700">{submitError}</p> : null}
            {submitSuccess ? <p className="text-sm font-medium text-brand-deep">{submitSuccess}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || Boolean(roomsError)}
              className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating Meeting..." : "Create Meeting"}
            </button>

            <p className="text-sm text-foreground/80">
              Back to{" "}
              <Link href="/home" className="font-semibold text-brand hover:text-brand-deep">
                Home
              </Link>
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-deep">Daily Calendar</h2>
              <p className="text-xs text-foreground/70">{date}</p>
            </div>

            <div className="relative overflow-auto rounded-xl border border-line bg-white" style={{ height: "560px" }}>
              <div className="grid grid-cols-[68px_1fr]">
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

                <div className="relative">
                  {Array.from({ length: SLOT_COUNT }, (_, index) => {
                    const isSelected =
                      selection !== null && index >= selection.startSlot && index <= selection.endSlotInclusive;

                    return (
                      <button
                        key={`slot-${index}`}
                        type="button"
                        onMouseDown={() => onSlotMouseDown(index)}
                        onMouseEnter={() => onSlotMouseEnter(index)}
                        className={`block w-full border-b border-line/60 text-left transition ${
                          isSelected ? "bg-brand/20" : "bg-white hover:bg-brand/5"
                        }`}
                        style={{ height: `${ROW_HEIGHT_PX}px` }}
                        aria-label={`Select slot ${slotToLabel(index)}`}
                      />
                    );
                  })}

                  {existingBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="pointer-events-none absolute left-2 right-2 rounded-md border border-accent/40 bg-accent/20 px-2 py-1 text-xs text-accent"
                      style={{ top: `${block.topPx}px`, height: `${block.heightPx}px` }}
                    >
                      <p className="truncate font-semibold">{block.title}</p>
                      <p className="truncate">{block.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs text-foreground/70">
              Drag inside the time grid to select a start and end time, then create the meeting.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
