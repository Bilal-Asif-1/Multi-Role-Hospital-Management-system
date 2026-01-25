import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      })
    } else if (error.request) {
      console.error('API Request Error:', {
        url: error.config?.url,
        message: error.message,
      })
    } else {
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Shared hospital types
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'BOOKED' | 'MAINTENANCE' | 'CLEANING'
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE'
export type BedAssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PatientState =
  | 'WAITING'
  | 'IN_APPOINTMENT'
  | 'IN_OPERATION'
  | 'IN_WARD'
  | 'ADMITTED'
  | 'DISCHARGED'

export interface Room {
  id: string
  roomNumber: string
  name?: string
  type?: string
  floor?: string
  status: RoomStatus
  capacity: number
  notes?: string
  createdAt: string
  updatedAt: string
  beds?: Bed[]
}

export interface Bed {
  id: string
  roomId: string
  label: string
  status: BedStatus
  lastCleanedAt?: string
  createdAt: string
  updatedAt: string
  assignments?: BedAssignment[]
}

export interface BedAssignment {
  id: string
  bedId: string
  patientId: string
  doctorId?: string
  nurseId?: string
  assignedAt: string
  releasedAt?: string
  status: BedAssignmentStatus
  notes?: string
  bed?: Bed
  patient?: any
  doctor?: any
  nurse?: any
}

export interface DoctorShift {
  id: string
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  status: string
  location?: string
  createdAt: string
  updatedAt: string
}

export interface NurseShift {
  id: string
  nurseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  ward?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface PatientStateLog {
  id: string
  patientId: string
  fromState?: PatientState
  toState: PatientState
  context?: string
  createdAt: string
}

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      return data
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running.')
      }
      throw error
    }
  },
  register: async (userData: any) => {
    try {
      const { data } = await api.post('/auth/register', userData)
      return data
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running.')
      }
      throw error
    }
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/profile')
    return data
  },
}

export const patientsApi = {
  getAll: async (search?: string) => {
    const { data } = await api.get('/patients', { params: { search } })
    return data
  },
  getOverview: async (id: string) => {
    const { data } = await api.get(`/patients/${id}/overview`)
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/patients/${id}`)
    return data
  },
  getMyProfile: async () => {
    const { data } = await api.get('/patients/my-profile')
    return data
  },
  getSettings: async (id: string) => {
    const { data } = await api.get(`/patients/${id}/settings`)
    return data
  },
  create: async (patientData: any) => {
    const { data } = await api.post('/patients', patientData)
    return data
  },
  update: async (id: string, patientData: any) => {
    const { data } = await api.patch(`/patients/${id}`, patientData)
    return data
  },
  updateMyProfile: async (patientData: any) => {
    const { data } = await api.patch('/patients/my-profile', patientData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/patients/${id}`)
    return data
  },
}

export const appointmentsApi = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/appointments', { params: filters })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/appointments/${id}`)
    return data
  },
  create: async (appointmentData: any) => {
    const { data } = await api.post('/appointments', appointmentData)
    return data
  },
  update: async (id: string, appointmentData: any) => {
    const { data } = await api.patch(`/appointments/${id}`, appointmentData)
    return data
  },
  cancel: async (id: string) => {
    const { data } = await api.patch(`/appointments/${id}/cancel`)
    return data
  },
  reschedule: async (id: string, appointmentDate: string, appointmentTime: string) => {
    const { data } = await api.patch(`/appointments/${id}/reschedule`, {
      appointmentDate,
      appointmentTime,
    })
    return data
  },
}

