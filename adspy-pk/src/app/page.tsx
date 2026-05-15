import Link from "next/link";
import { Zap, TrendingUp, Shield, Clock, BarChart3, Bookmark } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-100 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            AdSpy PK
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Sign In</Link>
            <Link href="/register" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Pakistan Facebook Ads · Updated Daily
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Find Winning Products<br />
            <span className="text-indigo-600">Before Everyone Else</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
            AdSpy PK scans the Facebook Ads Library every day to surface trending products
            being advertised in Pakistan — so you can build your store around what already sells.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-indigo-200">
              Start for Free
            </Link>
            <Link href="/login"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-lg border border-slate-200 transition-colors">
              Sign In
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-4">No credit card required · FREE plan available</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Everything you need to find winners</h2>
          <p className="text-center text-slate-500 mb-12">Powered by the Facebook Ads Library API, updated every day at midnight PKT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Trending Score", desc: "Every product gets a score based on ad count, unique advertisers, and recency. Higher = more profitable.", color: "text-indigo-600 bg-indigo-50" },
              { icon: Clock, title: "Daily Auto-Sync", desc: "Cron job runs every night at 12am PKT scanning 10 keyword categories across the entire Ads Library.", color: "text-emerald-600 bg-emerald-50" },
              { icon: BarChart3, title: "Category Analysis", desc: "Products sorted into 9 categories: Beauty, Fashion, Electronics, Health, Food, Real Estate and more.", color: "text-amber-600 bg-amber-50" },
              { icon: Shield, title: "Duplicate-Free", desc: "Smart deduplication ensures you see unique products, not the same ad repeated 50 times.", color: "text-blue-600 bg-blue-50" },
              { icon: Bookmark, title: "Save & Research", desc: "Bookmark products, add personal notes, and export your saved list to CSV for deeper research.", color: "text-purple-600 bg-purple-50" },
              { icon: Zap, title: "Real-Time Search", desc: "Search the Facebook Ads Library live from the app. Results saved to history automatically.", color: "text-rose-600 bg-rose-50" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <h3 className="font-bold text-slate-900 text-xl mb-1">Free</h3>
              <p className="text-4xl font-extrabold text-slate-900 mb-1">$0<span className="text-slate-400 text-lg font-normal">/mo</span></p>
              <p className="text-slate-500 text-sm mb-6">Get started, no card needed</p>
              <ul className="space-y-3 text-sm text-slate-600 mb-8">
                {["10 products per day", "5 manual searches/day", "Basic filters", "Save up to 10 products"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 text-white rounded-2xl p-8 relative">
              <div className="absolute -top-3 right-6 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="font-bold text-xl mb-1">PRO</h3>
              <p className="text-4xl font-extrabold mb-1">$19<span className="text-indigo-300 text-lg font-normal">/mo</span></p>
              <p className="text-indigo-200 text-sm mb-6">For serious dropshippers</p>
              <ul className="space-y-3 text-sm text-indigo-100 mb-8">
                {[
                  "Unlimited products", "Unlimited searches", "Advanced filters & sorting",
                  "CSV / Excel export", "Unlimited saved products", "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-indigo-300">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                Start PRO Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-slate-700">AdSpy PK</span>
        </div>
        <p>© {new Date().getFullYear()} AdSpy PK. Built for Pakistani e-commerce entrepreneurs.</p>
      </footer>
    </div>
  );
}
