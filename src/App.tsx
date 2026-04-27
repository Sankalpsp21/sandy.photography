import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './components/admin/ProtectedRoute'
import Navigation from './components/layout/Navigation'
import PageTransition from './components/layout/PageTransition'

import LandingPage from './pages/LandingPage'
import PhotosPage from './pages/PhotosPage'
import AllSeriesPage from './pages/AllSeriesPage'
import SeriesPage from './pages/SeriesPage'
import CameraBrowsePage from './pages/CameraBrowsePage'
import LensBrowsePage from './pages/LensBrowsePage'
import BlogListPage from './pages/BlogListPage'
import BlogPostPage from './pages/BlogPostPage'
import ProjectsPage from './pages/ProjectsPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import PhotoUploader from './pages/admin/PhotoUploader'
import BlogEditor from './pages/admin/BlogEditor'
import SeriesManager from './pages/admin/SeriesManager'
import ProjectsManager from './pages/admin/ProjectsManager'
import AboutEditor from './pages/admin/AboutEditor'

function RootLayout() {
  return (
    <div className="bg-black min-h-screen text-white">
      <Navigation />
      <div className="pt-16">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RootLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/photos/:filter" element={<PhotosPage />} />
          <Route path="/series" element={<AllSeriesPage />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/cameras/:make/:model" element={<CameraBrowsePage />} />
          <Route path="/lenses/:make/:model" element={<LensBrowsePage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <ProtectedRoute>
                <PhotoUploader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog/new"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog/:id/edit"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/series"
            element={
              <ProtectedRoute>
                <SeriesManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute>
                <ProjectsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/about"
            element={
              <ProtectedRoute>
                <AboutEditor />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
