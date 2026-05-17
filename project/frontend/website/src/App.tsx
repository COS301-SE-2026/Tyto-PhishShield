import { Routes, Route, useNavigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={<Home onNavigate={navigate} />}
      />

      <Route
        path="/login"
        element={<Login onNavigate={navigate} />}
      />

      <Route
        path="/register"
        element={<Register onNavigate={navigate} />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard onNavigate={navigate} activePath="/dashboard" />}
      />
    </Routes>
  );
}

export default App;

