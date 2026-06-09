import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Shell from './components/layout/Shell'
import Overview from './pages/Overview'
import Atlas from './pages/Atlas'
import Forecast from './pages/Forecast'
import Insights from './pages/Insights'
import Compare from './pages/Compare'
import Model from './pages/Model'
import { CompareProvider } from './hooks/useCompare'
import { YearProvider } from './hooks/useYear'
import Riverfront from './pages/Riverfront'

export default function App() {
  return (
    <BrowserRouter>
      <YearProvider>
        <CompareProvider>
          <Shell>
            <Routes>
              <Route path="/"           element={<Overview />} />
              <Route path="/atlas"      element={<Atlas />} />
              <Route path="/forecast"   element={<Forecast />} />
              <Route path="/insights"   element={<Insights />} />
              <Route path="/compare"    element={<Compare />} />
              <Route path="/model"      element={<Model />} />
              <Route path="/riverfront" element={<Riverfront />} />
            </Routes>
          </Shell>
        </CompareProvider>
      </YearProvider>
    </BrowserRouter>
  )
}