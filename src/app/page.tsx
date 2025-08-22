import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import Image from "next/image";
import { CheckoutButton } from "@/components/stripe/CheckoutButton";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">OptiLead</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80" prefetch={false}>Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80" prefetch={false}>How It Works</Link>
          <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80" prefetch={false}>Pricing</Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80" prefetch={false}>Login</Link>
          <Button asChild>
            <Link href="#pricing" prefetch={false}>Request Beta</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_550px] items-center">
              <div className="flex flex-col justify-center space-y-6">
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight font-headline text-blue-900">
                  Let AI Handle the Awkward Cold Calls — You Close the Deals
                </h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-lg">
                  Upload your leads, and our AI-powered assistant will call, qualify, and schedule meetings — so you spend your time closing, not dialing.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="#pricing">Request Beta Access</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </div>
                
              </div>
              <div className="relative">
                <Image
                  src="/images/hero-woman-success.png"
                  width={450}
                  height={600}
                  alt="AI-powered assistant making successful sales calls"
                  className="mx-auto rounded-xl shadow-lg object-cover max-w-sm sm:max-w-md lg:max-w-lg"
                  priority
                />
                <div className="absolute bottom-4 right-4 bg-green-100 text-green-900 px-4 py-2 rounded-lg font-semibold shadow-md">
                  1,245 Leads Qualified This Week
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="w-full py-16 md:py-24 text-center bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Stop Wasting Hours on Cold Calls</h2>
            <p className="text-gray-700 max-w-2xl mx-auto text-lg md:text-xl">
              Endless dialing, awkward conversations, constant rejection. OptiLead handles the outreach automatically, so you only spend time on qualified leads ready to buy.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-16 md:py-24 bg-blue-50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-blue-900 mb-12">How It Works</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="p-6 rounded-lg border bg-white shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-2 text-blue-700">1. Import Leads</h3>
                <p className="text-gray-700 text-sm">Upload your lead list or connect your CRM. OptiLead is ready to call in minutes.</p>
              </div>
              <div className="p-6 rounded-lg border bg-white shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-2 text-blue-700">2. AI Makes the Calls</h3>
                <p className="text-gray-700 text-sm">Our AI engages prospects naturally using ElevenLabs human-like voices.</p>
              </div>
              <div className="p-6 rounded-lg border bg-white shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-2 text-blue-700">3. Get Qualified Leads</h3>
                <p className="text-gray-700 text-sm">Leads, transcripts, and call notes flow into your CRM — ready to close.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full py-16 md:py-24 text-center bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl sm:text-5xl font-bold text-blue-900 mb-6">Everything You Need to Grow</h2>
            <p className="text-gray-700 max-w-3xl mx-auto mb-12 text-lg">
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
        <section id="pricing" className="w-full py-16 md:py-24 bg-green-50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-700 max-w-2xl mx-auto mb-12 text-lg">
              Choose the plan that fits your team. Cancel anytime.
            </p>
            <div className="flex flex-col lg:flex-row justify-center gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Starter"
                price="$150"
                subtitle="Perfect for solo agents and small teams"
                features={["Up to 1,000 AI calls/month", "Built-in CRM & pipeline", "Transcripts & call notes", "Email support"]}
                planType="basic"
              />
              <PricingCard
                title="Pro"
                price="$300"
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
    <div className="p-6 rounded-lg border bg-white shadow-md hover:shadow-lg transition-shadow text-left">
      <h3 className="text-lg font-bold mb-2 text-blue-700">{title}</h3>
      <p className="text-gray-700 text-sm">{desc}</p>
    </div>
  );
}

function PricingCard({ title, price, subtitle, features, planType }: { title: string; price: string; subtitle: string; features: string[]; planType: 'basic' | 'gold' }) {
  const isPro = planType === 'gold';
  
  return (
    <div className={`relative rounded-2xl p-8 hover:shadow-xl transition-all duration-300 flex-1 ${
      isPro 
        ? 'bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-2xl border-2 border-amber-200 transform scale-105' 
        : 'bg-white shadow-lg border'
    }`}>
      {isPro && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            ⭐ MOST POPULAR
          </div>
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className={`text-2xl font-bold mb-2 ${isPro ? 'text-amber-900' : 'text-blue-900'}`}>
          {title}
        </h3>
        <p className="text-gray-700 mb-6">{subtitle}</p>
        <div className="flex items-baseline justify-center">
          <span className={`text-5xl font-bold ${isPro ? 'text-amber-900' : 'text-blue-900'}`}>
            {price}
          </span>
          <span className="text-xl text-gray-600 ml-2">/month</span>
        </div>
      </div>
      <div className="space-y-4 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              isPro ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-green-500'
            }`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-700">{f}</p>
          </div>
        ))}
      </div>
      <CheckoutButton 
        planType={planType} 
        size="lg" 
        className={`w-full ${
          isPro 
            ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg' 
            : ''
        }`}
      >
        Get Started with {title}
      </CheckoutButton>
    </div>
  );
}
