"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Phone, Video, MessageSquare, Mail, Star } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { INTERACTION_TYPES } from "@/lib/constants"
import type { InteractionInsert } from "@/types/database.types"

interface InteractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InteractionInsert) => Promise<void>
  contactId: string
  contactName: string
}

const typeIcons = {
  call: Phone,
  meeting: Video,
  message: MessageSquare,
  email: Mail,
  other: MessageSquare,
}

export function InteractionDialog({ open, onOpenChange, onSubmit, contactId, contactName }: InteractionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<'call' | 'meeting' | 'message' | 'email' | 'other'>('call')
  const [date, setDate] = useState<Date>(new Date())
  const [qualityRating, setQualityRating] = useState<number>(3)
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const data: InteractionInsert = {
      contact_id: contactId,
      type: selectedType,
      date: format(date, 'yyyy-MM-dd'),
      duration_minutes: durationMinutes || null,
      quality_rating: qualityRating,
      notes: formData.get('notes') as string || null,
    }

    try {
      await onSubmit(data)
      onOpenChange(false)
      // Reset form
      setSelectedType('call')
      setDate(new Date())
      setQualityRating(3)
      setDurationMinutes(undefined)
    } catch (error) {
      console.error('Failed to log interaction:', error)
      alert('Failed to log interaction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
            <DialogDescription>
              Record a conversation or meeting with {contactName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Interaction Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INTERACTION_TYPES.map((type) => {
                  const Icon = typeIcons[type.value]
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant={selectedType === type.value ? "default" : "outline"}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                      onClick={() => setSelectedType(type.value)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration (optional) */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="duration"
                  min="0"
                  value={durationMinutes || ''}
                  onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="30"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                How long did the interaction last?
              </p>
            </div>

            {/* Quality Rating */}
            <div className="space-y-2">
              <Label>Quality Rating *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setQualityRating(rating)}
                    className="transition-colors"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        rating <= qualityRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                How valuable was this interaction?
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="What did you discuss? Any key takeaways or action items..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Interaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
