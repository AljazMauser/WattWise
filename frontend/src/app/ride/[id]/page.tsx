"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import api from "@/lib/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  Zap, ArrowLeft, BrainCircuit, Activity, Heart, Navigation, Mountain, Timer, Loader2, Map as MapIcon
} from "lucide-react";
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-800/50 animate-pulse"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div> });

export default function RideDetail({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchRide();
    }
  }, [user, params.id]);

  const fetchRide = async () => {
    try {
      const res = await api.get(`/api/rides/${params.id}`);
      setRide(res.data);
    } catch (error) {
      console.error("Failed to fetch ride", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!ride) return null;

  const rawData = typeof ride.time_series_data === 'string' 
    ? JSON.parse(ride.time_series_data) 
    : (ride.time_series_data || []);

  // Format timeseries for recharts
  const chartData = rawData.map((point: any, idx: number) => ({
    time: idx, // simplified
    power: point.power || 0,
    hr: point.hr || 0,
    elevation: point.alt || 0,
    speed: point.speed ? point.speed * 3.6 : 0 // m/s to km/h
  })).filter((_: any, i: number) => i % 5 === 0); // Decimate for performance if too many points

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="px-6 lg:px-14 h-20 flex items-center glass-panel border-b-0 rounded-none bg-opacity-50 sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
          <Zap className="h-6 w-6 text-[var(--color-primary)]" />
          <span className="font-bold text-xl tracking-tight text-white truncate max-w-[200px] sm:max-w-xs">
            {ride.title || "Morning Ride"}
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-14 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-6 flex flex-col">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Avg Power</span>
            </div>
            <span className="text-3xl font-bold">{ride.avg_power ? Math.round(ride.avg_power) : "--"} <span className="text-base text-gray-500 font-normal">W</span></span>
          </div>
          
          <div className="glass-panel p-6 flex flex-col border-b-4 border-b-amber-500/50">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Norm Power</span>
            </div>
            <span className="text-3xl font-bold">{ride.np ? Math.round(ride.np) : "--"} <span className="text-base text-gray-500 font-normal">W</span></span>
          </div>

          <div className="glass-panel p-6 flex flex-col">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium">Avg HR</span>
            </div>
            <span className="text-3xl font-bold">{ride.avg_hr ? Math.round(ride.avg_hr) : "--"} <span className="text-base text-gray-500 font-normal">bpm</span></span>
          </div>

          <div className="glass-panel p-6 flex flex-col border-b-4 border-b-emerald-500/50">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">TSS</span>
            </div>
            <span className="text-3xl font-bold">{ride.tss ? Math.round(ride.tss) : "--"}</span>
          </div>
        </div>

        {/* AI Coaching Section */}
        {ride.ai_summary && (
          <div className="glass-panel p-8 bg-gradient-to-br from-slate-800/80 to-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BrainCircuit className="w-32 h-32 text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">AI Coach Analysis</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {/* Parse simple markdown from Groq */}
                {ride.ai_summary.split('\n').map((paragraph: string, idx: number) => {
                  if (paragraph.startsWith('#')) {
                    return <h3 key={idx} className="text-xl font-bold text-blue-300 mt-4 mb-2">{paragraph.replace(/#/g, '').trim()}</h3>;
                  }
                  if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
                    return <li key={idx} className="ml-4 text-gray-300">{paragraph.substring(1).trim()}</li>;
                  }
                  if (paragraph.trim() === '') return <br key={idx} />;
                  
                  // Render bold text
                  const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={idx} className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Map Section */}
        {rawData && rawData.length > 0 && (
          <div className="glass-panel p-2 h-[400px] md:h-[500px]">
            <RouteMap data={rawData} />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 h-[400px]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Power Output
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="rgba(255,255,255,0.3)" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Area type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-6 h-[400px]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" /> Heart Rate
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="rgba(255,255,255,0.3)" domain={['dataMin - 10', 'dataMax + 10']} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
