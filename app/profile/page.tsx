"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { UserCircle2, Mail, Save } from "lucide-react";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinedText = useMemo(() => {
    if (!profile?.createdAt) return "-";
    const dt = new Date(profile.createdAt);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString();
  }, [profile?.createdAt]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load profile");
        }

        if (!mounted) return;

        const userData: ProfileUser = {
          id: data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          createdAt: data.user.createdAt,
        };

        setProfile(userData);
        setName(userData.name);
        setEmail(userData.email);
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load profile";
        setError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update profile");
      }

      setProfile((prev) => prev ? { ...prev, name: data.user.name, email: data.user.email } : prev);
      login({ id: data.user.id, name: data.user.name, email: data.user.email });
      setMessage("Profile updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-full p-6 md:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-[#111318] dark:text-gray-300">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full p-6 md:p-10">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111318]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-100 p-2 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              <UserCircle2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account information.</p>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#111318]">
          <form onSubmit={onSave} className="space-y-5">
            <div>
              <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-[#0f1217] dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 dark:border-gray-700 dark:bg-[#0f1217] dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-[#0f1217]">
              <p className="text-gray-700 dark:text-gray-200">
                Signed in as <span className="font-semibold">{profile?.email || user?.email}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">Joined: {joinedText}</p>
            </div>

            {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
            {message && <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{message}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-rose-600 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

