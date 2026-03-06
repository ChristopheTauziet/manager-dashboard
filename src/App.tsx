import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TeamPage from './pages/TeamPage'
import OneOnOnesPage from './pages/OneOnOnesPage'
import InterviewsPage from './pages/InterviewsPage'

export default function App() {
  return (
    <BrowserRouter basename="/manager-dashboard">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/team" element={<TeamPage />} />
          <Route path="/one-on-ones" element={<OneOnOnesPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="*" element={<Navigate to="/team" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
