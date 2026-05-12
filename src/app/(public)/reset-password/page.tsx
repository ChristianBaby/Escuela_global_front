
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPassword() {
	const router = useRouter()
  const [form, setForm] = useState({
    password: "",
  });
  const searchParams = useSearchParams() 
  
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  const token = searchParams.get("token");
    const password = form.password
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({password, token}),
      credentials: "include"
    });

    const data = await res.json();
    if(data){
    	router.push("/auth/login")
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow w-80 space-y-3"
      >
        <h2 className="text-lg font-bold">Ingresar nuevo password</h2>
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <button className="w-full bg-black text-white p-2 rounded">
         	Cambiar 
        </button>
      </form>
    </div>
  );
}
