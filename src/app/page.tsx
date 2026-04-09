import Link from 'next/link';
import {
  Users,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Megaphone,
  ArrowRight,
  Sparkles,
  Trophy,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description:
      'Track registrations, profiles, and membership status for your entire club.',
  },
  {
    icon: DollarSign,
    title: 'Payments & Invoicing',
    description:
      'Send invoices, track payments, and manage your club finances effortlessly.',
  },
  {
    icon: Calendar,
    title: 'Competitions & Events',
    description:
      'Manage competitions, tournaments, training sessions, and more.',
  },
  {
    icon: Shield,
    title: 'Team Management',
    description:
      'Organise teams, manage rosters, and assign positions and captains.',
  },
  {
    icon: FileText,
    title: 'Documents & Photos',
    description:
      'Store club documents, share photos, and keep everything organised.',
  },
  {
    icon: Megaphone,
    title: 'Announcements',
    description:
      'Keep your members informed with club news and important updates.',
  },
];

const stats = [
  { value: '6', label: 'Core Modules' },
  { value: '∞', label: 'Unlimited Members' },
  { value: '24/7', label: 'Always Available' },
  { value: '$0', label: 'Setup Fee' },
];

const advantages = [
  {
    title: 'Unified Platform',
    description: 'Members, payments, events — all in one place.',
  },
  {
    title: 'Instant Setup',
    description: 'Get your club online in under 5 minutes.',
  },
  {
    title: 'Built for Clubs',
    description:
      'Purpose-built for sports organisations, not generic tools.',
  },
  {
    title: 'Always Improving',
    description: 'Regular updates driven by real club feedback.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              CC
            </div>
            <span className="text-xl font-bold tracking-tight">
              ClubConnect
            </span>
          </div>
          <div className="hidden md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button className="h-9 px-3 text-sm sm:h-10 sm:px-4">Get started</Button>
            </Link>
          </div>
        </div>
      </header>
      <div className="h-16" />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a3d] py-32 sm:py-40">
        {/* Layered gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #0c1a3d 0%, #122a5c 40%, #0c1a3d 100%)',
          }}
        />

        {/* Decorative blurred circles */}
        <div className="absolute top-20 -left-32 h-[400px] w-[400px] rounded-full bg-[#1e40af33] blur-[128px]" />
        <div className="absolute -bottom-20 right-0 h-[300px] w-[300px] rounded-full bg-[#3730a326] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e40af1a] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-8 gap-1.5 border-[#ffffff33] bg-[#ffffff1a] px-4 py-1.5 text-white hover:bg-[#ffffff26]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Next Gen Platform
          </Badge>

          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-white leading-tight sm:text-5xl sm:leading-[1.05] md:text-6xl lg:text-7xl">
            Everything your sports club needs,{' '}
            <span className="italic text-[#93c5fd]">in one place.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#ffffffb3] leading-relaxed sm:text-xl">
            ClubConnect is the all-in-one platform for managing your sports
            club. From member registrations and payments to competitions and
            team management — we&apos;ve got you covered.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full gap-2 bg-white text-[#0f172a] hover:bg-[#ffffffee] px-8 py-5 text-base font-bold shadow-xl sm:w-auto sm:py-6"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full border border-[#ffffff4d] text-white hover:bg-[#ffffff1a] hover:text-white px-8 py-5 text-base sm:w-auto sm:py-6"
              >
                Sign in
              </Button>
            </Link>
          </div>

          {/* Mock dashboard card */}
          <div
            className="mx-auto mt-16 max-w-3xl rounded-xl border border-[#ffffff1a] bg-[#ffffff0d] p-6 shadow-2xl hero-grid hidden sm:block"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <div className="flex gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-[#ffffff33]" />
              <div className="h-3 w-3 rounded-full bg-[#ffffff33]" />
              <div className="h-3 w-3 rounded-full bg-[#ffffff33]" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-3/4 rounded bg-[#ffffff1a]" />
              <div className="h-3 w-1/2 rounded bg-[#ffffff1a]" />
              <div className="flex gap-3 mt-4">
                <div className="h-20 flex-1 rounded-lg bg-[#ffffff12]" />
                <div className="h-20 flex-1 rounded-lg bg-[#ffffff12]" />
                <div className="h-20 flex-1 rounded-lg bg-[#ffffff12]" />
              </div>
              <div className="h-3 w-2/3 rounded bg-[#ffffff1a]" />
              <div className="h-3 w-1/3 rounded bg-[#ffffff1a]" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="border-y py-16 bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center sm:gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 h-1 w-12 rounded bg-primary" />
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need to run your club
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for sports clubs of all sizes.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-[#ffffff33]">
                  <feature.icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold transition-colors duration-300 group-hover:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-[#ffffffcc]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial / Competitive Edge ────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Decorative card */}
            <div className="relative pb-8 pr-8">
              <div
                className="aspect-[4/3] rounded-2xl p-6 sm:p-14"
                style={{
                  background:
                    'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
                }}
              >
                <div className="grid h-full grid-cols-2 gap-4">
                  {[Users, Trophy, BarChart3, Calendar].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center rounded-xl bg-[#ffffff1a]"
                    >
                      <Icon className="h-10 w-10 text-[#ffffffcc] sm:h-12 sm:w-12" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 rounded-xl border bg-card p-4 shadow-lg sm:bottom-0 sm:right-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">6 modules</p>
                    <p className="text-xs text-muted-foreground">
                      One platform
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                The Competitive Edge
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built specifically for sports clubs
              </h2>
              <p className="mt-4 text-muted-foreground">
                Stop forcing your club into generic project management tools.
                ClubConnect is purpose-built for the way sports organisations
                actually work.
              </p>

              <div className="mt-8 space-y-5">
                {advantages.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl px-8 py-16 text-center sm:px-16 sm:py-20"
            style={{
              background:
                'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
            }}
          >
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to transform your club?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#ffffffcc]">
              Join the clubs already streamlining their operations with
              ClubConnect.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-white text-[#0f172a] hover:bg-[#ffffffee] px-10 py-5 text-base font-bold shadow-2xl sm:w-auto sm:py-6"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full border border-[#ffffff4d] text-white hover:bg-[#ffffff1a] hover:text-white px-10 py-5 text-base sm:w-auto sm:py-6"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                CC
              </div>
              <span className="font-semibold">ClubConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ClubConnect. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
