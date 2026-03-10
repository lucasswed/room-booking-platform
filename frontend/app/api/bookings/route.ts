import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

type CreateBookingBody = {
  room_id?: number;
  title?: string;
  amount_of_people?: number;
  start_time?: string;
  end_time?: string;
};

function parseUserIdFromBearer(authHeader: string): number | null {
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as { sub?: string };
    const userId = Number(payload.sub);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "Authorization header is required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  let backendPath: string;

  if (scope === "mine") {
    const userId = parseUserIdFromBearer(authHeader);
    if (!userId) {
      return NextResponse.json({ message: "Invalid access token." }, { status: 401 });
    }
    backendPath = `/bookings/user/${userId}`;
  } else if (scope === "room") {
    const roomIdRaw = url.searchParams.get("roomId");
    const roomId = roomIdRaw ? Number(roomIdRaw) : NaN;

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json({ message: "A valid roomId is required for room scope." }, { status: 400 });
    }

    backendPath = `/bookings/room/${roomId}`;
  } else {
    return NextResponse.json({ message: "scope must be either 'mine' or 'room'." }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}${backendPath}`, {
    method: "GET",
    headers: {
      Authorization: authHeader,
    },
    cache: "no-store",
  });

  const payload = (await backendResponse.json().catch(() => ({}))) as {
    detail?: string;
  };

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: payload.detail ?? "Unable to load meetings." },
      { status: backendResponse.status || 500 },
    );
  }

  return NextResponse.json(payload, { status: 200 });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "Authorization header is required." }, { status: 401 });
  }

  const userId = parseUserIdFromBearer(authHeader);
  if (!userId) {
    return NextResponse.json({ message: "Invalid access token." }, { status: 401 });
  }

  const body = (await request.json()) as CreateBookingBody;

  if (!body.room_id || !body.title || !body.start_time || !body.end_time) {
    return NextResponse.json(
      { message: "Room, title, start time, and end time are required." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/bookings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      room_id: body.room_id,
      user_id: userId,
      title: body.title,
      amount_of_people: body.amount_of_people ?? 1,
      start_time: body.start_time,
      end_time: body.end_time,
    }),
    cache: "no-store",
  });

  const payload = (await backendResponse.json().catch(() => ({}))) as {
    detail?: string;
  };

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: payload.detail ?? "Unable to create meeting." },
      { status: backendResponse.status || 500 },
    );
  }

  return NextResponse.json(payload, { status: 201 });
}
