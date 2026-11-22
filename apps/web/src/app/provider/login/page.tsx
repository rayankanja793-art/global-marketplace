"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/providers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Check your details.");
        return;
      }

      router.push("/provider/dashboard");
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <a href="/" className="text-sm font-semibold text-blue-700 hover:underline">
          &larr; Back to marketplace
        </a>

        <h1 className="mt-7 text-3xl font-bold text-slate-900">
          Provider Login
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage your services and bookings.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+2547XXXXXXXX"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          {message && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New provider?{" "}
          <a href="/provider/register" className="font-semibold text-blue-700 hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
