import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import DashboardHome from './admin/DashboardHome'
import PatientsPage from '../features/PatientsPage'
import AppointmentsPage from '../features/AppointmentsPage'
import UsersPage from '../features/UsersPage'
import InvoicesPage from '../features/InvoicesPage'
import DoctorsManagement from './admin/components/DoctorsManagement'
import NursesManagement from './admin/components/NursesManagement'
import Allocation from './admin/components/Allocation'
import DepartmentsManagement from './admin/components/DepartmentsManagement'
import PatientProfilePage from './admin/patients/PatientProfilePage'
import ShiftCalendarPage from './admin/components/ShiftCalendarPage'
import RegistrationRequestsPage from './admin/components/RegistrationRequestsPage'
import RevenuePage from './admin/components/RevenuePage'
import SalariesPage from './admin/components/SalariesPage'
import WithdrawalsPage from './admin/components/WithdrawalsPage'

export default function AdminDashboard() {
  return (
    <Layout role="ADMIN">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id/*" element={<PatientProfilePage />} />
        <Route path="doctors" element={<DoctorsManagement />} />
        <Route path="nurses" element={<NursesManagement />} />
        <Route path="shifts" element={<ShiftCalendarPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="allocation" element={<Allocation />} />
        <Route path="departments" element={<DepartmentsManagement />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="registration-requests" element={<RegistrationRequestsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="salaries" element={<SalariesPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
      </Routes>
    </Layout>
  )
}



