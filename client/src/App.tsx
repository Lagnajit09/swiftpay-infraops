import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Placeholders for auth routes */}
        <Route
          path="/login"
          element={
            <div className="p-10 font-sans text-2xl font-bold">
              Login Placeholder
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="p-10 font-sans text-2xl font-bold">
              Register Placeholder
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
