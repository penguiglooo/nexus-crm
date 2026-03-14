"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InteractionChart } from "@/components/analytics/interaction-chart";
import { HealthDistribution } from "@/components/analytics/health-distribution";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { HealthBadge } from "@/components/shared/health-badge";
import { getContacts } from "@/lib/queries";
import type { ContactWithHealth } from "@/lib/types";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[380px] rounded-lg border bg-card" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[380px] rounded-lg border bg-card" />
        <div className="h-[380px] rounded-lg border bg-card" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[320px] rounded-lg border bg-card" />
        <div className="h-[320px] rounded-lg border bg-card" />
      </div>
    </div>
  );
}

function ContactListItem({
  contact,
  subtitle,
}: {
  contact: ContactWithHealth;
  subtitle: string;
}) {
  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {contact.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <HealthBadge health={contact.health} />
    </Link>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactWithHealth[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const contactsData = await getContacts();
      setContacts(contactsData);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Most contacted: contacts with most recent interactions (smallest days_since_contact)
  const mostContacted = [...contacts]
    .filter((c) => c.days_since_contact !== null)
    .sort((a, b) => (a.days_since_contact ?? Infinity) - (b.days_since_contact ?? Infinity))
    .slice(0, 5);

  // Most neglected: contacts with most days since contact
  const mostNeglected = [...contacts]
    .filter((c) => c.days_since_contact !== null && c.days_since_contact > 0)
    .sort((a, b) => (b.days_since_contact ?? 0) - (a.days_since_contact ?? 0))
    .slice(0, 5);

  function formatDays(days: number | null): string {
    if (days === null) return "Never";
    if (days < 1) return "Today";
    if (days === 1) return "1 day ago";
    return `${Math.round(days)} days ago`;
  }

  return (
    <PageWrapper title="Analytics" subtitle="Insights into your relationships">
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Interaction frequency chart — full width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interaction Frequency</CardTitle>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardHeader>
            <CardContent>
              <InteractionChart />
            </CardContent>
          </Card>

          {/* Health Distribution + Category Breakdown — 2 columns */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health Distribution</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Across all contacts
                </p>
              </CardHeader>
              <CardContent>
                <HealthDistribution contacts={contacts} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Contacts by category
                </p>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown contacts={contacts} />
              </CardContent>
            </Card>
          </div>

          {/* Most Contacted + Most Neglected — 2 columns */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Contacted</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Recently interacted with
                </p>
              </CardHeader>
              <CardContent>
                {mostContacted.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No interactions yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {mostContacted.map((contact) => (
                      <ContactListItem
                        key={contact.id}
                        contact={contact}
                        subtitle={formatDays(contact.days_since_contact)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Neglected</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Longest since last contact
                </p>
              </CardHeader>
              <CardContent>
                {mostNeglected.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No contacts to show
                  </p>
                ) : (
                  <div className="space-y-1">
                    {mostNeglected.map((contact) => (
                      <ContactListItem
                        key={contact.id}
                        contact={contact}
                        subtitle={formatDays(contact.days_since_contact)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
