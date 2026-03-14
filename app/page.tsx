"use client";

import { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { StatCards } from "@/components/dashboard/stat-cards";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { UpcomingBirthdays } from "@/components/dashboard/upcoming-birthdays";
import { RecentInteractions } from "@/components/dashboard/recent-interactions";
import { PendingDrafts } from "@/components/dashboard/pending-drafts";
import {
  getDashboardStats,
  getContactsNeedingAttention,
  getUpcomingBirthdays,
  getRecentInteractions,
  getMessageDrafts,
} from "@/lib/queries";
import type { DashboardStats, ContactWithHealth, Contact, Interaction, MessageDraft } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-lg border bg-card" />
        ))}
      </div>
      {/* Widget skeletons */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[320px] rounded-lg border bg-card" />
        <div className="h-[320px] rounded-lg border bg-card" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[320px] rounded-lg border bg-card" />
        <div className="h-[320px] rounded-lg border bg-card" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [needsAttention, setNeedsAttention] = useState<ContactWithHealth[]>([]);
  const [birthdays, setBirthdays] = useState<ContactWithHealth[]>([]);
  const [interactions, setInteractions] = useState<(Interaction & { contact: Contact })[]>([]);
  const [drafts, setDrafts] = useState<(MessageDraft & { contact: Contact })[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, attentionData, birthdayData, interactionData, draftData] = await Promise.all([
        getDashboardStats(),
        getContactsNeedingAttention(5),
        getUpcomingBirthdays(30),
        getRecentInteractions(10),
        getMessageDrafts("pending"),
      ]);

      setStats(statsData);
      setNeedsAttention(attentionData);
      setBirthdays(birthdayData);
      setInteractions(interactionData);
      setDrafts(draftData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDraftUpdate = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageWrapper title="Dashboard" subtitle="Your relationship overview">
      {loading || !stats ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <StatCards stats={stats} />

          <div className="grid gap-6 md:grid-cols-2">
            <NeedsAttention contacts={needsAttention} />
            <UpcomingBirthdays contacts={birthdays} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RecentInteractions interactions={interactions} />
            <PendingDrafts drafts={drafts} onUpdate={handleDraftUpdate} />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
