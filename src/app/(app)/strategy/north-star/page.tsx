import { LevelPage } from "@/components/level-page";

export const metadata = { title: "North Star" };

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string; q?: string }> }) {
  return <LevelPage level="bhag" searchParams={await searchParams} />;
}
