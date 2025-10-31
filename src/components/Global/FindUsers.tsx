import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import "./Messages.css";

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  createdAt: any;
}

interface FindUsersProps {
  user: any;
  userType: "buyer" | "seller";
  onStartChat: (userId: string, userName: string) => void;
}

function FindUsers({ user, userType, onStartChat }: FindUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users from the opposite collection
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const collectionName = userType === "buyer" ? "sellers" : "buyers";
        const usersQuery = query(collection(db, collectionName));
        const snapshot = await getDocs(usersQuery);

        const usersList: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            userId: data.userId,
            username: data.username,
            email: data.email,
            createdAt: data.createdAt,
          });
        });

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userType]);

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = (userId: string, userName: string) => {
    onStartChat(userId, userName);
  };

  return (
    <div className="p-4 find-users-container">
      <h3 className="mb-4">{userType === "buyer" ? "尋找賣家" : "尋找買家"}</h3>

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder={`搜尋${userType === "buyer" ? "賣家" : "買家"}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredUsers.length === 0 ? (
            <div className="col-12 text-center text-muted">
              {searchTerm ? "找不到符合條件的用戶" : "暫無用戶"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card user-card">
                  <div className="card-body">
                    <h5 className="card-title">{user.username}</h5>
                    <p className="card-text text-muted">{user.email}</p>
                    <p className="card-text">
                      <small className="text-muted">
                        註冊時間:{" "}
                        {user.createdAt
                          ? new Date(
                              user.createdAt.seconds * 1000
                            ).toLocaleDateString("zh-TW")
                          : "未知"}
                      </small>
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleStartChat(user.userId, user.username)
                      }
                    >
                      <i className="fas fa-comment me-2"></i>
                      開始對話
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FindUsers;
