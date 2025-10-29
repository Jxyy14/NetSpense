import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { Navigation } from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import UploadReceipt from "./pages/UploadReceipt";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import FinanceAnalytics from "./pages/FinanceAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadReceipt />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/analytics" element={<FinanceAnalytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <VercelAnalytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
