import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import NurseDashboardComplete from './nurse/NurseDashboardComplete'
import MySalaryPage from './nurse/components/MySalaryPage'

export default function NurseDashboard() {
  return (
    <Layout role="NURSE">
      <Routes>
        <Route index element={<NurseDashboardComplete />} />
        <Route path="salary" element={<MySalaryPage />} />
      </Routes>
    </Layout>
  )
}



