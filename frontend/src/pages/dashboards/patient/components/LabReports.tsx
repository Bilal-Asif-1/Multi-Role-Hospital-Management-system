import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FlaskConical, Download, FileText, Plus, X, Upload, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { labRecordsApi } from '../../../../services/api'
import toast from 'react-hot-toast'

interface LabReportsProps {
  labRecords: any[]
}

export default function LabReports({ labRecords }: LabReportsProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    results: '',
    notes: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      let fileData = null
      if (selectedFile) {
        // Convert file to base64
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })
      }

      return labRecordsApi.create({
        ...data,
        fileData: fileData ? fileData.split(',')[1] : null, // Remove data URL prefix
        fileName: selectedFile?.name || null,
        fileType: selectedFile?.type || null,
        fileSize: selectedFile?.size || null,
        status: 'COMPLETED', // Patient uploaded reports are marked as completed
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-records'] })
      setShowAddModal(false)
      setFormData({
        testName: '',
        testDate: new Date().toISOString().split('T')[0],
        results: '',
        notes: '',
      })
      setSelectedFile(null)
      setFilePreview(null)
      toast.success('Lab report added successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add lab report')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: labRecordsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-records'] })
      toast.success('Lab report deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete lab report')
    },
  })

  const handleDelete = (labId: string) => {
    if (window.confirm('Are you sure you want to delete this lab report? This action cannot be undone.')) {
      deleteMutation.mutate(labId)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Accept major file types: PDF, Images (JPG, PNG, GIF), Documents (DOC, DOCX), etc.
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid file (PDF, Image, or Document)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.testName.trim()) {
      toast.error('Please enter test name')
      return
    }
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }
    createMutation.mutate(formData)
  }

  const handleDownload = (lab: any) => {
    if (lab.attachments && lab.attachments.length > 0) {
      const attachment = lab.attachments[0]
      // If filePath is base64, decode and download
      if (attachment.filePath) {
        const link = document.createElement('a')
        link.href = `data:${attachment.fileType || 'application/octet-stream'};base64,${attachment.filePath}`
        link.download = attachment.fileName || 'lab-report'
        link.click()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Lab Reports</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Report
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="space-y-4">
          {labRecords && labRecords.length > 0 ? (
            labRecords.map((lab: any) => (
              <div key={lab.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FlaskConical className="h-5 w-5 text-black" />
                      <h3 className="font-bold text-black">{lab.testName}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        lab.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lab.status || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-black">
                      Test Date: {format(new Date(lab.testDate), 'MMM dd, yyyy')}
                    </p>
                    {lab.results && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm font-bold text-black mb-1">Results:</p>
                        <p className="text-sm text-black">{lab.results}</p>
                      </div>
                    )}
                    {lab.notes && (
                      <div className="mt-2">
                        <p className="text-sm font-bold text-black">Doctor Comments:</p>
                        <p className="text-sm text-black italic">{lab.notes}</p>
                      </div>
                    )}
                    {lab.orderedBy && (
                      <p className="text-xs text-black mt-2">
                        Ordered by: {lab.orderedBy}
                      </p>
                    )}
                    {lab.attachments && lab.attachments.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-black" />
                        <span className="text-sm text-black">
                          Report file attached
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {lab.attachments && lab.attachments.length > 0 && (
                      <button
                        onClick={() => handleDownload(lab)}
                        className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(lab.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete lab report"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-black mx-auto mb-3" />
              <p className="text-black font-bold">No lab reports available</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">Add Lab Report</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({
                    testName: '',
                    testDate: new Date().toISOString().split('T')[0],
                    results: '',
                    notes: '',
                  })
                  setSelectedFile(null)
                  setFilePreview(null)
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Test Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                  placeholder="e.g., Blood Test, X-Ray, MRI"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Test Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.testDate}
                  onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Results (Optional)
                </label>
                <textarea
                  value={formData.results}
                  onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black resize-none"
                  placeholder="Enter test results if available"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Report File *
                </label>
                {selectedFile ? (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-black" />
                        <div>
                          <p className="text-sm font-bold text-black">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          setFilePreview(null)
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-black mb-2" />
                      <p className="mb-2 text-sm font-bold text-black">
                        Click to upload report file
                      </p>
                      <p className="text-xs text-gray-500">PDF, Images, Documents (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black resize-none"
                  placeholder="Additional notes or comments"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      testName: '',
                      testDate: new Date().toISOString().split('T')[0],
                      results: '',
                      notes: '',
                    })
                    setSelectedFile(null)
                    setFilePreview(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

