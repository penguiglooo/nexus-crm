"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Bell, Cake, Clock, AlertTriangle, FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { DraftCard } from "@/components/reminders/draft-card";
import {
  getReminders,
  updateReminder,
  getMessageDrafts,
  updateDraft,
} from "@/lib/queries";
import type { Reminder, MessageDraft, Contact } from "@/lib/types";

type ReminderWithContact = Reminder & { contact: Contact };
type DraftWithContact = MessageDraft & { contact: Contact };

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function RemindersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[160px] animate-pulse rounded-lg border bg-card"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="border-t border-border pt-2 flex gap-2">
              <div className="h-7 w-16 rounded bg-muted" />
              <div className="h-7 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithContact[]>([]);
  const [drafts, setDrafts] = useState<DraftWithContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [reminderData, draftData] = await Promise.all([
        getReminders("pending"),
        getMessageDrafts("pending"),
      ]);
      setReminders(reminderData);
      setDrafts(draftData);
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -- Reminder actions

  const handleMarkDone = useCallback(
    async (id: string) => {
      try {
        await updateReminder(id, "done");
        setReminders((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Failed to mark reminder done:", err);
      }
    },
    []
  );

  const handleDismissReminder = useCallback(
    async (id: string) => {
      try {
        await updateReminder(id, "dismissed");
        setReminders((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Failed to dismiss reminder:", err);
      }
    },
    []
  );

  // -- Draft actions

  const handleApproveDraft = useCallback(
    async (id: string) => {
      try {
        await updateDraft(id, { status: "approved" });
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error("Failed to approve draft:", err);
      }
    },
    []
  );

  const handleDismissDraft = useCallback(
    async (id: string) => {
      try {
        await updateDraft(id, { status: "dismissed" });
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error("Failed to dismiss draft:", err);
      }
    },
    []
  );

  // -- Filtered lists

  const birthdayReminders = useMemo(
    () => reminders.filter((r) => r.reminder_type === "birthday"),
    [reminders]
  );

  const checkinReminders = useMemo(
    () => reminders.filter((r) => r.reminder_type === "frequency"),
    [reminders]
  );

  const overdueReminders = useMemo(
    () => reminders.filter((r) => isOverdue(r.due_date)),
    [reminders]
  );

  const totalCount = reminders.length + drafts.length;

  return (
    <PageWrapper
      title="Reminders"
      subtitle={
        loading
          ? "Loading..."
          : `${totalCount} item${totalCount !== 1 ? "s" : ""} need your attention`
      }
    >
      {loading ? (
        <RemindersSkeleton />
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              All
              {reminders.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {reminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="birthdays" className="gap-1.5">
              <Cake className="h-3.5 w-3.5" />
              Birthdays
              {birthdayReminders.length > 0 && (
                <span className="ml-1 rounded-full bg-pink-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-pink-500">
                  {birthdayReminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="checkins" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Check-ins
              {checkinReminders.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-500">
                  {checkinReminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue
              {overdueReminders.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                  {overdueReminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Drafts
              {drafts.length > 0 && (
                <span className="ml-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">
                  {drafts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Reminders */}
          <TabsContent value="all">
            {reminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="All clear!"
                description="No pending reminders. You're on top of everything."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {reminders.map((reminder, index) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      index={index}
                      onMarkDone={handleMarkDone}
                      onDismiss={handleDismissReminder}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Birthdays */}
          <TabsContent value="birthdays">
            {birthdayReminders.length === 0 ? (
              <EmptyState
                icon={Cake}
                title="No birthday reminders"
                description="No upcoming birthday reminders right now."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {birthdayReminders.map((reminder, index) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      index={index}
                      onMarkDone={handleMarkDone}
                      onDismiss={handleDismissReminder}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Check-ins */}
          <TabsContent value="checkins">
            {checkinReminders.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No check-in reminders"
                description="No frequency-based reminders pending."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {checkinReminders.map((reminder, index) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      index={index}
                      onMarkDone={handleMarkDone}
                      onDismiss={handleDismissReminder}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Overdue */}
          <TabsContent value="overdue">
            {overdueReminders.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Nothing overdue"
                description="Great job -- no overdue reminders."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {overdueReminders.map((reminder, index) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      index={index}
                      onMarkDone={handleMarkDone}
                      onDismiss={handleDismissReminder}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Drafts */}
          <TabsContent value="drafts">
            {drafts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No pending drafts"
                description="No message drafts waiting for review."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {drafts.map((draft, index) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      index={index}
                      onApprove={handleApproveDraft}
                      onDismiss={handleDismissDraft}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageWrapper>
  );
}
