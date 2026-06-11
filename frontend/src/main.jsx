import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MeetingsPage from './pages/MeetingsPage'
import PeoplePage from './pages/PeoplePage'
import MeetingPage from './pages/MeetingPage'
import ReportPage from './pages/ReportPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MeetingsPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="meetings/:id" element={<MeetingPage />} />
          <Route path="report" element={<ReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
