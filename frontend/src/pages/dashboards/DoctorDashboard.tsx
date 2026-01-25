import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import DoctorDashboardComplete from './doctor/DoctorDashboardComplete'
import DashboardHome from './doctor/DashboardHome'
import PatientsPage from '../features/PatientsPage'
import AppointmentsPage from '../features/AppointmentsPage'
import PrescriptionsPage from '../features/PrescriptionsPage'
import VisitNotesPage from '../features/VisitNotesPage'
import NursesPage from '../features/NursesPage'
import DoctorSettings from './doctor/components/DoctorSettings'
import MySalaryPage from './doctor/components/MySalaryPage'

export default function DoctorDashboard() {
  return (
    <Layout role="DOCTOR">
      <Routes>
        <Route index element={<DoctorDashboardComplete />} />
        <Route path="legacy" element={<DashboardHome />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="visit-notes" element={<VisitNotesPage />} />
        <Route path="nurses" element={<NursesPage />} />
        <Route path="salary" element={<MySalaryPage />} />
        <Route path="settings" element={<DoctorSettings />} />
      </Routes>
    </Layout>
  )
}




