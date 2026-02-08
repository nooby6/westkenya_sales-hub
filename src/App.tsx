import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import { MainLayout } from "@/components/layout/MainLayout";
import { DriverLayout } from "@/components/layout/DriverLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Shipments from "./pages/Shipments";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Depots from "./pages/Depots";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import SalesReturns from "./pages/SalesReturns";
import Incidents from "./pages/Incidents";
import NotFound from "./pages/NotFound";

// Driver pages
import DriverDeliveries from "./pages/driver/Deliveries";
import DriverCompleted from "./pages/driver/Completed";
import DriverProfile from "./pages/driver/Profile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Route guard for drivers - redirects drivers to their dedicated app
function RoleBasedRedirect({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Drivers go to their dedicated app
  if (role === 'driver') {
    return <Navigate to="/driver/deliveries" replace />;
  }

  return <>{children}</>;
}

// Route guard for non-drivers
function NonDriverRoute({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (role === 'driver') {
    return <Navigate to="/driver/deliveries" replace />;
  }

  return <>{children}</>;
}

// Route guard for drivers only
function DriverRoute({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (role !== 'driver') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect>
                    <Navigate to="/dashboard" replace />
                  </RoleBasedRedirect>
                </ProtectedRoute>
              } 
            />
            
            {/* Main app routes (non-drivers) */}
            <Route
              element={
                <ProtectedRoute>
                  <NonDriverRoute>
                    <MainLayout />
                  </NonDriverRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/shipments" element={<Shipments />} />
              <Route path="/sales-returns" element={<SalesReturns />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/products" element={<Products />} />
              <Route path="/depots" element={<Depots />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Driver app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DriverRoute>
                    <DriverLayout />
                  </DriverRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/driver/deliveries" element={<DriverDeliveries />} />
              <Route path="/driver/completed" element={<DriverCompleted />} />
              <Route path="/driver/profile" element={<DriverProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
