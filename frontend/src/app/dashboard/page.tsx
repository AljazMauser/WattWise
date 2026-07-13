"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import api from "@/lib/api";
import { Zap, Upload, LogOut, Activity, Calendar, Clock, Map as MapIcon, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  const fetchRides = async () => {
    try {
      const res = await api.get("/api/rides");
      setRides(res.data);
    } catch (error) {
      console.error("Failed to fetch rides", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await api.post("/api/rides/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchRides(); // Refresh list after upload
    } catch (error) {
      console.error("Failed to upload file", error);
      alert("Failed to process the ride file. Ensure it is a valid .fit or .gpx.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 lg:px-14 h-20 flex items-center glass-panel border-b-0 rounded-none bg-opacity-50 sticky top-0 z-50">
        <Link className="flex items-center gap-2" href="/">
          <Zap className="h-8 w-8 text-[var(--color-primary)]" />
          <span className="font-bold text-2xl tracking-tight text-white">WattWise</span>
        </Link>
        <div className="ml-auto flex items-center gap-6">
          <span className="text-gray-300 hidden sm:inline-block">Hello, {user.username}</span>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-14 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage and analyze your training rides.</p>
          </div>
          <div>
            <input 
              type="file" 
              accept=".fit,.gpx" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? "Analyzing..." : "Upload Ride"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : rides.length === 0 ? (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-full mb-2">
              <MapIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white">No rides yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto">Upload your first .FIT or .GPX file to see your AI-powered insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <Link href={`/ride/${ride.id}`} key={ride.id} className="glass-panel p-6 group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate pr-4">
                    {ride.title || "Morning Ride"}
                  </h3>
                  <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors shrink-0">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(ride.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Distance</span>
                      <span className="font-medium">{ride.distance ? (ride.distance / 1000).toFixed(1) + " km" : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Duration</span>
                      <span className="font-medium">{ride.duration ? (ride.duration / 60).toFixed(0) + " min" : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Avg Power</span>
                      <span className="font-medium">{ride.avg_power ? ride.avg_power.toFixed(0) + " W" : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">TSS</span>
                      <span className="font-medium text-amber-400">{ride.tss ? ride.tss.toFixed(0) : "N/A"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
