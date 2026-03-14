"use client";

import { motion } from "framer-motion";
import { Cake } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntilBirthday } from "@/lib/utils";
import type { ContactWithHealth } from "@/lib/types";

export function UpcomingBirthdays({ contacts }: { contacts: ContactWithHealth[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Cake className="h-4 w-4 text-pink-500" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No upcoming birthdays in the next 30 days.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => {
                const days = daysUntilBirthday(contact.birthday!);
                const birthdayDate = new Date(contact.birthday!);
                const month = birthdayDate.toLocaleString("default", { month: "short" });
                const day = birthdayDate.getDate();

                return (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-pink-500/10">
                        <span className="text-[10px] font-medium uppercase text-pink-500">
                          {month}
                        </span>
                        <span className="font-mono text-sm font-bold text-pink-500">
                          {day}
                        </span>
                      </div>
                      <span className="text-sm font-medium group-hover:text-emerald-500 transition-colors">
                        {contact.name}
                      </span>
                    </div>
                    <div className="text-right">
                      {days === 0 ? (
                        <span className="text-sm font-semibold text-pink-500">
                          Today!
                        </span>
                      ) : days === 1 ? (
                        <span className="text-sm font-semibold text-pink-500">
                          Tomorrow
                        </span>
                      ) : (
                        <span className="font-mono text-sm text-muted-foreground">
                          in {days}d
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
