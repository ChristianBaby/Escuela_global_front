import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { message: "Token requerido" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `http://localhost:4000/api/auth/verify-email?token=${token}`,
      {
        method: "GET",
	credentials: "include"
      }
    );
    const data = await res.json();
    const nextResponse = NextResponse.json(data, {
      status: res.status,
    });
    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: "Error en verificación de email" },
      { status: 500 }
    );
  }
}
