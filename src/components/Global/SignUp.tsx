import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import GHeader from "./Header";

interface SignUpProps {
  onBackToLogin: () => void;
  onSignUpSuccess: (message: string) => void;
}

function SignUp({ onBackToLogin, onSignUpSuccess }: SignUpProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!email || !username || !password || !userType) {
      setError("請填寫所有欄位並選擇用戶類型");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Add user to appropriate collection based on user type
      const collectionName = userType === "seller" ? "sellers" : "buyers";
      await addDoc(collection(db, collectionName), {
        userId: userCredential.user.uid,
        email: email,
        username: username,
        createdAt: serverTimestamp(),
      });

      console.log("Sign up successful:", userCredential.user);

      // Reset form
      setEmail("");
      setUsername("");
      setPassword("");
      setUserType("");

      // Notify parent component of success
      onSignUpSuccess("註冊成功！請登入");

      // Go back to login
      onBackToLogin();
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError("註冊失敗: " + error.message);
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
            maxWidth: "500px",
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
            建立新帳號
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
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入電子郵件"
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

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              用戶類型
            </label>
            <div style={{ display: "flex", gap: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#6c757d",
                }}
              >
                <input
                  type="radio"
                  name="userType"
                  value="seller"
                  checked={userType === "seller"}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={isLoading}
                  style={{
                    marginRight: "8px",
                    accentColor: "#D59C00",
                  }}
                />
                賣家
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#6c757d",
                }}
              >
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={userType === "buyer"}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={isLoading}
                  style={{
                    marginRight: "8px",
                    accentColor: "#D59C00",
                  }}
                />
                買家
              </label>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleSignUp}
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
              {isLoading ? "註冊中..." : "註冊"}
            </button>
            <button
              onClick={onBackToLogin}
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
              返回登入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
