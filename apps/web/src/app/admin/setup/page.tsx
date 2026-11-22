
"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/api/admin/auth/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          bootstrapSecret,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Administrator account creation failed.",
        );
      }

      setMessage(
        "Your Super Admin account was created successfully. You can now proceed to administrator login.",
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBootstrapSecret("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the administrator server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c9a227] bg-[#17130a] text-3xl text-[#d4af37]">
            🌐
          </div>

          <p className="text-sm font-semibold tracking-[0.3em] text-[#d4af37]">
            GLOBAL-SERVICEMARKET
          </p>

          <h1 className="mt-5 text-3xl font-bold text-[#e0bd55]">
            Super Admin Setup
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Create your master administrator account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-[#6f591e] bg-[#121212] p-6 shadow-2xl shadow-black sm:p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[#d4af37]">
              Full Name
            </label>
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-[#49402a] bg-[#090909] px-4 py-3 text-white outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#d4af37]">
              Administrator Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-lg border border-[#49402a] bg-[#090909] px-4 py-3 text-white outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#d4af37]">
              Password
            </label>
            <input
              required
              type={showPassword ? "text" : "password"}
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a strong password"
              className="w-full rounded-lg border border-[#49402a] bg-[#090909] px-4 py-3 text-white outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#d4af37]">
              Confirm Password
            </label>
            <input
              required
              type={showPassword ? "text" : "password"}
              minLength={12}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              className="w-full rounded-lg border border-[#49402a] bg-[#090909] px-4 py-3 text-white outline-none focus:border-[#d4af37]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-sm text-[#d4af37] hover:text-white"
          >
            {showPassword ? "Hide passwords" : "Show passwords"}
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#d4af37]">
              Private Setup Secret
            </label>
            <input
              required
              type="password"
              value={bootstrapSecret}
              onChange={(event) => setBootstrapSecret(event.target.value)}
              placeholder="Enter your private setup secret"
              className="w-full rounded-lg border border-[#49402a] bg-[#090909] px-4 py-3 text-white outline-none focus:border-[#d4af37]"
            />
          </div>

          {message && (
            <div
              role="status"
              className="rounded-lg border border-[#8b702b] bg-[#211b0c] p-3 text-sm text-[#e8cf83]"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#a98220] to-[#e2c15b] px-5 py-4 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "CREATING ACCOUNT..."
              : "CREATE SUPER ADMIN ACCOUNT"}
          </button>

          <p className="text-center text-xs leading-5 text-gray-500">
            Protected initial registration. Keep your setup secret and
            administrator password private.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Global-ServiceMarket · Administrator Security
        </p>
      </div>
    </main>
  );
}
