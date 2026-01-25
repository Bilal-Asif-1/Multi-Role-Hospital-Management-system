import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patientStatesApi, PatientState } from '../../../../../services/api'
import toast from 'react-hot-toast'

interface PatientStateActionsProps {
  patientId: string
  currentState: PatientState
}

const stateLabels: Record<PatientState, string> = {
  WAITING: 'Waiting',
  IN_APPOINTMENT: 'In Appointment',
  IN_OPERATION: 'In Operation',
  IN_WARD: 'In Ward',
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
}

const orderedStates: PatientState[] = [
  'WAITING',
  'IN_APPOINTMENT',
  'IN_OPERATION',
  'IN_WARD',
  'ADMITTED',
  'DISCHARGED',
]

export function PatientStateActions({ patientId, currentState }: PatientStateActionsProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (toState: PatientState) =>
      patientStatesApi.transition({ patientId, toState }),
    onSuccess: () => {
      toast.success('Patient state updated')
      queryClient.invalidateQueries({ queryKey: ['patient-overview', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient-states-history', patientId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Unable to change patient state')
    },
  })

  const availableStates = useMemo(
    () => orderedStates.filter((state) => state !== currentState),
    [currentState],
  )

  return (
    <div className="flex flex-wrap gap-2">
      {availableStates.map((state) => (
        <button
          key={state}
          onClick={() => mutation.mutate(state)}
          disabled={mutation.isPending}
          className={`px-3 py-1 rounded-full text-sm font-bold border transition-colors ${
            state === currentState
              ? 'bg-black text-white border-black'
              : 'text-black border-black hover:bg-black hover:text-white'
          }`}
        >
          {stateLabels[state]}
        </button>
      ))}
    </div>
  )
}