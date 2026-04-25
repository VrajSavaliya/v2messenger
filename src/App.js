import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your page components from the correct directory path './Pages'
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Home from './Pages/Home'
import Group from "./Pages/Group";
function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/group" element={<Group />} />
        {/* V2Messenger Application Routes */}
        
        {/* Route for the default home/dashboard (Chats) */}
        

        {/* Routes for the three navigation links */}
        
      </Routes>
    </Router>
  );
}

export default App;