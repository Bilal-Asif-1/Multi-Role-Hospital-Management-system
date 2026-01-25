import { Printer, X } from 'lucide-react'
import { format } from 'date-fns'

interface RegistrationPrintReceiptProps {
  registrationData: {
    patient: any
    appointment?: any
    bedAssignment?: any
    formData: any
  }
  onClose: () => void
}

export function RegistrationPrintReceipt({ registrationData, onClose }: RegistrationPrintReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  const { patient, appointment, bedAssignment, formData } = registrationData

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-black">Registration Receipt</h2>
              <p className="text-sm text-gray-500">Print or save this receipt</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button 
                onClick={() => {
                  // Receipt is already saved when created, just close
                  onClose()
                }} 
                className="text-black font-bold hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Print Content */}
          <div className="p-6 print-content">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-bold text-black">HOSPITAL REGISTRATION RECEIPT</h1>
              <p className="text-sm text-gray-600 mt-2">
                Registration Date: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>

            {/* Patient Information */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-4 border-b border-gray-300 pb-2">
                Patient Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-bold text-black">
                    {patient?.user?.firstName} {patient?.user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-bold text-black">{patient?.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-bold text-black">{patient?.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNIC</p>
                  <p className="text-lg font-bold text-black">{formData?.user?.cnic || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="text-lg font-bold text-black">{patient?.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-lg font-bold text-black">
                    {patient?.dateOfBirth
                      ? format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blood Group</p>
                  <p className="text-lg font-bold text-black">{patient?.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient ID</p>
                  <p className="text-lg font-bold text-black">{patient?.id}</p>
                </div>
              </div>
              {patient?.allergies && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Allergies</p>
                  <p className="text-lg font-bold text-black">{patient.allergies}</p>
                </div>
              )}
              {patient?.medicalHistory && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Medical History</p>
                  <p className="text-lg font-bold text-black">{patient.medicalHistory}</p>
                </div>
              )}
            </div>

            {/* Appointment Information */}
            {appointment && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-black mb-4 border-b border-gray-300 pb-2">
                  Appointment Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="text-lg font-bold text-black">
                      {appointment.doctor
                        ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="text-lg font-bold text-black">
                      {formData?.appointment?.specialization || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Appointment Date</p>
                    <p className="text-lg font-bold text-black">
                      {appointment.appointmentDate
                        ? format(new Date(appointment.appointmentDate), 'dd/MM/yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Appointment Time</p>
                    <p className="text-lg font-bold text-black">
                      {appointment.appointmentTime || 'N/A'}
                    </p>
                  </div>
                  {appointment.reason && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Reason / Concern</p>
                      <p className="text-lg font-bold text-black">{appointment.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bed Assignment */}
            {bedAssignment && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-black mb-4 border-b border-gray-300 pb-2">
                  Admission Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="text-lg font-bold text-black">
                      {bedAssignment.bed?.room?.name ||
                        (bedAssignment.bed?.room?.roomNumber
                          ? `Room ${bedAssignment.bed.room.roomNumber}`
                          : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bed</p>
                    <p className="text-lg font-bold text-black">
                      {bedAssignment.bed?.label ? `Bed ${bedAssignment.bed.label}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned Date</p>
                    <p className="text-lg font-bold text-black">
                      {bedAssignment.assignedAt
                        ? format(new Date(bedAssignment.assignedAt), 'dd/MM/yyyy HH:mm')
                        : format(new Date(), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-bold text-black">
                      {bedAssignment.status || 'ACTIVE'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-black text-center">
              <p className="text-sm text-gray-600">
                This is a system-generated receipt. Please keep this for your records.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                For any queries, please contact the hospital administration.
              </p>
            </div>
          </div>

          {/* Print Styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content,
              .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
              }
              button {
                display: none !important;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}

