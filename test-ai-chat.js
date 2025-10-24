// Test script for AI Chat functionality
// Run this after setting up the server to test the API endpoint

const testAIChat = async () => {
  try {
    console.log('Testing AI Chat API...');
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你好，我是測試用戶',
        conversationHistory: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ AI Chat API is working!');
    console.log('Response:', data.response);
    
  } catch (error) {
    console.error('❌ AI Chat API test failed:', error.message);
    console.log('Make sure the server is running on port 3001');
  }
};

// Run the test
testAIChat();
