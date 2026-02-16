import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookngs from './pages/admin/ListBookngs'
import { SignIn } from '@clerk/clerk-react'
import { useAppContext } from "./context/AppContext";
import { useEffect } from "react";

const App = () => {

  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  const { user, isAdmin, adminLoading } = useAppContext()

  // 🔥 Show toast only AFTER loading finishes
  useEffect(() => {
    if (!adminLoading && user && isAdmin === false && isAdminRoute) {
      toast.error("You are not authorized to access admin dashboard")
    }
  }, [adminLoading, user, isAdmin, isAdminRoute])

  // 🔥 WAIT for admin check
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <>
      <Toaster
        toastOptions={{
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: 'white',
            },
            style: {
              background: 'white',
              color: '#333',
              fontWeight: '500',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
          error: {
            style: {
              background: 'white',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
        }}
      />

      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/loading/:nexturl" element={<MyBookings />} />
        <Route path="/favorite" element={<Favorite />} />

        <Route
          path="/admin/*"
          element={
            user ? (
              isAdmin ? (
                <Layout />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                <SignIn fallbackRedirectUrl={"/admin"} />
              </div>
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookngs />} />
        </Route>

      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
