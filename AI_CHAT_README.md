# AI Chat Integration for React App

This project now includes a fully functional AI chat feature that integrates seamlessly with your existing buyer and seller dashboards.

## Features

- 🤖 **AI Chat Interface**: Modern, responsive chat UI with typing indicators
- 💬 **Real-time Messaging**: Instant responses with loading states
- 🎨 **Beautiful Design**: Gradient backgrounds and smooth animations
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🔧 **Easy Integration**: Added to both buyer and seller dashboards

## Setup Instructions

### 1. Install Dependencies

First, install the new server dependencies:

```bash
npm install express cors dotenv nodemon
```

### 2. Environment Configuration

Create a `.env` file in your project root (copy from `env.example`):

```bash
# Server Configuration
PORT=3001

# OpenAI API Configuration (optional - for future AI integration)
# OPENAI_API_KEY=your_openai_api_key_here

# Other AI Service Configuration (optional)
# AI_SERVICE_URL=your_ai_service_url_here
# AI_SERVICE_KEY=your_ai_service_key_here
```

### 3. Development Setup

For development, you'll need to run both the React app and the server:

**Terminal 1 - React Development Server:**

```bash
npm run dev
```

**Terminal 2 - Backend Server:**

```bash
npm run server:dev
```

### 4. Production Setup

For production deployment:

```bash
npm run start
```

This will build the React app and start the server.

## How to Use

1. **Login** to your buyer or seller dashboard
2. **Navigate** to the "AI 助手" (AI Assistant) option in the left menu
3. **Click** "開始對話" (Start Conversation) to open the AI chat
4. **Type** your questions or messages in the input field
5. **Press Enter** or click the send button to send messages

## AI Chat Features

### Current Implementation

- **Simple Response System**: Currently uses keyword-based responses
- **Chinese Language Support**: Optimized for Chinese conversations
- **Context Awareness**: Maintains conversation history
- **Error Handling**: Graceful error handling with user-friendly messages

### Future Enhancements

- **OpenAI Integration**: Replace with actual AI service
- **Multi-language Support**: Add English and other languages
- **Voice Input**: Add speech-to-text capabilities
- **File Uploads**: Support for image and document sharing

## File Structure

```
src/
├── components/
│   ├── Global/
│   │   ├── AIChat.tsx          # Main AI chat component
│   │   ├── AIChat.css          # AI chat styles
│   │   └── ...
│   └── Pages/
│       ├── BuyerDashboard/
│       │   └── BuyerDashboard.tsx  # Updated with AI chat
│       └── SellerDashboard/
│           └── SellerDashboard.tsx # Updated with AI chat
├── firebase/
│   └── config.ts
└── ...

server.js                      # Backend server
package.json                   # Updated with server dependencies
env.example                    # Environment variables template
```

## API Endpoints

### POST /api/chat

Sends a message to the AI and receives a response.

**Request Body:**

```json
{
  "message": "你的問題",
  "conversationHistory": [
    {
      "id": "1",
      "content": "之前的訊息",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "isUser": true
    }
  ]
}
```

**Response:**

```json
{
  "response": "AI 的回應"
}
```

## Customization

### Adding Real AI Service

To integrate with OpenAI or another AI service, modify the `generateAIResponse` function in `server.js`:

```javascript
async function generateAIResponse(message, conversationHistory) {
  // Replace with actual AI service call
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Styling Customization

Modify `AIChat.css` to customize the appearance:

- Change colors in the gradient backgrounds
- Adjust message bubble styles
- Modify the typing indicator animation
- Update mobile responsiveness

## Troubleshooting

### Common Issues

1. **Server not starting**: Check if port 3001 is available
2. **AI responses not working**: Verify the server is running and accessible
3. **Styling issues**: Ensure Bootstrap CSS is loaded
4. **Mobile layout problems**: Check responsive breakpoints in CSS

### Debug Mode

Enable debug logging by adding this to your `.env`:

```
DEBUG=true
```

## Security Considerations

- **API Keys**: Never commit API keys to version control
- **Rate Limiting**: Implement rate limiting for production use
- **Input Validation**: Sanitize user inputs before processing
- **CORS**: Configure CORS properly for production domains

## Support

For issues or questions about the AI chat integration:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure the server is running on the correct port
4. Check network connectivity for API calls

---

**Note**: This AI chat feature is currently using a simple response system. For production use, integrate with a real AI service like OpenAI, Anthropic, or your preferred AI provider.
