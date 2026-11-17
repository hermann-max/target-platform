import { LevelPage } from "@/components/level-page";

export const metadata = { title: "Annual Goals" };

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string; q?: string }> }) {
  return <LevelPage level="annual" searchParams={await searchParams} />;
}
