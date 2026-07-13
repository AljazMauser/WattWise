"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/api/auth/register", {
        username,
        email,
        password,
      });
      // Automatically redirect to login on success
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2">
        <Zap className="h-6 w-6 text-[var(--color-primary)]" />
        <span className="font-bold text-xl tracking-tight text-white">WattWise</span>
      </Link>
      
      <div className="glass-panel p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join WattWise and elevate your training.</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-2.5 rounded-lg transition-all flex justify-center items-center h-12 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign Up"}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
