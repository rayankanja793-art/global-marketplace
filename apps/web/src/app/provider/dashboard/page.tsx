"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Provider {
  id: string;
  account_type: string;
  full_name: string;
  business_name?: string;
  email?: string;
  phone: string;
  county?: string;
  town?: string;
  is_verified: boolean;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    let active = true;

    async function loadProvider() {
      try {
        const response = await fetch(`${apiUrl}/providers/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/provider/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load provider account.");
        }

        if (active) {
          setProvider(data);
        }
      } catch {
        if (active) {
          setMessage("Unable to load your account. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProvider();

    return () => {
      active = false;
    };
  }, [apiUrl, router]);

  async function handleLogout() {
    try {
      await fetch(`${apiUrl}/providers/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/provider/login");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading your provider account...</p>
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-slate-700">
            {message || "Your provider account could not be loaded."}
          </p>
          <button
            onClick={() => router.replace("/provider/login")}
            className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-extrabold text-blue-950">
            Global-ServiceMarket
          </a>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-semibold text-blue-700">PROVIDER PORTAL</p>
        <h1 className="mt-2 text-3xl font-bold">
          Welcome, {provider.full_name}
        </h1>
        <p className="mt-2 text-slate-500">
          Manage your provider account through Global-ServiceMarket.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-bold">Account information</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Account type</p>
              <p className="mt-1 font-semibold capitalize">
                {provider.account_type}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Full name</p>
              <p className="mt-1 font-semibold">{provider.full_name}</p>
            </div>

            {provider.business_name && (
              <div>
                <p className="text-sm text-slate-500">Business name</p>
                <p className="mt-1 font-semibold">{provider.business_name}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-500">Phone number</p>
              <p className="mt-1 font-semibold">{provider.phone}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email address</p>
              <p className="mt-1 font-semibold">{provider.email || "Not provided"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">County</p>
              <p className="mt-1 font-semibold">{provider.county || "Not provided"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Town or area</p>
              <p className="mt-1 font-semibold">{provider.town || "Not provided"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Verification status</p>
              <p className="mt-1 font-semibold">
                {provider.is_verified ? "Verified" : "Verification pending"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
