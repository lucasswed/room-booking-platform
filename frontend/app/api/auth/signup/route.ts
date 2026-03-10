import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

type SignupBody = {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SignupBody;

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json(
      { message: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const signupResponse = await fetch(`${BACKEND_API_URL}/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      password: body.password,
    }),
    cache: "no-store",
  });

  const signupPayload = (await signupResponse.json().catch(() => ({}))) as {
    detail?: string;
    id?: number;
  };

  if (!signupResponse.ok) {
    return NextResponse.json(
      { message: signupPayload.detail ?? "Unable to create account." },
      { status: signupResponse.status || 400 },
    );
  }

  const loginFormBody = new URLSearchParams({
    username: body.email,
    password: body.password,
  });

  const loginResponse = await fetch(`${BACKEND_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: loginFormBody.toString(),
    cache: "no-store",
  });

  const loginPayload = (await loginResponse.json().catch(() => ({}))) as {
    detail?: string;
    access_token?: string;
    token_type?: string;
  };

  if (!loginResponse.ok || !loginPayload.access_token) {
    return NextResponse.json(
      {
        message: "Account created. Please log in.",
        user_id: signupPayload.id,
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      access_token: loginPayload.access_token,
      token_type: loginPayload.token_type ?? "bearer",
      user_id: signupPayload.id,
    },
    { status: 201 },
  );
}
