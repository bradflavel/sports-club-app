import Link from 'next/link';
import {
  Users,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Track registrations, profiles, and membership status for your entire club.',
  },
  {
    icon: DollarSign,
    title: 'Payments & Invoicing',
    description: 'Send invoices, track payments, and manage your club finances effortlessly.',
  },
  {
    icon: Calendar,
    title: 'Competitions & Events',
    description: 'Manage competitions, tournaments, training sessions, and more.',
  },
  {
    icon: Shield,
    title: 'Team Management',
    description: 'Organise teams, manage rosters, and assign positions and captains.',
  },
  {
    icon: FileText,
    title: 'Documents & Photos',
    description: 'Store club documents, share photos, and keep everything organised.',
  },
  {
    icon: Megaphone,
    title: 'Announcements',
    description: 'Keep your members informed with club news and important updates.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              CC
            </div>
            <span className="text-xl font-bold">ClubConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Everything your sports club needs,{' '}
          <span className="text-primary">in one place</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          ClubConnect is the all-in-one platform for managing your sports club. From member
          registrations and payments to competitions and team management — we&apos;ve got you covered.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to run your club</h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Powerful features designed for sports clubs of all sizes
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              &copy; {new Date().getFullYear()} ClubConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
