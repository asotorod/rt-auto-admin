import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/auth';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/inventory/InventoryList';
import InventoryForm from './pages/inventory/InventoryForm';
import VehicleDetail from './pages/inventory/VehicleDetail';
import LeadsList from './pages/leads/LeadsList';
import DealsList from './pages/deals/DealsList';
import Reports from './pages/reporting/Reports';
import SettingsPage from './pages/settings/SettingsPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inventory/new" element={<InventoryForm />} />
            <Route path="inventory/:id" element={<VehicleDetail />} />
            <Route path="inventory/:id/edit" element={<InventoryForm />} />
            <Route path="leads" element={<LeadsList />} />
            <Route path="deals" element={<DealsList />} />
            <Route path="reporting" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
