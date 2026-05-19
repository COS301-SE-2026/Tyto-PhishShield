import { Routes, Route, useNavigate } from 'react-router-dom';

import { Home } from './pages/home';
import { Login } from './pages/auth/login';
import { Register } from './pages/auth/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Analytics } from './pages/analytics/analytics';
import { Reports } from './pages/analytics/reports';
import { Training } from './pages/training/training';
import { Campaigns } from './pages/campaigns/campaigns';
import { Users } from './pages/users/users';
import { UserProfile } from './pages/users/user-profile';
import { Settings } from './pages/settings/settings';

function App() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    void navigate(path);
  };

  return (
    <Routes>
      <Route path="/" element={<Home onNavigate={handleNavigate} />} />

      <Route path="/login" element={<Login onNavigate={handleNavigate} />} />

      <Route path="/register" element={<Register onNavigate={handleNavigate} />} />

      <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} activePath="/dashboard" />} />

      <Route path="/analytics" element={<Analytics onNavigate={handleNavigate} activePath="/analytics" />} />

      <Route path="/analytics/reports" element={<Reports onNavigate={handleNavigate} activePath="/analytics/reports" />} />

      <Route path="/training" element={<Training onNavigate={handleNavigate} activePath="/training" />} />

      <Route path="/campaigns" element={<Campaigns onNavigate={handleNavigate} activePath="/campaigns" />} />

      <Route path="/users" element={<Users onNavigate={handleNavigate} activePath="/users" />} />

      <Route path="/users/profile" element={<UserProfile onNavigate={handleNavigate} activePath="/users/profile" />} />

      <Route path="/settings" element={<Settings onNavigate={handleNavigate} activePath="/settings" />} />
    </Routes>
  );
}

export default App;
