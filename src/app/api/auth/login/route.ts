
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include", //envio automatico de tokens para alguna operacion
    });

    const data = await res.json();
    const nextResponse = NextResponse.json(data, { status: res.status });

    // ==================== PROPAGACION DE COOKIES =====================
    const backendCookies = res.headers.getSetCookie()

    if(backendCookies && backendCookies.length > 0){
	    backendCookies.forEach((cookie)=>{
		    nextResponse.headers.append("Set-Cookie",cookie)
	    })
    }
    // 
    return nextResponse

  } catch (error) {
    return NextResponse.json(
      { message: "Error en login" },
      { status: 500 }
    );
  }
}

