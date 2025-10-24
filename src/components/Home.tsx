import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import SignUp from "./Global/SignUp";
import Login from "./Global/Login";
import SellerDashboard from "./Pages/SellerDashboard/SellerDashboard";
import BuyerDashboard from "./Pages/BuyerDashboard/BuyerDashboard";

function Home() {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState<any>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setCurrentView("login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userType: string) => {
    if (userType === "seller") {
      setCurrentView("sellerDashboard");
    } else if (userType === "buyer") {
      setCurrentView("buyerDashboard");
    }
  };

  const handleSignUpClick = () => {
    setCurrentView("signup");
  };

  const handleSignUpSuccess = (message: string) => {
    // Handle signup success if needed
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  // Login view
  if (currentView === "login") {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSignUpClick={handleSignUpClick}
      />
    );
  }

  if (currentView === "signup") {
    return (
      <SignUp
        onBackToLogin={handleBackToLogin}
        onSignUpSuccess={handleSignUpSuccess}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView("login");
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  // Seller dashboard view
  if (currentView === "sellerDashboard") {
    return <SellerDashboard user={user} onLogout={handleLogout} />;
  }

  // Buyer dashboard view
  if (currentView === "buyerDashboard") {
    return <BuyerDashboard user={user} onLogout={handleLogout} />;
  }

  return null;
}

export default Home;
