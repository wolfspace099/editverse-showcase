"use client"

import { useState, useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  Eye,
  ExternalLink,
  Calendar,
  Mail
} from "lucide-react"
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  getApplicationStats,
  type Application
} from "@/lib/supabaseApi"

export default function ApplicationsManagement({ adminUserId }: { adminUserId: string }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  useEffect(() => {
    loadApplications()
    loadStats()
  }, [filter])

  async function loadApplications() {
    setLoading(true)
    const { data } = await getAllApplications(
      filter === 'all' ? undefined : filter
    )
    if (data) {
      setApplications(data)
    }
    setLoading(false)
  }

  async function loadStats() {
    const statsData = await getApplicationStats()
    setStats(statsData)
  }

  async function handleApprove(applicationId: string) {
    if (!confirm('Approve this application?')) return

    await approveApplication(applicationId, adminUserId)
    loadApplications()
    loadStats()
    setSelectedApp(null)
  }

  async function handleReject(applicationId: string) {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    await rejectApplication(applicationId, adminUserId, rejectionReason)
    loadApplications()
    loadStats()
    setSelectedApp(null)
    setRejectionReason('')
  }

  return (
    <div className={`${GeistSans.className} space-y-6`}>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          color="yellow"
        />
        <StatCard
          icon={UserCheck}
          label="Approved"
          value={stats.approved}
          color="green"
        />
        <StatCard
          icon={UserX}
          label="Rejected"
          value={stats.rejected}
          color="red"
        />
        <StatCard
          icon={Mail}
          label="Total"
          value={stats.total}
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className={filter === f ? 'bg-white text-black' : ''}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          No {filter !== 'all' ? filter : ''} applications found
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{app.full_name}</h3>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Experience</p>
                      <p>{app.experience_level}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Software</p>
                      <p className="truncate">
                        {app.editing_software?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Submitted</p>
                      <p>{new Date(app.submitted_at).toLocaleDateString()}</p>
                    </div>
                    {app.reviewed_at && (
                      <div>
                        <p className="text-white/40 text-xs mb-1">Reviewed</p>
                        <p>{new Date(app.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {app.status === 'pending' && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                        onClick={() => handleApprove(app.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => setSelectedApp(app)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/10 sticky top-0 bg-black">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Application Details</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedApp(null)
                    setRejectionReason('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <DetailSection label="Name" value={selectedApp.full_name} />
              <DetailSection label="Experience Level" value={selectedApp.experience_level} />
              <DetailSection label="Why Join" value={selectedApp.why_join} />
              
              {selectedApp.portfolio_url && (
                <DetailSection 
                  label="Portfolio" 
                  value={
                    <a 
                      href={selectedApp.portfolio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white flex items-center gap-2"
                    >
                      {selectedApp.portfolio_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  } 
                />
              )}

              {selectedApp.social_links && Object.values(selectedApp.social_links).some(v => v) && (
                <div>
                  <p className="text-sm text-white/40 mb-2">Social Links</p>
                  <div className="space-y-1">
                    {selectedApp.social_links.youtube && (
                      <p className="text-sm">YouTube: {selectedApp.social_links.youtube}</p>
                    )}
                    {selectedApp.social_links.instagram && (
                      <p className="text-sm">Instagram: {selectedApp.social_links.instagram}</p>
                    )}
                    {selectedApp.social_links.twitter && (
                      <p className="text-sm">Twitter: {selectedApp.social_links.twitter}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedApp.editing_software && selectedApp.editing_software.length > 0 && (
                <DetailSection 
                  label="Editing Software" 
                  value={selectedApp.editing_software.join(', ')} 
                />
              )}

              {selectedApp.goals && (
                <DetailSection label="Goals" value={selectedApp.goals} />
              )}

              {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-200">
                    <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedApp.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Application
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (required)"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                    />
                    <Button
                      onClick={() => handleReject(selectedApp.id)}
                      variant="outline"
                      className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                      disabled={!rejectionReason.trim()}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject Application
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorClasses = {
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    red: 'text-red-400',
    gray: 'text-white/60'
  }

  return (
    <div className="p-6 border border-white/10 rounded-lg bg-white/5">
      <div className="flex items-center gap-3 mb-2">
        <Icon
          className={`h-5 w-5 ${colorClasses[color as keyof typeof colorClasses] ?? "text-gray-500"}`}
        />
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
  }

  return (
    <span className={`px-2 py-1 rounded-full border text-xs ${styles[status as keyof typeof styles]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function DetailSection({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-white/40 mb-2">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}