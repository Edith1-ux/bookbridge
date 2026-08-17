"use client";

import React, { useState } from "react";
import { Search, BookOpen, Sparkles, ArrowRight, ShieldCheck, Zap, Users, MessageSquare, Video } from "lucide-react";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Floating Glass Header */}
      <header className="fixed top-5 inset-x-0 z-50 max-w-6xl mx-auto px-4">
        <nav className="glass-pill rounded-full px-6 py-3 flex items-center justify-between shadow-lg border border-white/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              B
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              BookBridge<span className="text-emerald-600">2.0</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#marketplace" className="hover:text-emerald-600 transition-colors">Marketplace</a>
            <a href="#ai-search" className="hover:text-emerald-600 transition-colors">AI Search</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#colleges" className="hover:text-emerald-600 transition-colors">Colleges</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Log in
            </a>
            <a href="/register" className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-emerald-600 rounded-full transition-all duration-200 shadow-md hover:scale-105">
              Get Started
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 max-w-6xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Academic Ecosystem
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
          Every Academic Resource, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Connected Effortlessly.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Buy, sell, exchange, rent, and donate textbooks, GTU lab manuals, past papers, projects, and source code with verified peers across your campus.
        </p>

        {/* AI Natural Language Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-2.5 flex items-center gap-3 border border-white/60 shadow-xl">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try searching: 'Semester 4 DBMS notes under ₹200'..."
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-base"
            />
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shrink-0 flex items-center gap-2">
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">Trending:</span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer">#GTU Manuals</span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer">#Data Structures</span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer">#Python Code</span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-emerald-600 bg-emerald-50 border-emerald-200 cursor-pointer">#100% Free Swaps</span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="font-display text-3xl font-extrabold text-slate-900">15,000+</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Verified Students</div>
          </div>
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="font-display text-3xl font-extrabold text-slate-900">48,000+</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Resources Listed</div>
          </div>
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="font-display text-3xl font-extrabold text-emerald-600">₹0 Swap</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Peer Exchanges</div>
          </div>
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="font-display text-3xl font-extrabold text-slate-900">100%</div>
            <div className="text-xs font-medium text-slate-500 mt-1">College Isolation</div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Showcase */}
      <section id="features" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            Built for Modern Academic Workflows
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Integrated tools designed specifically for college students, department admins, and faculty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-3xl md:col-span-2 border border-slate-200/80 bg-white/70">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900">13 Polymorphic Resource Types</h3>
            <p className="text-slate-600 mt-2 leading-relaxed">
              From physical textbooks and GTU lab manuals to digital source code, project codebases, lab records, video lectures, and revision cheat sheets.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-slate-200/80 bg-white/70">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">Pluggable AI Suite</h3>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Hybrid search, automated OCR, duplicate detection, and study assistant powered by OpenAI, Ollama, and Gemini.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-slate-200/80 bg-white/70">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">Real-Time Chat</h3>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Instant peer-to-peer messaging, typing indicators, read receipts, and college department group rooms.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl md:col-span-2 border border-slate-200/80 bg-white/70">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900">WebRTC Voice & Video Calling</h3>
            <p className="text-slate-600 mt-2 leading-relaxed">
              Conduct 1-on-1 voice calls, video study sessions, and live screen sharing directly inside the browser.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">B</span>
            BookBridge 2.0
          </div>
          <div>© 2026 BookBridge Platform. All rights reserved.</div>
          <div className="flex gap-6 text-xs font-medium text-slate-600">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/api/v1/public/docs">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
