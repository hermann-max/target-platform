import { LevelPage } from "@/components/level-page";

export const metadata = { title: "Quarterly Rocks" };

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string; q?: string }> }) {
  return <LevelPage level="rock" searchParams={await searchParams} />;
}
