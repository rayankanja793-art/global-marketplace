
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const stats = [
  { label: "Total Customers", value: "0", icon: "👥" },
  { label: "Service Providers", value: "0", icon: "🧑‍🔧" },
  { label: "Total Bookings", value: "0", icon: "📅" },
  { label: "Platform Revenue", value: "KSh 0", icon: "💰" },
];

const sections = [
  { name: "Users & Accounts", description: "Manage customers and account access", icon: "👥" },
  { name: "Service Providers", description: "Manage individuals, businesses and branches", icon: "🧑‍🔧" },
  { name: "Bookings", description: "Monitor and manage service bookings", icon: "📅" },
  { name: "Payments & Finance", description: "Transactions, commissions and payouts", icon: "💳" },
  { name: "Locations", description: "Manage counties, towns and service areas", icon: "📍" },
  { name: "Customer Support", description: "Manage support tickets and complaints", icon: "🎧" },
  { name: "Reviews & Reports", description: "Moderate reviews and resolve reports", icon: "⭐" },
  { name: "Marketing", description: "Manage promotions and advertisements", icon: "📢" },
  { name: "Analytics", description: "View platform performance and insights", icon: "📊" },
  { name: "Security & Permissions", description: "Manage administrator access and audit logs", icon: "🔐" },
  { name: "Platform Settings", description: "Configure marketplace operations", icon: "⚙️" },
];

type Admin = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [providerPhone, setProviderPhone] = useState("");
  const [linkingProvider, setLinkingProvider] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const response = await fetch(`${apiUrl}/api/admin/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }

        const result = await response.json();

        if (active) {
          setAdmin(result);
          setLoading(false);
        }
      } catch {
        router.replace("/admin/login");
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      await fetch(`${apiUrl}/api/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/admin/login");
    }
  }

  if (loading || !admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-[#d4af37]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#49402a] border-t-[#d4af37]" />
          <p className="font-semibold">Verifying administrator session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[#493b1b] bg-[#101010] p-6 lg:block">
          <h1 className="text-xl font-bold text-[#d4af37]">
            Global-ServiceMarket
          </h1>
          <p className="mt-2 text-xs tracking-widest text-gray-500">
            ADMINISTRATION
          </p>

          <nav className="mt-10 space-y-2">
            <a
              href="/admin"
              className="block rounded-lg border border-[#806323] bg-[#30240c] px-4 py-3 font-semibold text-[#e4c15a]"
            >
              Dashboard
            </a>

            {sections.map((section) => (
              <a
                key={section.name}
                href="/admin"
                className="block rounded-lg px-4 py-3 text-sm text-gray-300 transition hover:bg-[#242018] hover:text-[#e4c15a]"
              >
                {section.icon} {section.name}
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#493b1b] bg-[#111111] px-5 py-5 md:px-8">
            <div>
              <p className="text-sm text-gray-500">
                Global-ServiceMarket / Administration
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#e0bd55]">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Welcome, {admin.fullName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[#806323] bg-[#211b0c] px-4 py-2 text-sm font-semibold text-[#e0bd55]">
                {admin.role.replaceAll("_", " ")}
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-[#806323] px-4 py-2 text-sm font-semibold text-[#e0bd55] transition hover:bg-[#30240c] disabled:opacity-50"
              >
                {loggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {admin.role === "super_admin" && (
              <section className="mb-8 rounded-xl border border-[#806323] bg-[#141414] p-6">
                <h3 className="text-lg font-bold text-[#e0bd55]">
                  Designated Provider Administrator Access
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Link one registered provider account to your existing Super Administrator account.
                </p>
                <form
                  className="mt-5 flex flex-col gap-3 sm:flex-row"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setLinkingProvider(true);
                    setLinkMessage("");
                    setLinkError("");
                    try {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                      const response = await fetch(`${apiUrl}/api/admin/providers/link`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: providerPhone.trim() }),
                      });
                      const result = await response.json();
                      if (!response.ok) {
                        throw new Error(result.message || "Unable to link provider.");
                      }
                      setLinkMessage(result.message || "Provider linked successfully.");
                      setProviderPhone("");
                    } catch (error) {
                      setLinkError(error instanceof Error ? error.message : "Unable to link provider.");
                    } finally {
                      setLinkingProvider(false);
                    }
                  }}
                >
                  <input
                    type="tel"
                    value={providerPhone}
                    onChange={(event) => setProviderPhone(event.target.value)}
                    placeholder="Registered provider phone number"
                    required
                    className="min-w-0 flex-1 rounded-lg border border-[#493b1b] bg-[#080808] px-4 py-3 text-white"
                  />
                  <button
                    type="submit"
                    disabled={linkingProvider}
                    className="rounded-lg bg-[#806323] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {linkingProvider ? "Linking..." : "Link Provider"}
                  </button>
                </form>
                {linkMessage && <p className="mt-3 text-sm text-green-400" role="status">{linkMessage}</p>}
                {linkError && <p className="mt-3 text-sm text-red-400" role="alert">{linkError}</p>}
              </section>
            )}
            <div className="mb-7">
              <h3 className="text-xl font-bold text-[#e0bd55]">
                Platform Overview
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Monitor and manage your marketplace from one central location.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#493b1b] bg-[#141414] p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-[#e0bd55]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9">
              <h3 className="text-xl font-bold text-[#e0bd55]">
                Administration Modules
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Select a department to manage its operations.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <div
                    key={section.name}
                    className="rounded-xl border border-[#493b1b] bg-[#141414] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]"
                  >
                    <span className="text-3xl">{section.icon}</span>
                    <h4 className="mt-4 font-bold text-[#e0bd55]">
                      {section.name}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {section.description}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-[#d4af37]">
                      Module planned
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-[#806323] bg-[#211b0c] p-5">
              <h3 className="font-bold text-[#e0bd55]">
                Development notice
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                Administrator session verification is active. Statistics are
                still placeholders. Individual management modules, permissions,
                database operations and audit logging will be implemented
                before production use.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
