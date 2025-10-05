import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AgentsPage from './pages/AgentsPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}

export default App;
