import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Traducteurs from "./pages/Traducteurs";
import Auth from "./pages/Auth";
import JoinTranslator from "./pages/JoinTranslator";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ActivationPage = React.lazy(() => import("./pages/ActivationPage"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!user) return <Navigate to="/auth" />;

  // Activation and token checks have been bypassed per user request
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/activate" element={
              <Suspense fallback={<div>Loading...</div>}>
                <ActivationPage />
              </Suspense>
            } />
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            {/* Admin Dashboard has its own internal check, but good to wrap too */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/traducteurs" element={
              <ProtectedRoute>
                <Traducteurs />
              </ProtectedRoute>
            } />
            <Route path="/rejoindre" element={<JoinTranslator />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