export const visitNotesApi = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/visit-notes', { params: filters })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/visit-notes/${id}`)
    return data
  },
  create: async (noteData: any) => {
    const { data } = await api.post('/visit-notes', noteData)
    return data
  },
  update: async (id: string, noteData: any) => {
    const { data } = await api.patch(`/visit-notes/${id}`, noteData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/visit-notes/${id}`)
    return data
  },
}

export const labRecordsApi = {
  getAll: async (patientId?: string) => {
    const { data } = await api.get('/lab-records', { params: { patientId } })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/lab-records/${id}`)
    return data
  },
  create: async (labData: any) => {
    const { data } = await api.post('/lab-records', labData)
    return data
  },
  update: async (id: string, labData: any) => {
    const { data } = await api.patch(`/lab-records/${id}`, labData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/lab-records/${id}`)
    return data
  },
}

export const prescriptionsApi = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/prescriptions', { params: filters })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/prescriptions/${id}`)
    return data
  },
  create: async (prescriptionData: any) => {
    const { data } = await api.post('/prescriptions', prescriptionData)
    return data
  },
  update: async (id: string, prescriptionData: any) => {
    const { data } = await api.patch(`/prescriptions/${id}`, prescriptionData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/prescriptions/${id}`)
    return data
  },
}

export const invoicesApi = {
  getAll: async (filters?: any) => {
    const { data } = await api.get('/invoices', { params: filters })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/invoices/${id}`)
    return data
  },
  create: async (invoiceData: any) => {
    const { data } = await api.post('/invoices', invoiceData)
    return data
  },
  markAsPaid: async (id: string) => {
    const { data } = await api.patch(`/invoices/${id}/mark-paid`)
    return data
  },
}

export const doctorsApi = {
  getAll: async () => {
    const { data } = await api.get('/doctors')
    return data
  },
  getAvailable: async (params: { specialization?: string; start?: string; end?: string }) => {
    const { data } = await api.get('/doctors/available', { params })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/doctors/${id}`)
    return data
  },
  getMyProfile: async () => {
    const { data } = await api.get('/doctors/my-profile')
    return data
  },
  updateAvailability: async (availability: any[]) => {
    const { data } = await api.post('/doctors/availability', { availability })
    return data
  },
  updateAvailabilityByAdmin: async (doctorId: string, availability: any[]) => {
    const { data } = await api.post('/doctors/availability', { availability, doctorId })
    return data
  },
  getAvailability: async (doctorId: string) => {
    const { data } = await api.get(`/doctors/availability/${doctorId}`)
    return data
  },
  getWorkload: async (id: string) => {
    const { data } = await api.get(`/doctors/${id}/workload`)
    return data
  },
  getAssignedPatients: async (id: string) => {
    const { data } = await api.get(`/doctors/${id}/assigned-patients`)
    return data
  },
  update: async (id: string, doctorData: any) => {
    const { data } = await api.patch(`/doctors/${id}`, doctorData)
    return data
  },
  updateMyProfile: async (doctorData: any) => {
    const { data } = await api.patch('/doctors/my-profile', doctorData)
    return data
  },
  getSettings: async (id: string) => {
    const { data } = await api.get(`/doctors/${id}/settings`)
    return data
  },
}

export const nursesApi = {
  getAll: async () => {
    const { data } = await api.get('/nurses')
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/nurses/${id}`)
    return data
  },
  getMyProfile: async () => {
    const { data } = await api.get('/nurses/my-profile')
    return data
  },
  getWorkload: async (id: string) => {
    const { data } = await api.get(`/nurses/${id}/workload`)
    return data
  },
  getAssignedPatients: async (id: string) => {
    const { data } = await api.get(`/nurses/${id}/assigned-patients`)
    return data
  },
  update: async (id: string, nurseData: any) => {
    const { data } = await api.patch(`/nurses/${id}`, nurseData)
    return data
  },
  getSettings: async (id: string) => {
    const { data } = await api.get(`/nurses/${id}/settings`)
    return data
  },
}

