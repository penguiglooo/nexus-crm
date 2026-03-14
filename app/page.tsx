import { PageWrapper } from "@/components/layout/page-wrapper";

export default function Home() {
  return (
    <PageWrapper title="Dashboard" subtitle="Your relationship overview">
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-widest text-emerald-500">
            NEXUS
          </h2>
          <p className="mt-2 text-muted-foreground">
            Personal Relationship Intelligence
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
