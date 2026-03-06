import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TeamPage from './pages/TeamPage'
import OneOnOnesPage from './pages/OneOnOnesPage'
import InterviewsPage from './pages/InterviewsPage'
import ArchivePage from './pages/ArchivePage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/team" element={<TeamPage />} />
          <Route path="/one-on-ones" element={<OneOnOnesPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="*" element={<Navigate to="/team" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
