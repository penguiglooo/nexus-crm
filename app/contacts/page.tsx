"use client";

import { useState, useEffect, useMemo } from "react";
import { Users } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactCard } from "@/components/contacts/contact-card";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { getContacts } from "@/lib/queries";
import type { ContactWithHealth, HealthStatus } from "@/lib/types";

function ContactsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[180px] animate-pulse rounded-lg border bg-card"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-36 rounded bg-muted" />
            </div>
            <div className="flex gap-1">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-14 rounded bg-muted" />
            </div>
            <div className="border-t border-border pt-2">
              <div className="h-3 w-28 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {hasFilters ? "No matches found" : "No contacts yet"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Add your first contact to get started."}
      </p>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<HealthStatus | null>(null);

  async function fetchContacts() {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesName = contact.name.toLowerCase().includes(q);
        const matchesEmail = contact.email?.toLowerCase().includes(q);
        const matchesPhone = contact.phone?.toLowerCase().includes(q);
        const matchesTags = contact.tags?.some((t) =>
          t.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && contact.category !== selectedCategory) {
        return false;
      }

      // Health filter
      if (selectedHealth && contact.health !== selectedHealth) {
        return false;
      }

      return true;
    });
  }, [contacts, search, selectedCategory, selectedHealth]);

  const hasFilters = Boolean(search || selectedCategory || selectedHealth);

  return (
    <PageWrapper
      title="Contacts"
      subtitle={`${contacts.length} people in your network`}
      action={<AddContactDialog onCreated={fetchContacts} />}
    >
      <div className="space-y-6">
        <ContactFilters
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedHealth={selectedHealth}
          onHealthChange={setSelectedHealth}
        />

        {loading ? (
          <ContactsSkeleton />
        ) : filteredContacts.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact, index) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
