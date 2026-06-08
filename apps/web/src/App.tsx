import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { ToastProvider } from './components/ui/Toast'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute, RoleGuard } from './utils/router.guards'
import { useAuthStore } from './store/auth.store'
import { PageSpinner } from './components/ui/Spinner'

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'))
const ListingsPage = lazy(() => import('./pages/public/ListingsPage'))
const ListingDetailPage = lazy(() => import('./pages/public/ListingDetailPage'))
const EstateLandingPage = lazy(() => import('./pages/public/EstateLandingPage'))
const AgencyProfilePage = lazy(() => import('./pages/public/AgencyProfilePage'))

// Auth pages
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const OtpPage = lazy(() => import('./pages/auth/OtpPage'))
const RoleSelectPage = lazy(() => import('./pages/auth/RoleSelectPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

// Tenant pages
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'))
const MyInquiries = lazy(() => import('./pages/tenant/MyInquiries'))
const SavedListings = lazy(() => import('./pages/tenant/SavedListings'))
const SearchAlerts = lazy(() => import('./pages/tenant/SearchAlerts'))
const TenantBilling = lazy(() => import('./pages/tenant/TenantBilling'))

// Lister pages
const ListerDashboard = lazy(() => import('./pages/lister/ListerDashboard'))
const MyListings = lazy(() => import('./pages/lister/MyListings'))
const AddEditListing = lazy(() => import('./pages/lister/AddEditListing'))
const InquiriesInbox = lazy(() => import('./pages/lister/InquiriesInbox'))
const Analytics = lazy(() => import('./pages/lister/Analytics'))
const CsvImport = lazy(() => import('./pages/lister/CsvImport'))
const TeamMembers = lazy(() => import('./pages/lister/TeamMembers'))
const ListerBilling = lazy(() => import('./pages/lister/ListerBilling'))
const Verification = lazy(() => import('./pages/lister/Verification'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ListingModeration = lazy(() => import('./pages/admin/ListingModeration'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const FraudReports = lazy(() => import('./pages/admin/FraudReports'))
const RevenueReports = lazy(() => import('./pages/admin/RevenueReports'))
const VerificationQueue = lazy(() => import('./pages/admin/VerificationQueue'))

// Misc
const NotFound = lazy(() => import('./pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/estates/:estate" element={<EstateLandingPage />} />
            <Route path="/agencies/:id" element={<AgencyProfilePage />} />

            {/* Auth */}
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/verify" element={<OtpPage />} />
            <Route path="/auth/role" element={<RoleSelectPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Tenant */}
            <Route path="/tenant" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><Navigate to="/tenant/dashboard" replace /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/tenant/dashboard" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><TenantDashboard /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/tenant/inquiries" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><MyInquiries /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/tenant/saved" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><SavedListings /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/tenant/alerts" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><SearchAlerts /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/tenant/billing" element={
              <ProtectedRoute><RoleGuard allowedRoles={['tenant']}><TenantBilling /></RoleGuard></ProtectedRoute>
            } />

            {/* Lister */}
            <Route path="/lister" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><Navigate to="/lister/dashboard" replace /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/dashboard" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><ListerDashboard /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/listings" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><MyListings /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/listings/new" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><AddEditListing /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/listings/:id/edit" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><AddEditListing /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/inquiries" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><InquiriesInbox /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/analytics" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><Analytics /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/import" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><CsvImport /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/team" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><TeamMembers /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/billing" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><ListerBilling /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/lister/verification" element={
              <ProtectedRoute><RoleGuard allowedRoles={['landlord', 'caretaker', 'agency']}><Verification /></RoleGuard></ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><Navigate to="/admin/dashboard" replace /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/listings" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><ListingModeration /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><UserManagement /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/fraud" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><FraudReports /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/verifications" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><VerificationQueue /></RoleGuard></ProtectedRoute>
            } />
            <Route path="/admin/revenue" element={
              <ProtectedRoute><RoleGuard allowedRoles={['admin']}><RevenueReports /></RoleGuard></ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          <ToastProvider />
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  )
}