export const auditApi = {
  getLogs: async (filters?: any) => {
    try {
      const { data } = await api.get('/audit/logs', { params: filters })
      return data
    } catch (error: any) {
      console.error('Error in getLogs:', error)
      if (error.response?.status === 404) {
        throw new Error('Audit logs endpoint not found. Please check if the backend server is running.')
      }
      throw error
    }
  },
  getKPIs: async () => {
    try {
      const { data } = await api.get('/audit/kpis')
      return data
    } catch (error: any) {
      console.error('Error in getKPIs:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      })
      if (error.response?.status === 404) {
        throw new Error('KPIs endpoint not found. Please check if the backend server is running and restarted after recent changes.')
      }
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please login as admin to view KPIs.')
      }
      throw error
    }
  },
  getRelatedEntities: async (entityType: string, entityId: string) => {
    try {
      const { data } = await api.get('/audit/related-entities', {
        params: { entityType, entityId },
      })
      return data
    } catch (error: any) {
      console.error('Error in getRelatedEntities:', error)
      if (error.response?.status === 404) {
        throw new Error('Related entities endpoint not found.')
      }
      throw error
    }
  },
  getAlerts: async () => {
    try {
      const { data } = await api.get('/audit/alerts')
      return data
    } catch (error: any) {
      console.error('Error in getAlerts:', error)
      if (error.response?.status === 404) {
        throw new Error('Alerts endpoint not found.')
      }
      throw error
    }
  },
}

