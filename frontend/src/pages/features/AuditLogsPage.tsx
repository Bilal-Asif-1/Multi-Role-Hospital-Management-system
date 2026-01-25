import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../../services/api'
import { Activity, Filter, Search, Download, Eye, X, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { NavigationChip } from '../../components/NavigationChip'
import { format } from 'date-fns'

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    startDate: '',
    endDate: '',
  })
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.getLogs(filters),
  })

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    REGISTER: 'bg-indigo-100 text-indigo-800',
    VIEW: 'bg-yellow-100 text-yellow-800',
    GET: 'bg-yellow-100 text-yellow-800',
    POST: 'bg-blue-100 text-blue-800',
    PATCH: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
  }

  const handleViewDetails = (log: any) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const handleExport = () => {
    if (!logs || logs.length === 0) {
      alert('No logs to export')
      return
    }

    const csvHeaders = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address']
    const csvRows = logs.map((log: any) => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      log.userEmail || 'System',
      log.action,
      log.entityType,
      log.entityId || '',
      log.description || '',
      log.ipAddress || '',
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEntityLink = (entityType: string, entityId?: string) => {
    if (!entityId) return null

    const routes: Record<string, string> = {
      User: `/admin/users`,
      Patient: `/admin/patients`,
      Doctor: `/admin/doctors`,
      Nurse: `/admin/nurses`,
      Appointment: `/admin/appointments`,
      Room: `/admin/rooms`,
      Invoice: `/admin/invoices`,
    }

    const route = routes[entityType]
    return route ? `${route}?id=${entityId}` : null
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Audit Logs</h1>
          <p className="text-black font-bold mt-1">System activity and audit trail</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors flex items-center"
          >
            <Download className="h-5 w-5 mr-2" /> Export CSV
          </button>
          <Activity className="h-8 w-8 text-black" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-black mr-2" />
          <h2 className="text-lg font-bold text-black">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            >
              <option value="">All</option>
              <option value="User">User</option>
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Appointment">Appointment</option>
              <option value="Room">Room</option>
              <option value="Bed">Bed</option>
              <option value="VisitNote">Visit Note</option>
              <option value="Prescription">Prescription</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            >
              <option value="">All</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="REGISTER">Register</option>
              <option value="VIEW">View</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-black font-bold">Loading audit logs...</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => {
                    const entityLink = getEntityLink(log.entityType, log.entityId)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">
                          {log.userEmail || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              actionColors[log.action] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-bold text-black">{log.entityType}</span>
                            {log.entityId && (
                              <NavigationChip
                                entityType={log.entityType}
                                entityId={log.entityId}
                                label={log.entityId.substring(0, 8)}
                                className="text-xs"
                              />
                            )}
                            {log.relatedEntityId && log.relatedEntityType && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <LinkIcon className="h-3 w-3" />
                                <NavigationChip
                                  entityType={log.relatedEntityType}
                                  entityId={log.relatedEntityId}
                                  label={log.relatedEntityType}
                                  className="text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-black">
                          {log.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-black font-bold">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">Audit Log Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedLog(null)
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-600">Timestamp</p>
                  <p className="text-black font-bold">
                    {format(new Date(selectedLog.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">User</p>
                  <p className="text-black font-bold">{selectedLog.userEmail || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Action</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                      actionColors[selectedLog.action] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Entity Type</p>
                  <p className="text-black font-bold">{selectedLog.entityType}</p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <p className="text-sm font-bold text-gray-600">Entity ID</p>
                    <p className="text-black font-bold font-mono text-sm">{selectedLog.entityId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-600">IP Address</p>
                  <p className="text-black font-bold">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>
              {selectedLog.description && (
                <div>
                  <p className="text-sm font-bold text-gray-600">Description</p>
                  <p className="text-black">{selectedLog.description}</p>
                </div>
              )}
              {selectedLog.changes && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Changes</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm text-black overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Metadata</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm text-black overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm font-bold text-gray-600">User Agent</p>
                  <p className="text-black text-sm">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
