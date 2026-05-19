import { Routes, Route, useNavigate } from 'react-router-dom';

// import AppLayout from './components/layout/app-layout';
// import AuthLayout from './components/layout/auth-layout';

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

  return (
    <Routes>
      <Route path="/" element={<Home onNavigate={navigate} />} />

      <Route path="/login" element={<Login onNavigate={navigate} />} />

      <Route path="/register" element={<Register onNavigate={navigate} />} />

      <Route path="/dashboard" element={<Dashboard onNavigate={navigate} activePath="/dashboard" />} />

      <Route path="/analytics" element={<Analytics onNavigate={navigate} activePath="/analytics" />} />
        
      <Route path="/analytics/reports" element={<Reports onNavigate={navigate} activePath="/analytics/reports" />} />
        
      <Route path="/training" element={<Training onNavigate={navigate} activePath="/training" />} />
        
      <Route path="/campaigns" element={<Campaigns onNavigate={navigate} activePath="/campaigns" />} />
       
      <Route path="/users" element={<Users onNavigate={navigate} activePath="/users" />} />
        
      <Route path="/users/profile" element={<UserProfile onNavigate={navigate} activePath="/users/profile" />} />
        
      <Route path="/settings" element={<Settings onNavigate={navigate} activePath="/settings" />} />

    </Routes>
  );
}

export default App;

