"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  has_admin_access: boolean;
}

interface ProviderLocation {
  id: string;
  addressLabel: string;
  county?: string | null;
  town?: string | null;
  countryCode: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [locations, setLocations] = useState<ProviderLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [primaryLocationLoading, setPrimaryLocationLoading] = useState("");

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

        if (active) setProvider(data);
      } catch {
        if (active) {
          setMessage("Unable to load your account. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProvider();

    return () => {
      active = false;
    };
  }, [apiUrl, router]);

  useEffect(() => {
    if (!provider) return;

    let active = true;

    async function loadLocations() {
      setLocationsLoading(true);
      setLocationError("");

      try {
        const response = await fetch(`${apiUrl}/providers/locations`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your locations.");
        }

        if (active) setLocations(data);
      } catch (error) {
        if (active) {
          setLocationError(
            error instanceof Error
              ? error.message
              : "Unable to load your locations."
          );
        }
      } finally {
        if (active) setLocationsLoading(false);
      }
    }

    loadLocations();

    return () => {
      active = false;
    };
  }, [apiUrl, provider]);

  const [adminAccessLoading, setAdminAccessLoading] = useState(false);
  const [adminAccessError, setAdminAccessError] = useState("");

  async function openAdminDashboard() {
    setAdminAccessLoading(true);
    setAdminAccessError("");

    try {
      const response = await fetch(`${apiUrl}/providers/admin-session`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Administrator access was denied.");
      }

      router.replace("/admin");
    } catch (error) {
      setAdminAccessError(
        error instanceof Error
          ? error.message
          : "Unable to open the administrator dashboard."
      );
      setAdminAccessLoading(false);
    }
  }

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

  async function handleAddLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      addressLabel: String(formData.get("addressLabel") || "").trim(),
      county: String(formData.get("county") || "").trim(),
      town: String(formData.get("town") || "").trim(),
      countryCode: String(formData.get("countryCode") || "KE").trim(),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      isPrimary: formData.get("isPrimary") === "on",
    };

    setSavingLocation(true);
    setLocationError("");
    setLocationMessage("");

    try {
      const response = await fetch(`${apiUrl}/providers/locations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save this location.");
      }

      setLocations((current) => [
        data,
        ...current
          .filter((location) => location.id !== data.id)
          .map((location) =>
            data.isPrimary ? { ...location, isPrimary: false } : location
          ),
      ]);

      setLocationMessage("Location saved successfully.");
      form.reset();
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Unable to save this location."
      );
    } finally {
      setSavingLocation(false);
    }
  }

  async function makePrimary(locationId: string) {
    setPrimaryLocationLoading(locationId);
    setLocationError("");
    setLocationMessage("");

    try {
      const response = await fetch(
        `${apiUrl}/providers/locations/${locationId}/primary`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the primary location.");
      }

      setLocations((current) =>
        current.map((location) => ({
          ...location,
          isPrimary: location.id === locationId,
        }))
      );

      setLocationMessage("Primary location updated successfully.");
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to update the primary location."
      );
    } finally {
      setPrimaryLocationLoading("");
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
          <div className="flex items-center gap-3">
            {provider.has_admin_access === true && (
              <button
                onClick={openAdminDashboard}
                disabled={adminAccessLoading}
                className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
              >
                {adminAccessLoading ? "Opening..." : "Admin Dashboard"}
              </button>
            )}
            {adminAccessError && (
              <p className="text-sm text-red-600" role="alert">
                {adminAccessError}
              </p>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
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
              <p className="mt-1 font-semibold">
                {provider.email || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">County</p>
              <p className="mt-1 font-semibold">
                {provider.county || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Town or area</p>
              <p className="mt-1 font-semibold">
                {provider.town || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Verification status</p>
              <p className="mt-1 font-semibold">
                {provider.is_verified ? "Verified" : "Verification pending"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-blue-700">LOCATION MANAGEMENT</p>
            <h2 className="mt-2 text-xl font-bold">Your service locations</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add the places where customers can find or receive your services.
              You can set one location as your primary location.
            </p>
          </div>

          {locationError && (
            <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {locationError}
            </p>
          )}
          {locationMessage && (
            <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700" role="status">
              {locationMessage}
            </p>
          )}

          <div className="mt-6">
            <h3 className="font-semibold">Saved locations</h3>

            {locationsLoading ? (
              <p className="mt-3 text-sm text-slate-500">Loading locations...</p>
            ) : locations.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                You have not added a service location yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                {locations.map((location) => (
                  <article
                    key={location.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{location.addressLabel}</h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {[location.town, location.county, location.countryCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Coordinates: {Number(location.latitude).toFixed(5)},{" "}
                          {Number(location.longitude).toFixed(5)}
                        </p>
                      </div>
                      {location.isPrimary ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Primary location
                        </span>
                      ) : (
                        <button
                          onClick={() => makePrimary(location.id)}
                          disabled={primaryLocationLoading === location.id}
                          className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                        >
                          {primaryLocationLoading === location.id
                            ? "Updating..."
                            : "Make primary"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-7">
            <h3 className="font-semibold">Add another location</h3>
            <form onSubmit={handleAddLocation} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Address or location name
                <input
                  name="addressLabel"
                  required
                  minLength={3}
                  maxLength={250}
                  placeholder="e.g. Sample Service Location, Nairobi"
                  className="rounded-lg border border-slate-300 px-3 py-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                County
                <input
                  name="county"
                  maxLength={100}
                  placeholder="e.g. Nairobi"
                  className="rounded-lg border border-slate-300 px-3 py-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Town or area
                <input
                  name="town"
                  maxLength={100}
                  placeholder="e.g. Westlands"
                  className="rounded-lg border border-slate-300 px-3 py-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Country code
                <input
                  name="countryCode"
                  required
                  defaultValue="KE"
                  minLength={2}
                  maxLength={2}
                  pattern="[A-Za-z]{2}"
                  className="rounded-lg border border-slate-300 px-3 py-3 uppercase font-normal"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  Latitude
                  <input
                    name="latitude"
                    type="number"
                    required
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="-1.2921"
                    className="min-w-0 rounded-lg border border-slate-300 px-3 py-3 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Longitude
                  <input
                    name="longitude"
                    type="number"
                    required
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="36.8219"
                    className="min-w-0 rounded-lg border border-slate-300 px-3 py-3 font-normal"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="isPrimary"
                  className="h-4 w-4"
                />
                Set this as my primary location
              </label>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                >
                  {savingLocation ? "Saving location..." : "Save location"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}