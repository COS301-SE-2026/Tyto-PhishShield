import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/protected-route';
import { SendEmailTest } from './pages/send-email-test/send-email-test';
import { Home } from './pages/home';
import { Login } from './pages/auth/login';
import { Register } from './pages/auth/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Analytics } from './pages/analytics/analytics';
import { Reports } from './pages/analytics/reports';
import { Training } from './pages/training/training';
import { Waves } from './pages/waves/waves';
import { Emails } from './pages/emails/emails';
import { ManageEmailTemplates } from "./pages/emails/manage-email-templates";
import { ScheduleWave } from './pages/waves/schedule-wave';
import { CreateEmail } from './pages/emails/create-email';
import { SendEmail } from './pages/waves/send-existing-email';
import { Users } from './pages/users/users';
import { UserProfile } from './pages/users/user-profile';
import { Settings } from './pages/settings/settings';
import Leaderboard from './pages/leaderboard/leaderboard';
import { Help } from './pages/help/help';

function UserProfileById({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { id } = useParams<{ id: string }>();
  return <UserProfile onNavigate={onNavigate} activePath="/users" userId={id} />;
}

function App() {
  const navigate = useNavigate();
  const handleNavigate = (path: string) => { void navigate(path); };
  return (
    <Routes>
      <Route path="/" element={<Home onNavigate={handleNavigate} />} />
      <Route path="/login" element={ <PublicOnlyRoute><Login onNavigate={handleNavigate} /></PublicOnlyRoute> } />
      <Route path="/register" element={ <PublicOnlyRoute><Register onNavigate={handleNavigate} /></PublicOnlyRoute> } />
      <Route path="/dashboard" element={ <ProtectedRoute><Dashboard onNavigate={handleNavigate} activePath="/dashboard" /></ProtectedRoute> } />
      <Route path="/training" element={ <ProtectedRoute><Training onNavigate={handleNavigate} activePath="/training" /></ProtectedRoute> } />
      <Route path="/users/profile" element={ <ProtectedRoute><UserProfile onNavigate={handleNavigate} activePath="/users/profile" /></ProtectedRoute> } />
      <Route path="/settings" element={ <ProtectedRoute><Settings onNavigate={handleNavigate} activePath="/settings" /></ProtectedRoute> } />
      <Route path="/send-email-test" element={ <ProtectedRoute minRole="admin"><SendEmailTest onNavigate={handleNavigate} activePath="/send-email-test" /></ProtectedRoute> } />
      <Route path="/analytics" element={ <ProtectedRoute minRole="analyst"><Analytics onNavigate={handleNavigate} activePath="/analytics" /></ProtectedRoute> } />
      <Route path="/analytics/reports" element={ <ProtectedRoute minRole="analyst"><Reports onNavigate={handleNavigate} activePath="/analytics/reports" /></ProtectedRoute> } />
      <Route path="/waves" element={ <ProtectedRoute minRole="analyst"><Waves onNavigate={handleNavigate} activePath="/waves" /></ProtectedRoute> } />
      <Route path="/emails/templates" element={ <ProtectedRoute minRole="analyst"><ManageEmailTemplates onNavigate={handleNavigate} activePath="/emails" /></ProtectedRoute> } />
      <Route path="/emails" element={ <ProtectedRoute minRole="analyst"><Emails onNavigate={handleNavigate} activePath="/emails" /></ProtectedRoute> } />
      <Route path="/waves/schedule" element={ <ProtectedRoute minRole="admin"><ScheduleWave onNavigate={handleNavigate} activePath="/waves" /></ProtectedRoute> } />
      <Route path="/emails/create-email" element={ <ProtectedRoute minRole="admin"><CreateEmail onNavigate={handleNavigate} activePath="/emails" /></ProtectedRoute> } />
      <Route path="/waves/send-email" element={ <ProtectedRoute minRole="admin"><SendEmail onNavigate={handleNavigate} activePath="/waves" /></ProtectedRoute> } />
      <Route path="/users" element={ <ProtectedRoute minRole="analyst"><Users onNavigate={handleNavigate} activePath="/users" /></ProtectedRoute> } />
      <Route path="/users/:id" element={ <ProtectedRoute minRole="analyst"><UserProfileById onNavigate={handleNavigate} /></ProtectedRoute> } />
      <Route path="/leaderboard" element={ <ProtectedRoute><Leaderboard onNavigate={handleNavigate} activePath="/leaderboard" /></ProtectedRoute> } />
      <Route path="/help" element={ <Help onNavigate={handleNavigate} activePath="/help" />} />
    </Routes>
  );
}

export default App;
