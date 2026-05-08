
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {password, token} = await req.json();
    const newPassword = password

    const res = await fetch("http://localhost:4000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({newPassword, token}),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
