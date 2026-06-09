import MainLayout from '../components/layout/MainLayout'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import MapView from '../components/map/MapView'

export default function Dashboard() {

  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
    >

      <MapView />

    </MainLayout>
  )
}