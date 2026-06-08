import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser } from '../../api/admin.api'
import { Search, ShieldCheck, UserX } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'
import toast from 'react-hot-toast'
import { useDebounce } from '../../hooks/useDebounce'

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => getUsers(debouncedSearch),
  })

  const { mutate: update } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated')
    },
    onError: () => toast.error('Update failed'),
  })

  const users = data?.users || data?.data || []

  return (
    <>
      <Helmet><title>User Management — MakaziHub Admin</title></Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900 mb-6">User Management</h1>

        <div className="mb-5 max-w-sm">
          <Input
            placeholder="Search by name or email..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? <PageSpinner /> : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            No users found
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={u.role === 'admin' ? 'purple' : u.role === 'agency' ? 'blue' : 'gray'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{u.phone}</td>
                    <td className="px-5 py-4 text-gray-500">{u.created_at ? formatDate(u.created_at) : '—'}</td>
                    <td className="px-5 py-4">
                      {u.suspended ? (
                        <Badge variant="red">Suspended</Badge>
                      ) : u.verified_phone ? (
                        <Badge variant="green">Verified</Badge>
                      ) : (
                        <Badge variant="amber">Unverified</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        {!u.id_verified && (
                          <button
                            onClick={() => update({ id: u.id, data: { id_verified: true } })}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Verify ID"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => update({ id: u.id, data: { suspended: !u.suspended } })}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.suspended
                              ? 'text-gray-400 hover:text-primary hover:bg-primary/10'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title={u.suspended ? 'Unsuspend' : 'Suspend'}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
