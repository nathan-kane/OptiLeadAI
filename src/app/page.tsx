import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import Image from "next/image";
import { CheckoutButton } from "@/components/stripe/CheckoutButton";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">OptiLead</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors text-slate-700" prefetch={false}>Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors text-slate-700" prefetch={false}>How It Works</Link>
          <Link href="#pricing" className="text-sm font-medium hover:text-blue-600 transition-colors text-slate-700" prefetch={false}>Pricing</Link>
          <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors text-slate-700" prefetch={false}>Login</Link>
          <Link href="#pricing" className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold text-sm shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200" prefetch={false}>
            GET STARTED
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900">
                Let AI Handle the Awkward Cold Calls — 
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">You Close the Deals</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Upload your leads, and our AI-powered assistant will call, qualify, and schedule meetings — so you spend your time closing, not dialing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link href="#pricing" className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 uppercase tracking-wide">
                  GET STARTED NOW
                </Link>
                <Link href="#how-it-works" className="px-8 py-4 rounded-full border-2 border-blue-600 text-blue-600 font-semibold text-lg hover:bg-blue-50 transition-all duration-200 uppercase tracking-wide">
                  SEE HOW IT WORKS
                </Link>
              </div>
            </div>
            <div className="mt-16 relative max-w-4xl mx-auto">
              <Image
                src="/images/hero-woman-success.png"
                width={800}
                height={600}
                alt="AI-powered assistant making successful sales calls"
                className="mx-auto rounded-2xl shadow-2xl"
                priority
              />
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg">
                1,245 Leads Qualified This Week
              </div>
            </div>
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="w-full py-16 md:py-24 text-center bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">Stop Wasting Hours on Cold Calls</h2>
            <p className="text-slate-600 max-w-3xl mx-auto text-xl md:text-2xl leading-relaxed">
              Endless dialing, awkward conversations, constant rejection. OptiLead handles the outreach automatically, so you only spend time on qualified leads ready to buy.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-16">How It Works</h2>
            <div className="grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
              <div className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">1</div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">Import Leads</h3>
                <p className="text-slate-600 text-base leading-relaxed">Upload your lead list or connect your CRM. OptiLead is ready to call in minutes.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">2</div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">AI Makes the Calls</h3>
                <p className="text-slate-600 text-base leading-relaxed">Our AI engages prospects naturally using ElevenLabs human-like voices.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">3</div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">Get Qualified Leads</h3>
                <p className="text-slate-600 text-base leading-relaxed">Leads, transcripts, and call notes flow into your CRM — ready to close.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full py-16 md:py-24 text-center bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">Everything You Need to Grow</h2>
            <p className="text-slate-600 max-w-3xl mx-auto mb-16 text-xl leading-relaxed">
              AI cold calling, built-in CRM, smart reminders, and analytics — all in one platform.
            </p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <FeatureCard title="AI Cold Calling" desc="Natural AI voices engage prospects with real conversations." />
            <FeatureCard title="Call Transcripts" desc="Every conversation is transcribed and summarized for review." />
            <FeatureCard title="Built-in CRM" desc="Track leads, pipeline stages, and deal progress in one place." />
            <FeatureCard title="Smart Reminders" desc="Never miss a follow-up with AI-scheduled reminders." />
            <FeatureCard title="Appointment Booking" desc="Prospects can book directly with you during the call." />
            <FeatureCard title="Analytics Dashboard" desc="See conversion rates, call outcomes, and ROI at a glance." />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="w-full py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 max-w-3xl mx-auto mb-16 text-xl leading-relaxed">
              Choose the plan that fits your team. Cancel anytime.
            </p>
            <div className="flex flex-col lg:flex-row justify-center gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Basic"
                price="$199"
                subtitle="Perfect for solo agents and small teams"
                features={["Up to 1,000 AI calls/month", "Built-in CRM & pipeline", "Transcripts & call notes", "Email support"]}
                planType="basic"
              />
              <PricingCard
                title="Gold"
                price="$999"
                subtitle="For growing sales teams"
                features={["Up to 3,000 AI calls/month", "Advanced CRM with tasks", "Customizable call scripts", "Priority support"]}
                planType="gold"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t bg-white">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row items-center">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} OptiLead. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline text-gray-500">Terms of Service</Link>
            <Link href="#" className="text-xs hover:underline text-gray-500">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* --- Reusable Cards --- */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-left">
      <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
      <p className="text-slate-600 text-base leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingCard({ title, price, subtitle, features, planType }: { title: string; price: string; subtitle: string; features: string[]; planType: 'basic' | 'gold' }) {
  const isPro = planType === 'gold';
  
  return (
    <div className={`relative rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 flex-1 ${
      isPro 
        ? 'bg-gradient-to-br from-blue-50 via-white to-green-50 shadow-2xl border-2 border-blue-200 transform scale-105' 
        : 'bg-white shadow-lg border border-gray-200'
    }`}>
      {isPro && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide">
            ⭐ MOST POPULAR
          </div>
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className={`text-3xl font-extrabold mb-2 ${isPro ? 'text-slate-900' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className="text-slate-600 mb-6 text-lg">{subtitle}</p>
        <div className="flex items-baseline justify-center">
          <span className={`text-6xl font-extrabold ${isPro ? 'bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent' : 'text-slate-900'}`}>
            {price}
          </span>
          <span className="text-xl text-slate-500 ml-2">/month</span>
        </div>
      </div>
      <div className="space-y-4 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
              isPro ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-gradient-to-r from-blue-600 to-green-600'
            }`}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-slate-700 text-base">{f}</p>
          </div>
        ))}
      </div>
      <CheckoutButton 
        planType={planType} 
        size="lg" 
        className={`w-full rounded-full font-semibold text-lg py-4 transition-all duration-200 uppercase tracking-wide ${
          isPro 
            ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:scale-105' 
            : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:scale-105'
        }`}
      >
        GET STARTED WITH {title.toUpperCase()}
      </CheckoutButton>
    </div>
  );
}
