"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CONTACT_CATEGORIES, FREQUENCY_GOALS } from "@/lib/constants"
import type { Contact, ContactInsert, ContactUpdate } from "@/types/database.types"

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ContactInsert | ContactUpdate) => Promise<void>
  contact?: Contact
  userId: string
}

export function ContactDialog({ open, onOpenChange, onSubmit, contact, userId }: ContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [birthday, setBirthday] = useState<Date | undefined>(
    contact?.birthday ? new Date(contact.birthday) : undefined
  )
  const [customFrequencyDays, setCustomFrequencyDays] = useState<number | undefined>(
    contact?.custom_frequency_days || undefined
  )
  const [frequencyGoal, setFrequencyGoal] = useState(contact?.frequency_goal || 'monthly')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const tags = formData.get('tags')?.toString().split(',').map(t => t.trim()).filter(Boolean) || []

    const data: ContactInsert | ContactUpdate = {
      ...(contact ? {} : { user_id: userId }),
      name: formData.get('name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      category: formData.get('category') as any,
      frequency_goal: frequencyGoal as any,
      custom_frequency_days: frequencyGoal === 'custom' ? customFrequencyDays : null,
      birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
      tags,
      notes: formData.get('notes') as string || null,
    }

    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save contact:', error)
      alert('Failed to save contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {contact ? 'Update contact information' : 'Add a new person to your network'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={contact?.name}
                required
                placeholder="John Doe"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={contact?.email || ''}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={contact?.phone || ''}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Category and Frequency Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={contact?.category || 'other'} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency_goal">Contact Frequency *</Label>
                <Select 
                  value={frequencyGoal}
                  onValueChange={(value) => setFrequencyGoal(value)}
                  required
                >
                  <SelectTrigger>
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

            {/* Custom Frequency Days (only show if custom selected) */}
            {frequencyGoal === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom_frequency_days">Custom Frequency (days) *</Label>
                <Input
                  id="custom_frequency_days"
                  name="custom_frequency_days"
                  type="number"
                  min="1"
                  value={customFrequencyDays || ''}
                  onChange={(e) => setCustomFrequencyDays(parseInt(e.target.value))}
                  required
                  placeholder="e.g., 45"
                />
              </div>
            )}

            {/* Birthday */}
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthday && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthday ? format(birthday, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={setBirthday}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={contact?.tags?.join(', ')}
                placeholder="Work, Friend, Investor (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={contact?.notes || ''}
                placeholder="Add any relevant notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
