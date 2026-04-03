import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import SessionsList from './pages/SessionsList';

// Placeholder components for routing
const Forensics = () => <div className="p-8 text-center text-gray-500">Forensics Timeline (Coming soon)</div>;
const Settings = () => <div className="p-8 text-center text-gray-500">System Settings (Coming soon)</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="sessions" element={<SessionsList />} />
          <Route path="forensics" element={<Forensics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
