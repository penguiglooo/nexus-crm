"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Video, MessageSquare, Calendar, Edit, Trash2, Plus, Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { getContact, deleteContact } from '@/lib/db/contacts'
import { getContactInteractions, createInteraction } from '@/lib/db/interactions'
import { getContactReminders } from '@/lib/db/reminders'
import { ContactDialog } from '@/components/contact-dialog'
import { InteractionDialog } from '@/components/interaction-dialog'
import { getHealthColor, formatRelativeTime, formatDate, getCategoryIcon } from '@/lib/utils'
import type { ContactWithHealth, Interaction, Reminder } from '@/types/database.types'

interface ContactDetailPageProps {
  params: {
    id: string
  }
}

const getInteractionIcon = (type: string) => {
  switch (type) {
    case 'call': return <Phone className="h-4 w-4" />
    case 'meeting': return <Video className="h-4 w-4" />
    case 'message': return <MessageSquare className="h-4 w-4" />
    case 'email': return <Mail className="h-4 w-4" />
    default: return <MessageSquare className="h-4 w-4" />
  }
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const router = useRouter()
  const [contact, setContact] = useState<ContactWithHealth | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInteractionDialog, setShowInteractionDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadContact()
  }, [params.id])

  const loadContact = async () => {
    try {
      setLoading(true)
      const [contactData, interactionsData, remindersData] = await Promise.all([
        getContact(params.id),
        getContactInteractions(params.id),
        getContactReminders(params.id)
      ])
      setContact(contactData)
      setInteractions(interactionsData)
      setReminders(remindersData)
    } catch (error) {
      console.error('Failed to load contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogInteraction = async (data: any) => {
    await createInteraction(data)
    await loadContact() // Reload to get updated stats
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await deleteContact(params.id)
      router.push('/dashboard/contacts')
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4">Contact not found</p>
        <Button asChild>
          <Link href="/dashboard/contacts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/contacts">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Link>
      </Button>

      {/* Contact Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{contact.name}</h1>
                    <span className="text-2xl">{getCategoryIcon(contact.category)}</span>
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={getHealthColor(contact.health)} className="text-sm px-3 py-1">
                  {contact.health === 'healthy' ? '🟢' : contact.health === 'stale' ? '🟡' : '🔴'} {contact.health}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {contact.email && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Contact</p>
                  <p className="text-sm font-medium">
                    {contact.last_interaction_at 
                      ? formatRelativeTime(new Date(contact.last_interaction_at))
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Frequency Goal</p>
                  <p className="text-sm font-medium capitalize">{contact.frequency_goal}</p>
                </div>
              </div>

              {/* Notes */}
              {contact.notes && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{contact.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowInteractionDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Interaction
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {contact.name}? This will also delete all interactions and reminders. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No interactions yet</p>
              <Button onClick={() => setShowInteractionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Interaction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction, idx) => (
                <div key={interaction.id}>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-medium capitalize">{interaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(interaction.date)}
                            {interaction.duration_minutes && ` • ${interaction.duration_minutes} min`}
                          </p>
                        </div>
                        {interaction.quality_rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(interaction.quality_rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-muted-foreground">{interaction.notes}</p>
                      )}
                    </div>
                  </div>
                  {idx < interactions.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showEditDialog && contact && (
        <ContactDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          contact={contact}
          userId={contact.user_id}
          onSubmit={async (data) => {
            // Update contact logic here
            await loadContact()
          }}
        />
      )}

      {showInteractionDialog && (
        <InteractionDialog
          open={showInteractionDialog}
          onOpenChange={setShowInteractionDialog}
          contactId={contact.id}
          contactName={contact.name}
          onSubmit={handleLogInteraction}
        />
      )}
    </div>
  )
}
