import { createContext, useContext, useState, useEffect } from "react";

// 1. Create the Context
const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // --- BYPASS MODE: ALWAYS LOGGED IN ---
  const [user, setUser] = useState({
    id: "test-user-123",           // Fake ID
    email: "dev@test.com",         // Fake Email
    aud: "authenticated",
    created_at: new Date().toISOString()
  });

  const [loading, setLoading] = useState(false);

  // Fake Login function (does nothing but redirect)
  const login = async (email, password) => {
    console.log("Bypass Login: Success");
  };

  const signup = async (email, password) => {
    console.log("Bypass Signup: Success");
  };

  const logout = async () => {
    alert("You cannot logout in Dev Mode");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};