import { useRef, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  doc,
  query,
  where,
} from "firebase/firestore";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { db } from "../../firebase/config";
import Alert from "./Alert";

interface ProfileProps {
  user: any;
  userType: "seller" | "buyer";
}

function Profile({ user, userType }: ProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing avatar when component mounts
  useEffect(() => {
    const loadExistingAvatar = async () => {
      if (!user) return;

      try {
        const profileCollection =
          userType === "seller" ? "sellerProfiles" : "buyerProfiles";
        const userIdField = userType === "seller" ? "sellerId" : "buyerId";

        const profileQueryRef = query(
          collection(db, profileCollection),
          where(userIdField, "==", user.uid)
        );
        const profileSnapshot = await getDocs(profileQueryRef);

        if (!profileSnapshot.empty) {
          const profileData = profileSnapshot.docs[0].data();
          if (profileData.avatarUrl) {
            setAvatarUrl(profileData.avatarUrl);
            console.log(
              "Loaded existing avatar:",
              profileData.avatarUrl.substring(0, 50) + "..."
            );
          }
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    };

    loadExistingAvatar();
  }, [user, userType]);

  // Load existing profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        const profileCollection =
          userType === "seller" ? "sellerProfiles" : "buyerProfiles";
        const userIdField = userType === "seller" ? "sellerId" : "buyerId";

        const profileQueryRef = query(
          collection(db, profileCollection),
          where(userIdField, "==", user.uid)
        );
        const profileSnapshot = await getDocs(profileQueryRef);

        if (!profileSnapshot.empty) {
          const profileData = profileSnapshot.docs[0].data();
          if (profileData.avatarUrl) {
            setAvatarUrl(profileData.avatarUrl);
          }
          if (profileData.phoneNumber) {
            setProfilePhone(profileData.phoneNumber);
          }
          if (profileData.username) {
            setProfileUsername(profileData.username);
          }
          if (profileData.location) {
            setProfileLocation(profileData.location);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
  }, [user, userType]);

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "success" });
  };

  const showAlert = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setAlert({ show: true, message, type });
  };

  const handleTriggerAvatarSelect = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarOnlyUpload = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setError("");
    console.log("Uploading avatar file:", file.name, file.size, file.type);

    try {
      // Convert file to base64 for local storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        console.log("Base64 string length:", base64String.length);
        setAvatarUrl(base64String);

        // Save to Firestore as base64 string
        const profileCollection =
          userType === "seller" ? "sellerProfiles" : "buyerProfiles";
        const userIdField = userType === "seller" ? "sellerId" : "buyerId";

        console.log(
          "Saving to collection:",
          profileCollection,
          "with userIdField:",
          userIdField,
          "user.uid:",
          user.uid
        );

        const profileQueryRef = query(
          collection(db, profileCollection),
          where(userIdField, "==", user.uid)
        );
        const profileSnapshot = await getDocs(profileQueryRef);

        console.log("Profile snapshot size:", profileSnapshot.size);

        if (!profileSnapshot.empty) {
          const profileDocRef = profileSnapshot.docs[0];
          console.log("Updating existing profile:", profileDocRef.id);
          await updateDoc(doc(db, profileCollection, profileDocRef.id), {
            avatarUrl: base64String,
            updatedAt: serverTimestamp(),
          });
        } else {
          console.log("Creating new profile document");
          await addDoc(collection(db, profileCollection), {
            [userIdField]: user.uid,
            avatarUrl: base64String,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        console.log("Avatar saved successfully to Firestore");
        showAlert("頭像已更新！", "success");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.error("Avatar upload error:", e);
      setError("頭像更新失敗: " + (e?.message || "未知錯誤"));
      showAlert("頭像更新失敗: " + (e?.message || "未知錯誤"), "error");
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileEmail(user?.email || "");
    setProfilePhone(profilePhone);
    setProfileUsername(profileUsername);
    setProfilePassword("");
    setConfirmPassword("");
    setProfileLocation(profileLocation);
    setError("");
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfilePhone("");
    setProfileUsername("");
    setProfileEmail("");
    setProfilePassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setProfileLocation("");
    setError("");
    setAvatarFile(null);
  };

  const handleSaveProfile = async () => {
    // Validate password confirmation
    if (profilePassword && profilePassword !== confirmPassword) {
      setError("密碼確認不匹配");
      return;
    }

    if (profilePassword && profilePassword.length < 6) {
      setError("密碼至少需要6個字符");
      return;
    }

    // Check if we need re-authentication for email/password changes
    const needsReauth = profileEmail !== user.email || profilePassword;
    if (needsReauth && !currentPassword) {
      setError("更改電子郵件或密碼需要輸入當前密碼");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Re-authenticate if needed
      if (needsReauth) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      // Update Firebase Auth profile
      if (profileEmail !== user.email) {
        await updateEmail(user, profileEmail);
      }

      if (profilePassword) {
        await updatePassword(user, profilePassword);
      }

      // Upload avatar if provided
      let uploadedAvatarUrl: string | null = null;
      if (avatarFile) {
        // Convert file to base64 for local storage
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64String = e.target?.result as string;
          uploadedAvatarUrl = base64String;
          setAvatarUrl(base64String);
        };
        reader.readAsDataURL(avatarFile);
      }

      // Update Firestore profile based on user type
      const profileCollection =
        userType === "seller" ? "sellerProfiles" : "buyerProfiles";
      const userIdField = userType === "seller" ? "sellerId" : "buyerId";
      const userCollection = userType === "seller" ? "sellers" : "buyers";

      const profileQuery = query(
        collection(db, profileCollection),
        where(userIdField, "==", user.uid)
      );
      const profileSnapshot = await getDocs(profileQuery);

      const profileData: any = {
        phoneNumber: profilePhone,
        username: profileUsername,
        location: profileLocation,
        updatedAt: serverTimestamp(),
      };
      if (uploadedAvatarUrl) {
        profileData.avatarUrl = uploadedAvatarUrl;
      }

      if (!profileSnapshot.empty) {
        // Update existing profile
        const profileDoc = profileSnapshot.docs[0];
        await updateDoc(doc(db, profileCollection, profileDoc.id), profileData);
      } else {
        // Create new profile
        await addDoc(collection(db, profileCollection), {
          [userIdField]: user.uid,
          ...profileData,
          createdAt: serverTimestamp(),
        });
      }

      // Update user collection with username
      if (profileUsername) {
        const userQuery = query(
          collection(db, userCollection),
          where("userId", "==", user.uid)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, userCollection, userDoc.id), {
            username: profileUsername,
          });
        }
      }

      setIsEditingProfile(false);
      showAlert("個人資料已成功更新！", "success");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.code === "auth/wrong-password") {
        setError("當前密碼不正確");
      } else if (error.code === "auth/email-already-in-use") {
        setError("該電子郵件已被使用");
      } else {
        setError("儲存失敗: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const userTypeText = userType === "seller" ? "賣家" : "買家";

  return (
    <div className="p-4">
      <Alert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
      <h3 className="mb-4">個人資料</h3>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              {/* Avatar preview */}
              <div className="d-flex align-items-center mb-3">
                <img
                  src={
                    avatarUrl || "https://via.placeholder.com/96?text=Avatar"
                  }
                  alt="avatar"
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "16px",
                    border: "2px solid #eee",
                  }}
                />
                <div>
                  <button
                    className="btn btn-primary"
                    onClick={handleTriggerAvatarSelect}
                    disabled={isLoading}
                  >
                    更換頭像
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        void handleAvatarOnlyUpload(file);
                      }
                      if (e.target) {
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
              <p>
                <strong>電子郵件:</strong> {user?.email}
              </p>
              <p>
                <strong>用戶名:</strong> {profileUsername || "未設定"}
              </p>
              <p>
                <strong>電話號碼:</strong> {profilePhone || "未設定"}
              </p>
              <p>
                <strong>地點:</strong> {profileLocation || "未設定"}
              </p>
              <p>
                <strong>用戶類型:</strong> {userTypeText}
              </p>

              {isEditingProfile ? (
                <div className="mt-3">
                  <div className="mb-3">
                    <label className="form-label">頭像</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] || null)
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">用戶名</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      placeholder="請輸入用戶名"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">電子郵件</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="請輸入電子郵件"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">電話號碼</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="請輸入電話號碼 (選填)"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">地點</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      placeholder="請輸入地點 (選填)"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">當前密碼</label>
                    <input
                      type="password"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="更改電子郵件或密碼時需要輸入當前密碼"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">新密碼</label>
                    <input
                      type="password"
                      className="form-control"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="請輸入新密碼 (選填)"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">確認密碼</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="請再次輸入新密碼"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? "儲存中..." : "儲存"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={handleEditProfile}>
                  編輯個人資料
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
