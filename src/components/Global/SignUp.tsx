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
      <GHeader />
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 className="text-center fs-2 fw-bold mb-4">建立新帳號</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入電子郵件"
              disabled={isLoading}
            />
          </div>

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

          <div className="mb-3">
            <label className="form-label">用戶類型</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="userType"
                  id="seller"
                  value="seller"
                  checked={userType === "seller"}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={isLoading}
                />
                <label className="form-check-label" htmlFor="seller">
                  賣家
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="userType"
                  id="buyer"
                  value="buyer"
                  checked={userType === "buyer"}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={isLoading}
                />
                <label className="form-check-label" htmlFor="buyer">
                  買家
                </label>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSignUp}
              disabled={isLoading}
              style={{ marginRight: "10px" }}
            >
              {isLoading ? "註冊中..." : "註冊"}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={onBackToLogin}
              disabled={isLoading}
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
