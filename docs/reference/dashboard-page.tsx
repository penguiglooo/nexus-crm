import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Users, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getContactsNeedingAttention, getUpcomingBirthdays } from '@/lib/db/contacts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, getHealthColor, formatDate } from '@/lib/utils'
import Link from 'next/link'

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const [stats, needingAttention, upcomingBirthdays] = await Promise.all([
    getDashboardStats(user.id),
    getContactsNeedingAttention(user.id, 10),
    getUpcomingBirthdays(user.id, 30)
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your relationship intelligence at a glance
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contacts/new">Add Contact</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
            <p className="text-xs text-muted-foreground">
              On track with frequency goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.stale + stats.neglected}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.stale} stale, {stats.neglected} neglected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Birthdays Soon</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {upcomingBirthdays.length}
            </div>
            <p className="text-xs text-muted-foreground">
              In the next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔴 Needs Attention
            </CardTitle>
            <CardDescription>
              Contacts you haven't reached out to in a while
            </CardDescription>
          </CardHeader>
          <CardContent>
            {needingAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Great work! All your relationships are healthy 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {needingAttention.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/dashboard/contacts/${contact.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.days_since_contact} days since contact
                        </p>
                      </div>
                    </div>
                    <Badge variant={getHealthColor(contact.health)}>
                      {contact.health === 'stale' ? '🟡' : '🔴'}
                    </Badge>
                  </Link>
                ))}
                {needingAttention.length >= 10 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/contacts?filter=needs-attention">
                      View All
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎂 Upcoming Birthdays
            </CardTitle>
            <CardDescription>
              Birthdays in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming birthdays in the next 30 days
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/dashboard/contacts/${contact.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.birthday && formatDate(contact.birthday)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 flex-shrink-0">
                      in {contact.days_until_birthday}d
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
