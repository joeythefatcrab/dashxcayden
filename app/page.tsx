export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Homeschool <span className="text-primary">SaaS</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Adaptive curriculum platform for homeschool families
        </p>
        <div className="flex gap-4">
          <a
            href="/sign-in"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
        </div>
      </main>
    </div>
  );
}
