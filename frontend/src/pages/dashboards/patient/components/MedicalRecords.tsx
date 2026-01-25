import { FileText, Calendar, Stethoscope, Heart, AlertCircle, Shield, User, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface MedicalRecordsProps {
  visitNotes: any[]
  patient: any
}

export default function MedicalRecords({ visitNotes, patient }: MedicalRecordsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Medical Record Access</h2>

      {/* Patient Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-black rounded-lg p-3">
            <User className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black">Patient Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient?.bloodGroup && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-bold text-black mb-1">Blood Group</p>
              <p className="text-lg font-bold text-black">{patient.bloodGroup}</p>
            </div>
          )}
          {patient?.dateOfBirth && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-bold text-black mb-1">Date of Birth</p>
              <p className="text-lg font-bold text-black">
                {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {patient?.gender && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-bold text-black mb-1">Gender</p>
              <p className="text-lg font-bold text-black">{patient.gender}</p>
            </div>
          )}
        </div>
      </div>

      {/* Allergies & Immunizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allergies Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-black rounded-lg p-3">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-black">Allergies</h3>
          </div>
          {patient?.allergies ? (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-black font-bold">{patient.allergies}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
              <AlertCircle className="h-12 w-12 text-black mx-auto mb-2" />
              <p className="text-black font-bold">No known allergies</p>
              <p className="text-sm text-black mt-1">No allergies have been recorded</p>
            </div>
          )}
        </div>

        {/* Immunizations Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-black rounded-lg p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-black">Immunizations</h3>
          </div>
          {patient?.immunizations ? (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-black font-bold whitespace-pre-line">{patient.immunizations}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
              <Shield className="h-12 w-12 text-black mx-auto mb-2" />
              <p className="text-black font-bold">No immunization records</p>
              <p className="text-sm text-black mt-1">Contact your healthcare provider to update records</p>
            </div>
          )}
        </div>
      </div>

      {/* Treatment History */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-black rounded-lg p-3">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black">Treatment History</h3>
        </div>
        {visitNotes && visitNotes.length > 0 ? (
          <div className="space-y-4">
            {visitNotes.map((note: any) => (
              <div key={note.id} className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-black" />
                    <div>
                      <p className="font-bold text-black">
                        {format(new Date(note.visitDate), 'MMMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-black flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1 text-black" />
                        {note.doctor?.user?.firstName} {note.doctor?.user?.lastName}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    Visit
                  </span>
                </div>
                {note.chiefComplaint && (
                  <div className="mb-3">
                    <p className="text-sm font-bold text-black mb-1">Chief Complaint:</p>
                    <p className="text-sm text-black bg-white rounded p-2">{note.chiefComplaint}</p>
                  </div>
                )}
                {note.diagnosis && (
                  <div className="mb-3">
                    <p className="text-sm font-bold text-black mb-1">Diagnosis:</p>
                    <p className="text-sm text-black bg-white rounded p-2">{note.diagnosis}</p>
                  </div>
                )}
                {note.treatmentPlan && (
                  <div className="mb-3">
                    <p className="text-sm font-bold text-black mb-1">Treatment Plan:</p>
                    <p className="text-sm text-black bg-white rounded p-2">{note.treatmentPlan}</p>
                  </div>
                )}
                {note.notes && (
                  <div>
                    <p className="text-sm font-bold text-black mb-1">Clinical Notes:</p>
                    <p className="text-sm text-black bg-white rounded p-2">{note.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
            <FileText className="h-16 w-16 text-black mx-auto mb-4" />
            <p className="text-black font-bold text-lg">No treatment history available</p>
            <p className="text-sm text-black mt-2">Your treatment history will appear here after your first visit</p>
          </div>
        )}
      </div>

      {/* Diagnoses Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-black rounded-lg p-3">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black">Diagnoses Timeline</h3>
        </div>
        {visitNotes && visitNotes.length > 0 && visitNotes.some((note: any) => note.diagnosis) ? (
          <div className="space-y-4">
            {visitNotes
              .filter((note: any) => note.diagnosis)
              .map((note: any, index: number) => (
                <div key={note.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-green-500 rounded-full p-2">
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                    {index < visitNotes.filter((n: any) => n.diagnosis).length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-black" />
                      <p className="text-sm font-bold text-black">
                        {format(new Date(note.visitDate), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="text-black font-bold">{note.diagnosis}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
            <Stethoscope className="h-16 w-16 text-black mx-auto mb-4" />
            <p className="text-black font-bold text-lg">No diagnoses recorded</p>
            <p className="text-sm text-black mt-2">Diagnoses will appear here after consultation</p>
          </div>
        )}
      </div>
    </div>
  )
}