export const usersApi = {
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.patch('/users/change-password', {
      currentPassword,
      newPassword,
    })
    return data
  },
  getAll: async (role?: string) => {
    const { data } = await api.get('/users', { params: role ? { role } : {} })
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },
  getPendingApprovals: async () => {
    try {
      const { data } = await api.get('/users/pending-approvals')
      return Array.isArray(data) ? data : []
    } catch (error: any) {
      console.error('Error in getPendingApprovals:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
      })
      
      if (error.response?.status === 401) {
        throw new Error('Please login as admin to view registration requests')
      }
      if (error.response?.status === 404) {
        throw new Error('Endpoint not found. Please check if the backend server is running and the route is registered.')
      }
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:3000')
      }
      throw error
    }
  },
  approve: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/approve`)
    return data
  },
  reject: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/reject`)
    return data
  },
  create: async (userData: any) => {
    const { data } = await api.post('/users', userData)
    return data
  },
  update: async (id: string, userData: any) => {
    const { data } = await api.patch(`/users/${id}`, userData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`)
    return data
  },
  activate: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/activate`)
    return data
  },
  deactivate: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/deactivate`)
    return data
  },
  checkAdminExists: async () => {
    const { data } = await api.get('/users/check-admin')
    return data
  },
}

export const vitalsApi = {
  create: async (vitalsData: any) => {
    const { data } = await api.post('/vitals', vitalsData)
    return data
  },
  getAll: async (patientId?: string) => {
    const { data } = await api.get('/vitals', { params: { patientId } })
    return data
  },
  getByPatient: async (patientId: string) => {
    const { data } = await api.get(`/vitals/patient/${patientId}`)
    return data
  },
  getLatest: async (patientId: string) => {
    const { data } = await api.get(`/vitals/patient/${patientId}/latest`)
    return data
  },
}

export const nursingNotesApi = {
  create: async (noteData: any) => {
    const { data } = await api.post('/nursing-notes', noteData)
    return data
  },
  getAll: async (patientId?: string) => {
    const { data } = await api.get('/nursing-notes', { params: { patientId } })
    return data
  },
  update: async (id: string, noteData: any) => {
    const { data } = await api.patch(`/nursing-notes/${id}`, noteData)
    return data
  },
}

export const tasksApi = {
  create: async (taskData: any) => {
    const { data } = await api.post('/tasks', taskData)
    return data
  },
  getAll: async (status?: string) => {
    const { data } = await api.get('/tasks', { params: { status } })
    return data
  },
  update: async (id: string, taskData: any) => {
    const { data } = await api.patch(`/tasks/${id}`, taskData)
    return data
  },
  markCompleted: async (id: string) => {
    const { data } = await api.patch(`/tasks/${id}/complete`)
    return data
  },
}

export const patientQueueApi = {
  checkIn: async (checkInData: any) => {
    const { data } = await api.post('/patient-queue/check-in', checkInData)
    return data
  },
  getAll: async (status?: string, doctorId?: string) => {
    const { data } = await api.get('/patient-queue', { params: { status, doctorId } })
    return data
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/patient-queue/${id}/status`, { status })
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/patient-queue/${id}`)
    return data
  },
}

export const notificationsApi = {
  getAll: async (unreadOnly?: boolean) => {
    const { data } = await api.get('/notifications', { params: { unreadOnly } })
    return data
  },
  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count')
    return data?.count || 0
  },
  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data
  },
  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all')
    return data
  },
}

export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const { data } = await api.get('/rooms')
    return data
  },
  getById: async (id: string): Promise<Room> => {
    const { data } = await api.get(`/rooms/${id}`)
    return data
  },
  getBeds: async (roomId: string): Promise<Bed[]> => {
    const { data } = await api.get(`/rooms/${roomId}/beds`)
    return data
  },
  getHistory: async (roomId: string): Promise<BedAssignment[]> => {
    const { data } = await api.get(`/rooms/${roomId}/history`)
    return data
  },
  create: async (roomData: Partial<Room>) => {
    const { data } = await api.post('/rooms', roomData)
    return data
  },
  updateStatus: async (roomId: string, status: RoomStatus, notes?: string) => {
    const { data } = await api.patch(`/rooms/${roomId}/status`, { status, notes })
    return data
  },
  update: async (roomId: string, roomData: Partial<Room>) => {
    const { data } = await api.patch(`/rooms/${roomId}`, roomData)
    return data
  },
  assignBed: async (payload: {
    roomId: string
    bedId?: string
    patientId: string
    doctorId?: string
    nurseId?: string
    notes?: string
  }) => {
    const { data } = await api.post('/rooms/assign', payload)
    return data
  },
  releaseBed: async (payload: { assignmentId?: string; bedId?: string; notes?: string }) => {
    const { data } = await api.post('/rooms/release', payload)
    return data
  },
  logHousekeeping: async (roomId: string, payload: { status: string; notes?: string; completedAt?: string }) => {
    const { data } = await api.post(`/rooms/${roomId}/housekeeping`, payload)
    return data
  },
  addBed: async (roomId: string, payload: { label: string }) => {
    const { data } = await api.post(`/rooms/${roomId}/beds`, payload)
    return data
  },
  deleteBed: async (bedId: string) => {
    const { data } = await api.delete(`/rooms/beds/${bedId}`)
    return data
  },
}

export const patientStatesApi = {
  transition: async (payload: { patientId: string; toState: PatientState; context?: string }) => {
    const { data } = await api.post('/patient-states/transition', payload)
    return data
  },
  getHistory: async (patientId: string): Promise<PatientStateLog[]> => {
    const { data } = await api.get(`/patient-states/${patientId}/history`)
    return data
  },
}

export interface Department {
  id: string
  name: string
  description?: string
  headDoctorId?: string
  createdAt: string
  updatedAt: string
  rooms?: Room[]
  doctors?: any[]
  nurses?: any[]
}

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const { data } = await api.get('/departments')
    return data
  },
  getById: async (id: string): Promise<Department> => {
    const { data } = await api.get(`/departments/${id}`)
    return data
  },
  getAvailableRooms: async (): Promise<Room[]> => {
    const { data } = await api.get('/departments/available-rooms')
    return data
  },
  getAvailableDoctors: async () => {
    const { data } = await api.get('/departments/available-doctors')
    return data
  },
  getAvailableNurses: async () => {
    const { data } = await api.get('/departments/available-nurses')
    return data
  },
  create: async (departmentData: Partial<Department>) => {
    const { data } = await api.post('/departments', departmentData)
    return data
  },
  update: async (id: string, departmentData: Partial<Department>) => {
    const { data } = await api.patch(`/departments/${id}`, departmentData)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/departments/${id}`)
    return data
  },
  assignRoom: async (departmentId: string, roomId: string) => {
    const { data } = await api.post(`/departments/${departmentId}/rooms`, { roomId })
    return data
  },
  removeRoom: async (departmentId: string, roomId: string) => {
    const { data } = await api.delete(`/departments/${departmentId}/rooms/${roomId}`)
    return data
  },
  assignDoctor: async (departmentId: string, doctorId: string) => {
    const { data } = await api.post(`/departments/${departmentId}/doctors`, { doctorId })
    return data
  },
  removeDoctor: async (departmentId: string, doctorId: string) => {
    const { data } = await api.delete(`/departments/${departmentId}/doctors/${doctorId}`)
    return data
  },
  assignNurse: async (departmentId: string, nurseId: string) => {
    const { data } = await api.post(`/departments/${departmentId}/nurses`, { nurseId })
    return data
  },
  removeNurse: async (departmentId: string, nurseId: string) => {
    const { data } = await api.delete(`/departments/${departmentId}/nurses/${nurseId}`)
    return data
  },
}

