import { Pill, Calendar, Printer, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface PrescriptionsViewProps {
  prescriptions: any[]
}

export default function PrescriptionsView({ prescriptions }: PrescriptionsViewProps) {
  const activePrescriptions = prescriptions?.filter((pres: any) => {
    if (!pres.validUntil) return true
    return new Date(pres.validUntil) >= new Date()
  }) || []

  const pastPrescriptions = prescriptions?.filter((pres: any) => {
    if (!pres.validUntil) return false
    return new Date(pres.validUntil) < new Date()
  }) || []

  const handlePrint = (pres: any) => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Prescriptions</h2>

      {/* Grid Layout for Active and Past Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center">
            <Pill className="h-5 w-5 mr-2 text-black" />
            Active Prescriptions
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {activePrescriptions.length > 0 ? (
              activePrescriptions.map((pres: any) => (
                <div key={pres.id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="h-5 w-5 text-black" />
                        <h4 className="font-bold text-black">Prescription #{pres.id.substring(0, 8)}</h4>
                        {pres.validUntil && new Date(pres.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-black mb-2">
                        Prescribed: {format(new Date(pres.prescribedDate), 'MMM dd, yyyy')}
                      </p>
                      {pres.validUntil && (
                        <p className="text-sm font-bold text-black">
                          Valid until: {format(new Date(pres.validUntil), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {pres.medications && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <p className="text-sm font-bold text-black mb-2">Medications:</p>
                          {Array.isArray(pres.medications) ? (
                            <ul className="space-y-1">
                              {pres.medications.map((med: any, idx: number) => (
                                <li key={idx} className="text-sm text-black">
                                  • {med.name} - {med.dosage} {med.frequency && `(${med.frequency})`}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-black">{JSON.stringify(pres.medications)}</p>
                          )}
                        </div>
                      )}
                      {pres.instructions && (
                        <div className="mt-2">
                          <p className="text-sm font-bold text-black">Instructions:</p>
                          <p className="text-sm text-black">{pres.instructions}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePrint(pres)}
                      className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm ml-4"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-black font-bold py-8">No active prescriptions</p>
            )}
          </div>
        </div>

        {/* Past Prescriptions */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-black" />
            Past Prescriptions
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {pastPrescriptions.length > 0 ? (
              pastPrescriptions.map((pres: any) => (
                <div key={pres.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="h-5 w-5 text-black" />
                        <h4 className="font-bold text-black">Prescription #{pres.id.substring(0, 8)}</h4>
                      </div>
                      <p className="text-sm font-bold text-black">
                        Prescribed: {format(new Date(pres.prescribedDate), 'MMM dd, yyyy')}
                      </p>
                      {pres.validUntil && (
                        <p className="text-sm font-bold text-black">
                          Expired: {format(new Date(pres.validUntil), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {pres.medications && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <p className="text-sm font-bold text-black mb-2">Medications:</p>
                          {Array.isArray(pres.medications) ? (
                            <ul className="space-y-1">
                              {pres.medications.map((med: any, idx: number) => (
                                <li key={idx} className="text-sm text-black">
                                  • {med.name} - {med.dosage} {med.frequency && `(${med.frequency})`}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-black">{JSON.stringify(pres.medications)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePrint(pres)}
                      className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm ml-4"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-black font-bold py-8">No past prescriptions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

