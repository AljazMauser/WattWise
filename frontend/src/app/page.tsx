"use client";

import Link from "next/link";
import { Activity, Zap, Brain, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 lg:px-14 h-20 flex items-center glass-panel border-b-0 rounded-none bg-opacity-50 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Zap className="h-8 w-8 text-[var(--color-primary)]" />
          <span className="font-bold text-2xl tracking-tight text-white">WattWise</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors" href="/login">
            Login
          </Link>
          <Link 
            className="text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]" 
            href="/register"
          >
            Get Started
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            Powered by Groq Llama 3
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 pb-2">
            Your Personal AI Cycling Coach
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl leading-relaxed">
            Upload your .FIT and .GPX files. Get instant, elite-level analysis on your Normalized Power, Intensity Factor, and TSS, summarized by cutting-edge AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link 
              href="/register" 
              className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--color-primary)] px-8 text-base font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-[var(--color-primary-dark)] transition-all hover:scale-105"
            >
              Start Training Now
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          <div className="glass-panel p-8 flex flex-col items-center text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold">Advanced Metrics</h3>
            <p className="text-gray-400 text-sm">Automatically calculates NP, IF, and TSS from your raw power and heart rate data.</p>
          </div>
          <div className="glass-panel p-8 flex flex-col items-center text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="p-4 bg-emerald-500/20 rounded-full">
              <Brain className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold">AI Ride Replay</h3>
            <p className="text-gray-400 text-sm">Receive a human-like, analytical training commentary generated instantly after every ride.</p>
          </div>
          <div className="glass-panel p-8 flex flex-col items-center text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="p-4 bg-amber-500/20 rounded-full">
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold">Interactive Viz</h3>
            <p className="text-gray-400 text-sm">Explore your routes on map and analyze power, heart rate, and elevation curves over time.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