export const shiftsApi = {
  getDoctorShifts: async (doctorId: string): Promise<DoctorShift[]> => {
    const { data } = await api.get(`/shifts/doctors/${doctorId}`)
    return data
  },
  getNurseShifts: async (nurseId: string): Promise<NurseShift[]> => {
    const { data } = await api.get(`/shifts/nurses/${nurseId}`)
    return data
  },
  createDoctorShift: async (payload: Omit<DoctorShift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post('/shifts/doctors', payload)
    return data
  },
  createNurseShift: async (payload: Omit<NurseShift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post('/shifts/nurses', payload)
    return data
  },
  updateDoctorShiftStatus: async (id: string, status: string) => {
    const { data } = await api.post(`/shifts/doctors/${id}/status`, { status })
    return data
  },
  updateNurseShiftStatus: async (id: string, status: string) => {
    const { data } = await api.post(`/shifts/nurses/${id}/status`, { status })
    return data
  },
  deleteDoctorShift: async (id: string) => {
    const { data } = await api.delete(`/shifts/doctors/${id}`)
    return data
  },
  deleteNurseShift: async (id: string) => {
    const { data } = await api.delete(`/shifts/nurses/${id}`)
    return data
  },
}

export const withdrawalsApi = {
  create: async (withdrawalData: { amount: number; notes?: string }) => {
    const { data } = await api.post('/withdrawals', withdrawalData)
    return data
  },
  getAll: async (filters?: { employeeId?: string; employeeType?: string; status?: string }) => {
    const { data } = await api.get('/withdrawals', { params: filters })
    return data
  },
  getMyWithdrawals: async () => {
    const { data } = await api.get('/withdrawals/my-withdrawals')
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/withdrawals/${id}`)
    return data
  },
  approve: async (id: string) => {
    const { data } = await api.patch(`/withdrawals/${id}/approve`)
    return data
  },
  reject: async (id: string, rejectionReason?: string) => {
    const { data } = await api.patch(`/withdrawals/${id}/reject`, { rejectionReason })
    return data
  },
  getHospitalAccount: async () => {
    const { data } = await api.get('/withdrawals/hospital-account')
    return data
  },
}

export const salariesApi = {
  create: async (salaryData: {
    employeeId: string
    employeeType: 'DOCTOR' | 'NURSE'
    periodStart: string
    periodEnd: string
    baseSalary: number
    appointmentEarnings?: number
    appointmentShares?: any[]
    totalSalary: number
  }) => {
    const { data } = await api.post('/salaries', salaryData)
    return data
  },
  getAll: async (filters?: { employeeId?: string; employeeType?: string; includeDeleted?: boolean }) => {
    const { data } = await api.get('/salaries', { params: filters })
    return data
  },
  getMySalaries: async () => {
    const { data } = await api.get('/salaries/my-salaries')
    return data
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/salaries/${id}`)
    return data
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/salaries/${id}`)
    return data
  },
}

export default api
