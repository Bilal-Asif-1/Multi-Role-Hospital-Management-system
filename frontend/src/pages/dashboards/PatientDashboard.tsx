import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import PatientDashboardComplete from './patient/PatientDashboardComplete'
import DashboardHome from './patient/DashboardHome'
import AppointmentsPage from '../features/AppointmentsPage'
import MedicalRecordsPage from '../features/MedicalRecordsPage'
import PrescriptionsPage from '../features/PrescriptionsPage'
import InvoicesPage from '../features/InvoicesPage'

export default function PatientDashboard() {
  return (
    <Layout role="PATIENT">
      <Routes>
        <Route index element={<PatientDashboardComplete />} />
        <Route path="legacy" element={<DashboardHome />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="records" element={<MedicalRecordsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Routes>
    </Layout>
  )
}



