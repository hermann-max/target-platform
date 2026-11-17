import { LevelPage } from "@/components/level-page";

export const metadata = { title: "3–5 Year Goals" };

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string; q?: string }> }) {
  return <LevelPage level="target" searchParams={await searchParams} />;
}
