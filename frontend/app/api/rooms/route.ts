import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "Authorization header is required." }, { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/rooms/`, {
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
      { message: payload.detail ?? "Unable to load rooms." },
      { status: backendResponse.status || 500 },
    );
  }

  return NextResponse.json(payload, { status: 200 });
}

type CreateRoomBody = {
  name?: string;
  capacity?: number;
  opening_hours?: string | null;
  closing_hours?: string | null;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "Authorization header is required." }, { status: 401 });
  }

  const body = (await request.json()) as CreateRoomBody;

  if (!body.name || !body.capacity) {
    return NextResponse.json({ message: "Room name and capacity are required." }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}/rooms/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      name: body.name,
      capacity: body.capacity,
      opening_hours: body.opening_hours ?? null,
      closing_hours: body.closing_hours ?? null,
    }),
    cache: "no-store",
  });

  const payload = (await backendResponse.json().catch(() => ({}))) as {
    detail?: string;
  };

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: payload.detail ?? "Unable to create room." },
      { status: backendResponse.status || 500 },
    );
  }

  return NextResponse.json(payload, { status: 201 });
}
