import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {email} = await req.json();
    console.log(email)

    const res = await fetch("http://localhost:4000/api/auth/forgot-password", {
      method: "POST",
      headers: {
	      "Content-Type":"application/json"
      },
      body: JSON.stringify({email}),
    });

    const data = await res.json();
    const nextResponse = NextResponse.json(data, { status: res.status });
    return nextResponse

  } catch (error) {
    return NextResponse.json(
      { message: "Error en Envio" },
      { status: 500 }
    );
  }
}
