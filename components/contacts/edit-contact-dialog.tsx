"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateContact } from "@/lib/queries";
import { CONTACT_CATEGORIES, FREQUENCY_GOALS } from "@/lib/constants";
import type { ContactWithHealth } from "@/lib/types";

interface EditContactDialogProps {
  contact: ContactWithHealth;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
  onUpdated,
}: EditContactDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(contact.name);
  const [category, setCategory] = useState(contact.category);
  const [frequencyGoal, setFrequencyGoal] = useState<string>(contact.frequency_goal || "monthly");
  const [phone, setPhone] = useState(contact.phone || "");
  const [email, setEmail] = useState(contact.email || "");
  const [birthday, setBirthday] = useState(contact.birthday || "");
  const [tagsInput, setTagsInput] = useState((contact.tags || []).join(", "));
  const [notes, setNotes] = useState(contact.notes || "");

  // Sync form when contact changes
  useEffect(() => {
    setName(contact.name);
    setCategory(contact.category);
    setFrequencyGoal(contact.frequency_goal || "monthly");
    setPhone(contact.phone || "");
    setEmail(contact.email || "");
    setBirthday(contact.birthday || "");
    setTagsInput((contact.tags || []).join(", "));
    setNotes(contact.notes || "");
  }, [contact]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await updateContact(contact.id, {
        name: name.trim(),
        category: category as "friend" | "family" | "colleague" | "investor" | "mentor" | "other",
        frequency_goal: frequencyGoal as "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly",
        phone: phone.trim() || null,
        email: email.trim() || null,
        birthday: birthday || null,
        tags,
        notes: notes.trim() || null,
      });

      onOpenChange(false);
      onUpdated();
    } catch (error) {
      console.error("Failed to update contact:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update {contact.name}&apos;s information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category + Frequency row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-frequency">Frequency Goal</Label>
              <Select value={frequencyGoal} onValueChange={setFrequencyGoal}>
                <SelectTrigger id="edit-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_GOALS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label htmlFor="edit-birthday">Birthday</Label>
            <Input
              id="edit-birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              placeholder="e.g. tech, NYC, college (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Anything worth remembering..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
