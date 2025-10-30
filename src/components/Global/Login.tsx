import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import GHeader from "./Header";
import HomeBg from "../../assets/Homebackground.jpg";

interface LoginProps {
  onLoginSuccess: (userType: string) => void;
  onSignUpClick: () => void;
}

function Login({ onLoginSuccess, onSignUpClick }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const findUserByUsername = async (username: string) => {
    try {
      // Check sellers collection first
      const sellerQuery = query(
        collection(db, "sellers"),
        where("username", "==", username)
      );
      const sellerSnapshot = await getDocs(sellerQuery);

      if (!sellerSnapshot.empty) {
        const userData = sellerSnapshot.docs[0].data();
        console.log("Found seller:", {
          username: username,
          email: userData.email,
          userId: userData.userId,
          userType: "seller",
        });
        return {
          email: userData.email,
          userType: "seller",
          userId: userData.userId,
        };
      }

      // Check buyers collection
      const buyerQuery = query(
        collection(db, "buyers"),
        where("username", "==", username)
      );
      const buyerSnapshot = await getDocs(buyerQuery);

      if (!buyerSnapshot.empty) {
        const userData = buyerSnapshot.docs[0].data();
        console.log("Found buyer:", {
          username: username,
          email: userData.email,
          userId: userData.userId,
          userType: "buyer",
        });
        return {
          email: userData.email,
          userType: "buyer",
          userId: userData.userId,
        };
      }

      return null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError("請填寫所有欄位");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Always sign out first to ensure fresh authentication
      try {
        await signOut(auth);
        console.log("Signed out existing user for fresh login");
      } catch (signOutError) {
        // Ignore sign out errors (user might not be signed in)
        console.log("No existing user to sign out");
      }

      // First, find the user by username to get their email
      const userData = await findUserByUsername(username);

      if (!userData) {
        setError("找不到該用戶名，請檢查是否正確");
        return;
      }

      // Now authenticate with Firebase using the email
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        password
      );

      console.log("Login successful:", {
        username: username,
        determinedUserType: userData.userType,
        firebaseAuthUser: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        },
        firestoreUserData: {
          userId: userData.userId,
          email: userData.email,
        },
      });

      // Use the userType we already found
      onLoginSuccess(userData.userType);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/wrong-password") {
        setError("密碼錯誤");
      } else if (error.code === "auth/user-not-found") {
        setError("找不到該用戶");
      } else {
        setError("登入失敗: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage:
          `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${HomeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px 40px",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#D59C00",
            fontSize: "32px",
            fontWeight: "bold",
            margin: 0,
            fontFamily: "sans-serif",
          }}
        >
          CWRS
        </h1>
        <div style={{ display: "flex", gap: "30px" }}>
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            About us
          </a>
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Contact
          </a>
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Update
          </a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "30px",
              color: "#6c757d",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            登入
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              用戶名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入用戶名"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: "#D59C00",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginRight: "15px",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {isLoading ? "登入中..." : "登入"}
            </button>
            <button
              onClick={onSignUpClick}
              disabled={isLoading}
              style={{
                backgroundColor: "transparent",
                color: "#D59C00",
                border: "2px solid #D59C00",
                padding: "10px 30px",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {isLoading ? "註冊中..." : "註冊"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
