import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Heart, Activity, CheckCircle, Bot, ArrowRight, UserCheck } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-green-600 selection:text-white relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-green-600/5 blur-3xl -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-3xl translate-y-1/3"></div>

      {/* Sticky Header / Navbar */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md z-50 border-b border-slate-200/50 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-600 flex items-center justify-center font-bold text-white shadow-sm text-xs sm:text-sm">
              H
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-900 hidden min-[360px]:inline">HealthGuard</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors">Features</a>
            <a href="#ai-assistant" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors">AI Assistant</a>
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors">Patient Portal</Link>
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors">Admin Portal</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3.5">
            <Link
              to="/login"
              className="text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors shrink-0"
            >
              Portal Login
            </Link>
            <Link
              to="/signup"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
            >
              Patient Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center md:text-left md:flex md:items-center md:gap-16 relative z-10">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-200/60 text-green-700 text-[10px] font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-green-600" />
            AI-Driven Public Health System
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Smart Vaccination <br />
            <span className="bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
              Reminders & Monitoring
            </span>
          </h1>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed font-medium">
            HealthGuard AI keeps families protected by automating vaccination tracking, delivering reliable Twilio SMS reminders, and providing an instant AI symptom assistant.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-green-600/10 hover:shadow-md transition-all group"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              Access Member Dashboard
            </Link>
          </div>
 
          {/* Trust Indicators */}
          <div className="pt-8 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200/50 flex items-center justify-center text-green-700 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 tracking-wide">Secure Records</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200/50 flex items-center justify-center text-green-700 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 tracking-wide">AI-Powered Assistance</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200/50 flex items-center justify-center text-green-700 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 tracking-wide">SMS Reminders</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200/50 flex items-center justify-center text-green-700 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 tracking-wide">Vaccination Tracking</span>
            </div>
          </div>
        </div>
 
        {/* Hero Visual Mockup */}
        <div className="flex-1 mt-16 md:mt-0 relative flex justify-center">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group card-hover">
            {/* Ambient card background */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-green-500/5 blur-2xl"></div>
 
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-900">Upcoming Doses</span>
              </div>
              <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                Active Status
              </span>
            </div>
 
            {/* List item mockup */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">COVID-19 Booster</h4>
                  <p className="text-[10px] text-slate-550 mt-1">Dose 3 • Scheduled for June 15, 2026</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
 
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Influenza (Flu Shot)</h4>
                  <p className="text-[10px] text-slate-550 mt-1">Dose 1 • Completed</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-green-50 border border-green-200/50 text-green-700 font-bold text-[9px] uppercase tracking-wider">
                  Administered
                </div>
              </div>
            </div>
 
            {/* Notification alert simulator mock - secondary surface panel */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-900">HealthGuard Alert Sent</p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-normal font-medium">
                  "Hi Sarah, your booster vaccination is due in 3 days. Reply CHAT to ask HealthGuard questions."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Metrics Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-b border-slate-200/60 bg-white/40 backdrop-blur-sm relative z-10 my-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-1.5">
            <p className="text-3xl font-extrabold text-green-600 tracking-tight">12,850+</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vaccinations Tracked</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-3xl font-extrabold text-green-600 tracking-tight">99.8%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reminder Delivery Rate</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-3xl font-extrabold text-green-600 tracking-tight">3,420+</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-3xl font-extrabold text-green-600 tracking-tight">24/7</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assistant Availability</p>
          </div>
        </div>
      </section>
 
      {/* Feature grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200 relative z-10 bg-white/40 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Designed for Proactive Healthcare</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            HealthGuard AI integrates tools to keep vaccination logs precise, secure, and accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-350 transition-all hover:translate-y-[-4px] duration-300 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Automated SMS Reminders</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Real Twilio SMS delivery keeps patients updated regarding upcoming schedules. Never miss an immunization slot.
            </p>
          </div>

          <div id="ai-assistant" className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-350 transition-all hover:translate-y-[-4px] duration-300 shadow-sm scroll-mt-20">
            <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">NLP Symptom Chatbot</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Query the assistant in multiple languages (English, Hindi, Telugu) to analyze symptoms, look up centers, and check schedules.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-350 transition-all hover:translate-y-[-4px] duration-300 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Patient Portal Access</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Log in to review upcoming schedules, view completed vaccine history, update preferences, and print styled PDF report summaries.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200 text-center text-slate-400 text-[10px] font-bold tracking-wider uppercase bg-white">
        © 2026 HealthGuard AI. All rights reserved. Secure clinical databases.
      </footer>
    </div>
  );
};

export default Landing;
