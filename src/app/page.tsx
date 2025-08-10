import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import Image from "next/image";
import { CheckoutButton } from "@/components/stripe/CheckoutButton";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">OptiLead</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80"
            prefetch={false}
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80"
            prefetch={false}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground/80"
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild>
            <Link href="#pricing" prefetch={false}>Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Transform Your Leads into Revenue with OptiLead
                  </h1>
                  <p className="max-w-[600px] text-foreground/80 md:text-xl">
                    OptiLead AI empowers B2B marketers and small businesses to generate higher quality leads, automate nurturing, and close more deals.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="#pricing" prefetch={false}>
                      Get Started for Free
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                     <Link href="#features" prefetch={false}>
                       Learn More
                     </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                data-ai-hint="abstract technology"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Unlock Your Growth Potential</h2>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with AI-powered tools to streamline your entire lead lifecycle.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none py-12">
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">AI Lead Scoring</h3>
                <p className="text-sm text-foreground/80">
                  Automatically qualify and prioritize leads with intelligent, customizable scoring rules.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">Personalized Nurturing</h3>
                <p className="text-sm text-foreground/80">
                  Craft engaging email campaigns with AI-suggested content snippets.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">Automated Workflows</h3>
                <p className="text-sm text-foreground/80">
                  Set up email drip campaigns and sales handoffs with ease.
                </p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">Sales Handoffs</h3>
                <p className="text-sm text-foreground/80">
                  Notify sales instantly when leads are qualified, with full context.
                </p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">Actionable Analytics</h3>
                <p className="text-sm text-foreground/80">
                  Track conversions and campaign performance with a clear dashboard.
                </p>
              </div>
               <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <h3 className="text-lg font-bold font-headline">Data Validation</h3>
                <p className="text-sm text-foreground/80">
                  Improve lead data quality with automated validation checks.
                </p>
              </div>
            </div>
          </div>
        </section>
         <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Choose Your AI-Powered Lead Generation Plan
              </h2>
              <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Unlock the power of AI-driven prospecting with our comprehensive plans designed for growing businesses.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Basic Plan */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
                  <p className="text-gray-600 mb-6">Perfect for growing sales teams</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">$150</span>
                    <span className="text-xl text-gray-600 ml-2">/month</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">AI Cold-Calling</p>
                      <p className="text-sm text-gray-600">Automated intelligent outreach calls</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Lead Scoring</p>
                      <p className="text-sm text-gray-600">AI-powered lead qualification and prioritization</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Lead Data Tracking</p>
                      <p className="text-sm text-gray-600">Comprehensive lead management and analytics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email Campaigns with AI Content</p>
                      <p className="text-sm text-gray-600">AI-suggested personalized email content</p>
                    </div>
                  </div>
                </div>
                
                <CheckoutButton planType="basic" size="lg" className="w-full">
                  Get Started with Basic
                </CheckoutButton>
              </div>
              
              {/* Gold Plan */}
              <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-xl border-2 border-yellow-400 p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gold</h3>
                  <p className="text-gray-600 mb-6">Advanced AI for enterprise teams</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">$1,999</span>
                    <span className="text-xl text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Everything in Basic, plus:</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">All Basic Features</p>
                      <p className="text-sm text-gray-600">Complete access to all Basic plan capabilities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">AI Agent Script Enhancements</p>
                      <p className="text-sm text-gray-600">Advanced script optimization from call transcript analysis</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">RAG Knowledge Base</p>
                      <p className="text-sm text-gray-600">Retrieval-Augmented Generation for intelligent responses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Follow-up Call Recording & Analysis</p>
                      <p className="text-sm text-gray-600">Advanced call analysis and training insights</p>
                    </div>
                  </div>
                </div>
                
                <CheckoutButton 
                  planType="gold" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white border-0"
                >
                  Upgrade to Gold
                </CheckoutButton>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Need a custom solution? Contact our sales team.</p>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-foreground/70">&copy; {new Date().getFullYear()} OptiLead. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-foreground/70" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-foreground/70" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
