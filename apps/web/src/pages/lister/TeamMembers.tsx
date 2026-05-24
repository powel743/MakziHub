import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Users, Plus, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inviteMember } from '../../api/agencies.api'
import client from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function TeamMembers() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const plan = user?.lister_profile?.plan || 'free'
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')

  const agencyId = (user as any)?.lister_profile?.agency_id

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      if (!agencyId) return []
      const res = await client.get(`/agencies/${agencyId}/members`)
      return res.data.members || res.data.data || []
    },
    enabled: plan === 'business',
  })

  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: () => inviteMember(agencyId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      toast.success(`Invite sent to ${email}`)
      setEmail('')
      setShowInvite(false)
    },
    onError: () => toast.error('Could not send invite'),
  })

  if (plan !== 'business') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Team Members is a Business feature</h2>
        <p className="text-gray-500 mb-6">Add agents and team members to manage listings together. Available on the Business plan.</p>
        <Link to="/lister/billing" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          Upgrade to Business
        </Link>
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Team Members — MakaziHub</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-900">Team Members</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage who can post listings on behalf of your agency</p>
          </div>
          <Button onClick={() => setShowInvite(true)} size="sm">
            <Plus className="w-4 h-4" /> Invite Member
          </Button>
        </div>

        {isLoading ? null : members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">No team members yet</h2>
            <p className="text-gray-500 text-sm mb-5">Invite agents to post listings under your agency.</p>
            <Button onClick={() => setShowInvite(true)} size="sm"><Plus className="w-4 h-4" /> Invite Member</Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {(m.name || m.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.name || '—'}</p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize">{m.role || 'agent'}</td>
                    <td className="px-5 py-4 text-gray-500">{m.created_at ? formatDate(m.created_at) : '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.accepted ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">They'll receive an email invitation to join your agency.</p>
          <Input
            label="Email Address"
            type="email"
            placeholder="agent@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={() => setShowInvite(false)} variant="ghost" fullWidth>Cancel</Button>
            <Button onClick={() => invite()} loading={inviting} disabled={!email} fullWidth>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
