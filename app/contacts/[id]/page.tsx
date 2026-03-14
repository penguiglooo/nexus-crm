"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContactHeader } from "@/components/contacts/contact-header";
import { ContactNotesSection } from "@/components/contacts/contact-notes-section";
import { InteractionTimeline } from "@/components/contacts/interaction-timeline";
import { LogInteractionDialog } from "@/components/contacts/log-interaction-dialog";
import { AddNoteDialog } from "@/components/contacts/add-note-dialog";
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog";
import { getContact, getContactNotes, getInteractions } from "@/lib/queries";
import type { ContactWithHealth, ContactNote, Interaction } from "@/lib/types";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse rounded-xl border bg-card p-6">
        <div className="mb-4 h-4 w-32 rounded bg-muted" />
        <div className="mb-4 flex items-center gap-3">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
        <div className="mb-6 flex gap-6">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-md bg-muted" />
          <div className="h-9 w-24 rounded-md bg-muted" />
          <div className="h-9 w-16 rounded-md bg-muted" />
          <div className="h-9 w-20 rounded-md bg-muted" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-pulse rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
          <div className="space-y-3 p-5">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
          </div>
        </div>
        <div className="animate-pulse rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <div className="h-5 w-28 rounded bg-muted" />
          </div>
          <div className="space-y-3 p-5">
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-4xl">404</div>
      <h2 className="mb-2 text-lg font-semibold">Contact not found</h2>
      <p className="text-sm text-muted-foreground">
        This contact may have been deleted or the link is incorrect.
      </p>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactWithHealth | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Dialog states
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [contactData, notesData, interactionsData] = await Promise.all([
        getContact(contactId),
        getContactNotes(contactId),
        getInteractions(contactId),
      ]);

      if (!contactData) {
        setNotFound(true);
        return;
      }

      setContact(contactData);
      setNotes(notesData);
      setInteractions(interactionsData);
    } catch (error) {
      console.error("Failed to fetch contact data:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDataRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PageWrapper title="Contact" subtitle="Loading...">
        <DetailSkeleton />
      </PageWrapper>
    );
  }

  if (notFound || !contact) {
    return (
      <PageWrapper title="Contact" subtitle="Not found">
        <NotFoundState />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={contact.name}
      subtitle={`${contact.category} · ${contact.health}`}
    >
      <div className="space-y-6">
        {/* Contact Header */}
        <ContactHeader
          contact={contact}
          onLogInteraction={() => setLogDialogOpen(true)}
          onAddNote={() => setNoteDialogOpen(true)}
          onEdit={() => setEditDialogOpen(true)}
        />

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactNotesSection
            notes={notes}
            onAddNote={() => setNoteDialogOpen(true)}
            onNoteDeleted={handleDataRefresh}
          />
          <InteractionTimeline
            interactions={interactions}
            onLogInteraction={() => setLogDialogOpen(true)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <LogInteractionDialog
        contactId={contactId}
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        onLogged={handleDataRefresh}
      />

      <AddNoteDialog
        contactId={contactId}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onAdded={handleDataRefresh}
      />

      <EditContactDialog
        contact={contact}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdated={handleDataRefresh}
      />
    </PageWrapper>
  );
}
