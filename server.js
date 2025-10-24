const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // For now, we'll use a simple response system
    // In production, you would integrate with OpenAI API or another AI service
    const response = await generateAIResponse(message, conversationHistory);
    
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple AI response generator (replace with actual AI service)
async function generateAIResponse(message, conversationHistory) {
  // This is a placeholder - replace with actual AI service integration
  const responses = [
    "我理解你的問題。讓我來幫助你解決這個問題。",
    "這是一個很好的問題！根據我的分析，我建議你...",
    "謝謝你的提問。讓我為你提供一些有用的建議。",
    "我明白你的需求。這裡有一些解決方案供你參考。",
    "這確實是一個重要的問題。讓我為你詳細解釋一下。"
  ];
  
  // Simple keyword-based responses
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('你好') || lowerMessage.includes('hello')) {
    return "你好！很高興為你服務。有什麼我可以幫助你的嗎？";
  }
  
  if (lowerMessage.includes('幫助') || lowerMessage.includes('help')) {
    return "我很樂意幫助你！請告訴我你遇到的具體問題，我會盡力為你提供解決方案。";
  }
  
  if (lowerMessage.includes('產品') || lowerMessage.includes('product')) {
    return "關於產品相關的問題，我可以為你提供詳細的資訊和建議。請告訴我你對哪個產品感興趣？";
  }
  
  if (lowerMessage.includes('訂單') || lowerMessage.includes('order')) {
    return "我可以幫助你處理訂單相關的問題。請告訴我你的訂單號碼或具體問題，我會為你查詢。";
  }
  
  if (lowerMessage.includes('價格') || lowerMessage.includes('price')) {
    return "關於價格資訊，我可以為你提供最新的報價。請告訴我你感興趣的產品，我會為你查詢價格。";
  }
  
  // Default response
  return responses[Math.floor(Math.random() * responses.length)];
}

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
