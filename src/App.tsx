/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppShell } from './components/AppShell';
import { LoginView } from './components/LoginView';
import { EditModeChrome } from './components/cms/EditModeChrome';
import { SiteSettingsDrawer } from './components/cms/SiteSettingsDrawer';
import { PWAChrome } from './components/pwa/PWAChrome';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PWAProvider } from './context/PWAContext';
import { SiteContentProvider } from './context/SiteContentContext';

function RootRouter() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Verifying CUNY institutional session...
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <PWAProvider>
      <SiteContentProvider>
        <AuthProvider>
          <EditModeChrome />
          <RootRouter />
          <SiteSettingsDrawer />
          <PWAChrome />
        </AuthProvider>
      </SiteContentProvider>
    </PWAProvider>
  );
}
