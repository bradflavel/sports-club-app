export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:justify-center sm:py-4">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          CC
        </div>
        <span className="text-xl font-bold text-foreground">ClubConnect</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
