//@collaps

// -- React and Router Imports --
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// -- Notification Library --
import { Toaster } from 'sonner';

// -- cookie middleware --
// import RegistrationMiddleware from './components/global/RegistrationMiddleware';

// -- Page Imports --
// Landing Pages
import LandingPage from './pages/landing/landing.page';
import ProviderLandingPage from './pages/landing/provider.landing.page';
import ClientLandingPage from './pages/landing/client.landing.page';
import RoleLandingPage from './pages/landing/role.landing.page';

// Provider Pages
import ProviderPage from './pages/provider-preview/provider.page';
import ProviderRegisterPage from './pages/register/provider/provider.register.page';
import ProviderLoginPage from './pages/login/provider.login.page';

// Client Pages
import ClientEditPage from './pages/client-edit/client.page';
import ClientRegisterPage from './pages/register/client/client.register.page';
import ClientLoginPage from './pages/login/client.login.page';

// Market and Jobs Pages
import MarketPlacePage from './pages/market-place/market-place.page';
import LatestJobsPage from './pages/latest-jobs/latest-jobs.page';

// Other Pages
import AboutPage from './pages/about-us/about.page';
import FAQPage from './pages/FAQ/FAQ.page';
import EmailConfirmationPage from './pages/register/EmailConfirmationPage';
import ActivationPage from './pages/register/activationPage';
import ForgotPasswordPage from './pages/auth/forgot-password.page';
import AdminLayout from './pages/admin/layout';
import AdminLocaleEditor from './pages/admin/edit-locales';
import AdminDashboard from './pages/admin/dashboard';
import AdminProviders from './pages/admin/providers';
import AdminClients from './pages/admin/clients';
import AdminJobs from './pages/admin/jobs';
import AdminSettings from './pages/admin/settings';
import GeneralRequestsPage from './pages/general-requests/general-requests.page';
import MonthlyBalancePage from './pages/monthly-balance/monthly-balance.page';
import BookmarksPage from './pages/bookmarks';

const App: React.FC = () => {
  return (
    <>
      {/* <TokenMiddleware> */}
        <Toaster position="bottom-right" />
        <Routes>
          {/* Landing Pages */}
          {/* <Route path="/" element={<LandingPage />} /> */}
          <Route path="/" element={<RoleLandingPage />} />
          <Route path="/landing/provider" element={<ProviderLandingPage />} />
          <Route path="/landing/client" element={<ClientLandingPage />} />

          {/* Provider Pages */}
          <Route path="provider/:id" element={<ProviderPage />} />

          {/* Client Pages */}
          <Route path="client/:id" element={<ClientEditPage />} />

          {/* Market and Jobs Pages */}
          <Route path="/marketPlace" element={<MarketPlacePage />} />
          <Route path="/marketPlace/:start/:end" element={<MarketPlacePage />} />
          <Route path="/register/provider" element={<ProviderRegisterPage />} />
          <Route path="/register/client" element={<ClientRegisterPage />} />
          <Route path="/login/provider" element={<ProviderLoginPage />} />
          <Route path="/login/client" element={<ClientLoginPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/verify-email" element={<EmailConfirmationPage />} />
          <Route path="/activation" element={<ActivationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/latest-jobs" element={<LatestJobsPage />} />
          <Route path="/general-requests" element={<GeneralRequestsPage />} />
          <Route path="/monthly-balance" element={<MonthlyBalancePage />} />
          <Route path="/bookmarks/:clientId" element={<BookmarksPage />} />
          {/* Section: Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="locales" element={<AdminLocaleEditor />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      {/* </TokenMiddleware> */}
    </>
  );
};

export default App;
