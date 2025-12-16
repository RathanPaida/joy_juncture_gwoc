import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-8 space-y-6">
      <section>
        <h1 className="text-3xl font-bold">Joy Juncture</h1>
        <p className="mt-2 text-lg">
          Games, experiences, and community-driven play.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Explore</h2>
        <nav className="flex flex-col gap-1">
          <Link href="/store" className="text-blue-400 underline">
            Store
          </Link>
          <Link href="/events" className="text-blue-400 underline">
            Events
          </Link>
          <Link href="/experiences" className="text-blue-400 underline">
            Experiences
          </Link>
          <Link href="/blog" className="text-blue-400 underline">
            Blog
          </Link>
          <Link href="/corporate" className="text-blue-400 underline">
            Corporate
          </Link>
          <Link href="/about" className="text-blue-400 underline">
            About
          </Link>
        </nav>
      </section>
    </div>
  );
}
