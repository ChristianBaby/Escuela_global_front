"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPassword() {
	const router = useRouter()
  const [form, setForm] = useState({
    email: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
      credentials: "include"
    });

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow w-80 space-y-3"
      >
        <h2 className="text-lg font-bold">Recuperar contraseña</h2>

        <input
          name="email"
          type="email"
          placeholder="Correo"
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <button className="w-full bg-black text-white p-2 rounded">
         	Enviar Verificación 
        </button>
      </form>
    </div>
  );
}
