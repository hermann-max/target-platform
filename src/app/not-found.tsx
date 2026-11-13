import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-slate-500">This page doesn't exist, or it has been deleted.</p>
      <Link href="/" className="text-brand-700 hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
