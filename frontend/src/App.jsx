import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import ManualPredictor from './pages/ManualPredictor'
import ReportPredictor from './pages/ReportPredictor'
import XRayPredictor from './pages/XRayPredictor'
import MriCtPredictor from './pages/MriCtPredictor'
import AboutUs from './pages/AboutUs'

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="manual" element={<ManualPredictor />} />
          <Route path="report" element={<ReportPredictor />} />
          <Route path="xray" element={<XRayPredictor />} />
          <Route path="mri" element={<MriCtPredictor />} />
          <Route path="about" element={<AboutUs />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}
