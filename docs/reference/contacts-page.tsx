import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getContacts, searchContacts, getContactsByHealth } from '@/lib/db/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getHealthColor, formatRelativeTime, getCategoryIcon } from '@/lib/utils'

interface ContactsPageProps {
  searchParams: {
    q?: string
    filter?: string
  }
}

async function ContactsContent({ searchParams }: ContactsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const query = searchParams.q
  const filter = searchParams.filter

  let contacts
  
  if (query) {
    contacts = await searchContacts(user.id, query)
  } else if (filter === 'needs-attention') {
    const [stale, neglected] = await Promise.all([
      getContactsByHealth(user.id, 'stale'),
      getContactsByHealth(user.id, 'neglected')
    ])
    contacts = [...neglected, ...stale]
  } else if (filter === 'healthy') {
    contacts = await getContactsByHealth(user.id, 'healthy')
  } else if (filter === 'stale') {
    contacts = await getContactsByHealth(user.id, 'stale')
  } else if (filter === 'neglected') {
    contacts = await getContactsByHealth(user.id, 'neglected')
  } else {
    contacts = await getContacts(user.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your network of {contacts.length} contacts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            defaultValue={query}
            className="pl-9"
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search)
              if (e.target.value) {
                params.set('q', e.target.value)
              } else {
                params.delete('q')
              }
              window.history.pushState({}, '', `?${params.toString()}`)
            }}
          />
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue={filter || 'all'} className="w-full">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/dashboard/contacts">All</Link>
          </TabsTrigger>
          <TabsTrigger value="healthy" asChild>
            <Link href="/dashboard/contacts?filter=healthy">Healthy</Link>
          </TabsTrigger>
          <TabsTrigger value="stale" asChild>
            <Link href="/dashboard/contacts?filter=stale">Stale</Link>
          </TabsTrigger>
          <TabsTrigger value="neglected" asChild>
            <Link href="/dashboard/contacts?filter=neglected">Neglected</Link>
          </TabsTrigger>
          <TabsTrigger value="needs-attention" asChild>
            <Link href="/dashboard/contacts?filter=needs-attention">Needs Attention</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">
              {query ? `No contacts found for "${query}"` : 'No contacts yet'}
            </p>
            {!query && (
              <Button asChild>
                <Link href="/dashboard/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Contact
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                            {contact.name}
                          </h3>
                          <span className="text-lg flex-shrink-0">
                            {getCategoryIcon(contact.category)}
                          </span>
                        </div>
                        <Badge variant={getHealthColor(contact.health)}>
                          {contact.health === 'healthy' ? '🟢' : contact.health === 'stale' ? '🟡' : '🔴'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Last: {contact.last_interaction_at 
                          ? formatRelativeTime(new Date(contact.last_interaction_at))
                          : 'Never'}
                      </p>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContactsPage(props: ContactsPageProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <ContactsContent {...props} />
    </Suspense>
  )
}
