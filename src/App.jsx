import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import all your page components
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/Dashboard";
import UserProfilePage from "./pages/Profile";
import CollaboratorProfilePage from "./pages/Collaborator";
import ProfileSetupPage from "./pages/ProfileSetup";
import CollaborationPage from "./pages/CollaborationPage";

// You would also import other pages like Landing, Login, etc.
// For now, we'll focus on the ones we know exist.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Add other routes for login, signup here */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/collaborator/:id" element={<CollaboratorProfilePage />} />
        <Route path="/collaboration/:sessionId" element={<CollaborationPage />} />
        
        {/* This is the missing route for editing the profile */}
        <Route path="/profile/edit" element={<ProfileSetupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;