import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Landing from '@/pages/Landing';
import Welcome from '@/pages/Welcome';
import PatientDashboard from '@/pages/PatientDashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import LabRequestDetail from '@/pages/LabRequestDetail';
import AdminDashboard from '@/pages/AdminDashboard';
import LabLogin from '@/pages/LabLogin';
import LabRegister from '@/pages/LabRegister';
import HospitalLogin from '@/pages/HospitalLogin';
import HospitalRegister from '@/pages/HospitalRegister';
import Receptionist from '@/pages/Receptionist';
import HospitalPortal from '@/pages/HospitalPortal';
import LabPortal from '@/pages/LabPortal';
import LabTechnician from '@/pages/LabTechnician';
import PharmacyLogin from '@/pages/PharmacyLogin';
import PharmacyRegister from '@/pages/PharmacyRegister';
import PharmacyPortal from '@/pages/PharmacyPortal';
import Pharmacist from '@/pages/Pharmacist';
import RadiologistDashboard from '@/pages/RadiologistDashboard';
import { AppLanguageProvider } from '@/lib/appLanguage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/lab" element={<LabLogin />} />
      <Route path="/lab/register" element={<LabRegister />} />
      <Route path="/pharmacy" element={<PharmacyLogin />} />
      <Route path="/pharmacy/register" element={<PharmacyRegister />} />
      <Route path="/pharmacy/pharmacist" element={<Pharmacist />} />
      <Route path="/hospital" element={<HospitalLogin />} />
      <Route path="/hospital/register" element={<HospitalRegister />} />
      <Route path="/hospital/receptionist" element={<Receptionist />} />
      <Route path="/lab-technician" element={<LabTechnician />} />
      <Route path="/" element={<Welcome />} />
      <Route path="/landing" element={<Landing />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/radiologist" element={<RadiologistDashboard />} />
        <Route path="/doctor/lab-request/:id" element={<LabRequestDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/lab-portal" element={<LabPortal />} />
        <Route path="/pharmacy-portal" element={<PharmacyPortal />} />
        <Route path="/hospital-portal" element={<HospitalPortal />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppLanguageProvider>
            <AuthenticatedApp />
          </AppLanguageProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App