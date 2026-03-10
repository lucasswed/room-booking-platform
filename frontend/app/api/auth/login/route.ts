import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  if (!body.email || !body.password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const formBody = new URLSearchParams({
    username: body.email,
    password: body.password,
  });

  const backendResponse = await fetch(`${BACKEND_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
    cache: "no-store",
  });

  const payload = (await backendResponse.json().catch(() => ({}))) as {
    detail?: string;
    access_token?: string;
    token_type?: string;
  };

  if (!backendResponse.ok || !payload.access_token) {
    return NextResponse.json(
      { message: payload.detail ?? "Incorrect email or password." },
      { status: backendResponse.status || 401 },
    );
  }

  return NextResponse.json(
    {
      access_token: payload.access_token,
      token_type: payload.token_type ?? "bearer",
    },
    { status: 200 },
  );
}
