"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    accountType: "individual",
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    county: "",
    town: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const payload = {
        ...form,
        businessName: form.businessName || undefined,
        email: form.email || undefined,
        county: form.county || undefined,
        town: form.town || undefined,
      };

      const response = await fetch(`${apiUrl}/providers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          Array.isArray(data.message)
            ? data.message.join(" ")
            : data.message || "Registration failed. Please check your details."
        );
        return;
      }

      router.push("/provider/login?registered=1");
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <a href="/" className="text-sm font-semibold text-blue-700 hover:underline">
          &larr; Back to marketplace
        </a>

        <h1 className="mt-7 text-3xl font-bold text-slate-900">
          Become a Service Provider
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create your account to offer services through Global-ServiceMarket.
        </p>

        <form onSubmit={handleRegister} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="accountType" className="mb-2 block text-sm font-semibold text-slate-700">
              Account type
            </label>
            <select
              id="accountType"
              value={form.accountType}
              onChange={(event) => updateField("accountType", event.target.value)}
              className={inputClass}
            >
              <option value="individual">Individual provider</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              required
              maxLength={100}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>

          {form.accountType === "business" && (
            <div>
              <label htmlFor="businessName" className="mb-2 block text-sm font-semibold text-slate-700">
                Business name
              </label>
              <input
                id="businessName"
                required
                maxLength={150}
                value={form.businessName}
                onChange={(event) => updateField("businessName", event.target.value)}
                className={inputClass}
                placeholder="Registered or trading name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email address (optional)
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              pattern="\+?[0-9]{7,15}"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClass}
              placeholder="+2547XXXXXXXX"
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
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="county" className="mb-2 block text-sm font-semibold text-slate-700">
              County (optional)
            </label>
            <input
              id="county"
              maxLength={100}
              value={form.county}
              onChange={(event) => updateField("county", event.target.value)}
              className={inputClass}
              placeholder="e.g. Nairobi"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="town" className="mb-2 block text-sm font-semibold text-slate-700">
              Town or area (optional)
            </label>
            <input
              id="town"
              maxLength={100}
              value={form.town}
              onChange={(event) => updateField("town", event.target.value)}
              className={inputClass}
              placeholder="e.g. Westlands"
            />
          </div>

          {message && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Create provider account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <a href="/provider/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
