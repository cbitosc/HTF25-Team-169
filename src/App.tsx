import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Collaboration from './pages/Collaboration.jsx';
import Collaborator from './pages/Collaborator.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Signup from './pages/Signup.jsx';

export default function App() {
  return (
    <div className={`font-sans antialiased`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/collaboration/:sessionId" element={<Collaboration />} />
        <Route path="/collaborator/:id" element={<Collaborator />} />
      </Routes>
    </div>
  )
}