import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const res = await fetch("http://localhost:4000/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),

		});

		const data = await res.json();
		console.log(data)

		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		return NextResponse.json(
			{ message: "Error en el servidor" },
			{ status: 500 }
		);
	}
}

