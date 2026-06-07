import { Routes, Route } from 'react-router-dom'
import { AppFrame } from '@/components/AppFrame'
import { Dashboard } from '@/pages/Dashboard'
import { Orders } from '@/pages/Orders'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<AppFrame />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
