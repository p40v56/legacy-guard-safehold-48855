import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { EncryptionProvider } from "@/contexts/EncryptionContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Landing / auth kept eager for fast first paint
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Heavy authenticated / rarely-first-visited routes are code-split
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Confirm = lazy(() => import("./pages/Confirm"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Switch = lazy(() => import("./pages/Switch"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Financials = lazy(() => import("./pages/Financials"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Documents = lazy(() => import("./pages/Documents"));
const Settings = lazy(() => import("./pages/Settings"));
const Portal = lazy(() => import("./pages/Portal"));
const Admin = lazy(() => import("./pages/Admin"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));



const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <>
    <AuthProvider>
      <EncryptionProvider>
        <ErrorBoundary>
          <TooltipProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/confirm" element={<Confirm />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/switch" element={<ProtectedRoute><Switch /></ProtectedRoute>} />
                  <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                  <Route path="/financials" element={<ProtectedRoute><Financials /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/portal/:token/*" element={<Portal />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
          <Toaster />
          <Sonner />
        </ErrorBoundary>
      </EncryptionProvider>
    </AuthProvider>
  </>
);

export default App;
