import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import GHeader from "./Header";

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
          "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/GENAI-webhosting/Homebackground.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <GHeader />
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">用戶名</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入用戶名"
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">密碼</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              disabled={isLoading}
            />
          </div>
          <div className="text-center">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleLogin}
              disabled={isLoading}
              style={{ marginRight: "10px" }}
            >
              {isLoading ? "登入中..." : "登入"}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={onSignUpClick}
              disabled={isLoading}
              style={{ marginRight: "10px" }}
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
