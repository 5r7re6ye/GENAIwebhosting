import { useState, useRef, useEffect } from "react";
import "./AIChat.css";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  isLoading?: boolean;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: "你好！我是你的AI助手，有什麼可以幫助你的嗎？",
        timestamp: new Date(),
        isUser: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      content: "正在思考中...",
      timestamp: new Date(),
      isUser: false,
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // For GitHub Pages deployment, use a simple local response system
      const response = await generateLocalResponse(
        userMessage.content,
        messages.slice(-10)
      );

      // Remove loading message and add AI response
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: response,
          timestamp: new Date(),
          isUser: false,
        };
        return [...withoutLoading, aiMessage];
      });
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Remove loading message and add error message
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: "抱歉，我暫時無法回應。請稍後再試。",
          timestamp: new Date(),
          isUser: false,
        };
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Local AI response generator for GitHub Pages
  const generateLocalResponse = async (
    message: string,
    conversationHistory: Message[]
  ) => {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const lowerMessage = message.toLowerCase();

    // Simple keyword-based responses
    if (lowerMessage.includes("你好") || lowerMessage.includes("hello")) {
      return "你好！很高興為你服務。有什麼我可以幫助你的嗎？";
    }

    if (lowerMessage.includes("幫助") || lowerMessage.includes("help")) {
      return "我很樂意幫助你！請告訴我你遇到的具體問題，我會盡力為你提供解決方案。";
    }

    if (lowerMessage.includes("廢料") || lowerMessage.includes("product")) {
      return "關於廢料相關的問題，我可以為你提供詳細的資訊和建議。請告訴我你對哪個廢料感興趣？";
    }

    if (lowerMessage.includes("訂單") || lowerMessage.includes("order")) {
      return "我可以幫助你處理訂單相關的問題。請告訴我你的訂單號碼或具體問題，我會為你查詢。";
    }

    if (lowerMessage.includes("價格") || lowerMessage.includes("price")) {
      return "關於價格資訊，我可以為你提供最新的報價。請告訴我你感興趣的廢料，我會為你查詢價格。";
    }

    if (lowerMessage.includes("賣家") || lowerMessage.includes("seller")) {
      return "我可以幫你找到合適的賣家。請告訴我你需要什麼類型的廢料或服務？";
    }

    if (lowerMessage.includes("買家") || lowerMessage.includes("buyer")) {
      return "我可以幫你找到潛在的買家。請告訴我你銷售什麼廢料？";
    }

    if (lowerMessage.includes("回收") || lowerMessage.includes("recycle")) {
      return "關於回收服務，我可以為你提供相關資訊。請告訴我你需要回收什麼類型的物品？";
    }

    if (lowerMessage.includes("廢料") || lowerMessage.includes("waste")) {
      return "我可以幫你處理廢料相關的問題。請告訴我你有哪些廢料需要處理？";
    }

    // Default responses
    const responses = [
      "我理解你的問題。讓我來幫助你解決這個問題。",
      "這是一個很好的問題！根據我的分析，我建議你...",
      "謝謝你的提問。讓我為你提供一些有用的建議。",
      "我明白你的需求。這裡有一些解決方案供你參考。",
      "這確實是一個重要的問題。讓我為你詳細解釋一下。",
      "根據你的描述，我建議你可以嘗試以下方法...",
      "我明白你的困擾。讓我為你提供一些實用的建議。",
      "這是一個常見的問題。讓我為你提供解決方案。",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="d-flex align-items-center">
            <div className="ai-avatar me-2">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h5 className="mb-0">AI 助手</h5>
              <small className="text-muted">線上</small>
            </div>
          </div>
          <div className="ai-chat-controls">
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={clearChat}
              title="清除對話"
            >
              <i className="fas fa-trash"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              title="關閉"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${message.isUser ? "user" : "ai"} ${
                message.isLoading ? "loading" : ""
              }`}
            >
              <div className="ai-message-content">
                {message.isLoading ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <div className="message-text">{message.content}</div>
                )}
                <small className="message-time">
                  {formatTimestamp(message.timestamp)}
                </small>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-chat-input">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="輸入你的問題..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
