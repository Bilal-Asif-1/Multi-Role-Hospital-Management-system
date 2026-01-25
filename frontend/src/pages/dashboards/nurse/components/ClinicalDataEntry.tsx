import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vitalsApi } from '../../../../services/api'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClinicalDataEntryProps {
  patients: any[]
  queryClient: any
  userId: string
}

export default function ClinicalDataEntry({
  patients,
  queryClient,
  userId,
}: ClinicalDataEntryProps) {
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [vitalsData, setVitalsData] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    notes: '',
  })

  const vitalsMutation = useMutation({
    mutationFn: vitalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals'] })
      toast.success('Vitals recorded successfully')
      setShowVitalsModal(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to record vitals')
    },
  })

  const resetForm = () => {
    setSelectedPatient('')
    setVitalsData({
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      notes: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    vitalsMutation.mutate({
      patientId: selectedPatient,
      ...vitalsData,
      heartRate: vitalsData.heartRate ? parseInt(vitalsData.heartRate) : undefined,
      temperature: vitalsData.temperature ? parseFloat(vitalsData.temperature) : undefined,
      oxygenSaturation: vitalsData.oxygenSaturation ? parseFloat(vitalsData.oxygenSaturation) : undefined,
      weight: vitalsData.weight ? parseFloat(vitalsData.weight) : undefined,
      height: vitalsData.height ? parseFloat(vitalsData.height) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Clinical Data Entry</h2>
        <button
          onClick={() => setShowVitalsModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Vitals
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Patient Vitals</h3>
        <p className="text-gray-600">
          Record vital signs including Blood Pressure, Heart Rate, Temperature, SpO2, Weight, and Height.
        </p>
      </div>

      {showVitalsModal && (
        <VitalsModal
          patients={patients}
          selectedPatient={selectedPatient}
          vitalsData={vitalsData}
          onPatientChange={setSelectedPatient}
          onVitalsChange={setVitalsData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowVitalsModal(false)
            resetForm()
          }}
          loading={vitalsMutation.isPending}
        />
      )}
    </div>
  )
}

function VitalsModal({
  patients,
  selectedPatient,
  vitalsData,
  onPatientChange,
  onVitalsChange,
  onSubmit,
  onClose,
  loading,
}: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Record Vitals</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
            <select
              required
              value={selectedPatient}
              onChange={(e) => onPatientChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Patient</option>
              {patients?.map((p: any) => (
                <option key={p.id} value={p.userId}>
                  {p.user?.firstName} {p.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure (e.g., 120/80)</label>
              <input
                type="text"
                value={vitalsData.bloodPressure}
                onChange={(e) => onVitalsChange({ ...vitalsData, bloodPressure: e.target.value })}
                placeholder="120/80"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitalsData.heartRate}
                onChange={(e) => onVitalsChange({ ...vitalsData, heartRate: e.target.value })}
                placeholder="72"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsData.temperature}
                onChange={(e) => onVitalsChange({ ...vitalsData, temperature: e.target.value })}
                placeholder="36.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Saturation (SpO2 %)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsData.oxygenSaturation}
                onChange={(e) => onVitalsChange({ ...vitalsData, oxygenSaturation: e.target.value })}
                placeholder="98"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsData.weight}
                onChange={(e) => onVitalsChange({ ...vitalsData, weight: e.target.value })}
                placeholder="70"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsData.height}
                onChange={(e) => onVitalsChange({ ...vitalsData, height: e.target.value })}
                placeholder="170"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={vitalsData.notes}
              onChange={(e) => onVitalsChange({ ...vitalsData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Additional observations..."
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Vitals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



