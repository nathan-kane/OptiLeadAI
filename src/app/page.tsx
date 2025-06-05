import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">LeadSpring AI</span>
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
            <Link href="/signup" prefetch={false}>Sign Up</Link>
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
                    Transform Your Leads into Revenue with AI
                  </h1>
                  <p className="max-w-[600px] text-foreground/80 md:text-xl">
                    LeadSpring AI empowers B2B marketers and small businesses to generate higher quality leads, automate nurturing, and close more deals.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/signup" prefetch={false}>
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
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Simple Pricing for Businesses of All Sizes
              </h2>
              <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose a plan that fits your needs. Get started for free today!
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button size="lg" className="w-full" asChild>
                 <Link href="/signup">Sign Up Now</Link>
               </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-foreground/70">&copy; {new Date().getFullYear()} LeadSpring AI. All rights reserved.</p>
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
