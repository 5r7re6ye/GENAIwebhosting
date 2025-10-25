import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import "./Messages.css";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
  read: boolean;
  chatId: string;
}

interface UserData {
  username: string;
  email: string;
  userId: string;
  createdAt?: any;
}

interface Chat {
  id: string;
  chatId: string; // Same as id, but explicit for clarity
  participants: string[];
  lastMessage?: Message | null;
  otherUser: {
    id: string;
    name: string;
    type: "buyer" | "seller";
  };
  unreadCount: number;
}

interface MessagesProps {
  user: any;
  userType: "buyer" | "seller";
  onStartChat?: (userId: string, userName: string) => void;
  selectedChatUser?: { userId: string; userName: string } | null;
}

function Messages({
  user,
  userType,
  onStartChat,
  selectedChatUser,
}: MessagesProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle selectedChatUser prop to start a chat
  useEffect(() => {
    if (selectedChatUser) {
      startNewChat(selectedChatUser.userId, selectedChatUser.userName);
    }
  }, [selectedChatUser]);

  // Fetch chats for the current user
  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsList: Chat[] = [];

      for (const docSnapshot of snapshot.docs) {
        const chatData = docSnapshot.data();
        const participants = chatData.participants;

        // Find the other participant
        const otherUserId = participants.find((id: string) => id !== user.uid);

        if (otherUserId) {
          try {
            // Get user info from appropriate collection
            let userQuery;
            if (userType === "buyer") {
              userQuery = query(
                collection(db, "sellers"),
                where("userId", "==", otherUserId)
              );
            } else {
              userQuery = query(
                collection(db, "buyers"),
                where("userId", "==", otherUserId)
              );
            }

            const userSnapshot = await getDocs(userQuery);

            const otherUserData = userSnapshot.empty
              ? null
              : (userSnapshot.docs[0].data() as UserData);

            if (otherUserData && otherUserData.username) {
              // Get all messages for this chat (we'll filter in memory to avoid index issues)
              const messagesQuery = query(
                collection(db, "messages"),
                where("chatId", "==", docSnapshot.id)
              );
              const messagesSnapshot = await getDocs(messagesQuery);

              // Filter unread messages in memory
              const unreadMessages = messagesSnapshot.docs.filter(
                (doc) => doc.data().receiverId === user.uid && !doc.data().read
              );

              // Get last message (sort in memory)
              const allMessages = messagesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp,
              }));

              const sortedMessages = allMessages.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.seconds - a.timestamp.seconds;
              });

              const lastMessage =
                sortedMessages.length > 0
                  ? (sortedMessages[0] as Message)
                  : null;

              const chatToAdd = {
                id: docSnapshot.id,
                chatId: docSnapshot.id, // Same as id for consistency
                participants,
                lastMessage,
                otherUser: {
                  id: otherUserId,
                  name: otherUserData.username,
                  type: (userType === "buyer" ? "seller" : "buyer") as
                    | "buyer"
                    | "seller",
                },
                unreadCount: unreadMessages.length,
              };

              chatsList.push(chatToAdd);
            }
          } catch (error) {
            console.error("Error processing chat:", error);
          }
        }
      }

      // Sort chats by last message timestamp
      chatsList.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          b.lastMessage.timestamp?.seconds - a.lastMessage.timestamp?.seconds
        );
      });

      setChats(chatsList);
    });

    return () => unsubscribe();
  }, [user, userType]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", selectedChat.id)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });

      // Sort messages by timestamp in memory
      messagesList.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.seconds - b.timestamp.seconds;
      });

      setMessages(messagesList);

      // Mark messages as read
      const unreadMessages = messagesList.filter(
        (msg) => msg.receiverId === user.uid && !msg.read
      );

      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          try {
            await updateDoc(doc(db, "messages", msg.id), { read: true });
          } catch (error) {
            console.error("Error marking message as read:", error);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [selectedChat, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;

    setIsSending(true);

    try {
      const messageData = {
        chatId: selectedChat.id,
        senderId: user.uid,
        receiverId: selectedChat.otherUser.id,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
      };

      await addDoc(collection(db, "messages"), messageData);
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(`發送訊息失敗: ${error.message || "未知錯誤"}`);
    } finally {
      setIsSending(false);
    }
  };

  const startNewChat = async (otherUserId: string, otherUserName: string) => {
    try {
      // Create a deterministic chat ID based on user IDs to prevent duplicates
      const sortedUserIds = [user.uid, otherUserId].sort();
      const chatId = `chat_${sortedUserIds[0]}_${sortedUserIds[1]}`;

      // First, try to get the existing chat using the deterministic ID
      const chatDocRef = doc(db, "chats", chatId);

      // Check if chat already exists by trying to read it
      const chatDoc = await getDoc(chatDocRef);

      if (chatDoc.exists()) {
        // Chat exists, select it
        const chatData = chatDoc.data();
        setSelectedChat({
          id: chatDoc.id,
          chatId: chatDoc.id,
          participants: chatData.participants,
          otherUser: {
            id: otherUserId,
            name: otherUserName,
            type: (userType === "buyer" ? "seller" : "buyer") as
              | "buyer"
              | "seller",
          },
          unreadCount: 0,
        });
        return;
      }

      // Chat doesn't exist, create it with the deterministic ID
      await setDoc(chatDocRef, {
        participants: sortedUserIds,
        createdAt: serverTimestamp(),
      });

      setSelectedChat({
        id: chatId,
        chatId: chatId,
        participants: sortedUserIds,
        otherUser: {
          id: otherUserId,
          name: otherUserName,
          type: (userType === "buyer" ? "seller" : "buyer") as
            | "buyer"
            | "seller",
        },
        unreadCount: 0,
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("建立對話失敗，請重試");
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("zh-TW");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="row h-100">
      {/* Chat List - Left Side */}
      <div className="col-md-4 border-end p-0">
        <div className="p-3 border-bottom">
          <h5 className="mb-0">訊息</h5>
        </div>
        <div
          className="chat-list chat-scroll"
          style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}
        >
          {chats.length === 0 ? (
            <div className="p-3 text-center text-muted">尚無訊息</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 border-bottom chat-item ${
                  selectedChat?.id === chat.id ? "bg-light" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{chat.otherUser.name}</h6>
                    {chat.lastMessage && (
                      <p className="mb-0 text-muted small">
                        {chat.lastMessage.content.length > 50
                          ? chat.lastMessage.content.substring(0, 50) + "..."
                          : chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    {chat.lastMessage && (
                      <small className="text-muted">
                        {formatTimestamp(chat.lastMessage.timestamp)}
                      </small>
                    )}
                    {chat.unreadCount > 0 && (
                      <span className="badge bg-primary ms-2">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Interface - Right Side */}
      <div className="col-md-8 p-0 d-flex flex-column">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-bottom bg-light">
              <h5 className="mb-0">{selectedChat.otherUser.name}</h5>
            </div>

            {/* Messages */}
            <div
              className="flex-grow-1 p-3 chat-scroll"
              style={{ height: "calc(100vh - 300px)", overflowY: "auto" }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted">開始對話...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 d-flex ${
                      message.senderId === user.uid
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`message-bubble ${
                        message.senderId === user.uid ? "sent" : "received"
                      }`}
                    >
                      <div className="message-content">{message.content}</div>
                      <small
                        className={`message-timestamp ${
                          message.senderId === user.uid
                            ? "text-white-50"
                            : "text-muted"
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </small>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-top chat-input-container">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="輸入訊息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? "發送中..." : "發送"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center text-muted">
              <i className="fas fa-comments fa-3x mb-3"></i>
              <h5>選擇對話開始聊天</h5>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
