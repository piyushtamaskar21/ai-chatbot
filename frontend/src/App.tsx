import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

function App() {
  // AUTH
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // CHAT SESSIONS
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('new');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Restore auth state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      loadChatHistory(savedToken);
    }
  }, []);

  // Load chat history for authenticated user
  const loadChatHistory = async (authToken: string) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/chats/history`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setSessions(response.data);
    } catch (error) {
      setSessions([]);
    }
  };

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          email: loginEmail,
          password: loginPassword,
        }
      );
      const { access_token, user_id } = response.data;
      setToken(access_token);
      setUser({ id: user_id, email: loginEmail });
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('authUser', JSON.stringify({ id: user_id, email: loginEmail }));
      setLoginEmail('');
      setLoginPassword('');
      loadChatHistory(access_token);
    } catch {
      setLoginError('Login failed. Double check your email and password.');
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSessions([]);
    setMessages([]);
    setCurrentSessionId('new');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  // Title generator (AI)
  const generateChatTitle = async (text: string): Promise<string> => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        messages: [
          { role: 'system', content: 'Generate a short chat title (max 50 chars).' },
          { role: 'user', content: text }
        ],
      });
      return response.data.response.substring(0, 50);
    } catch {
      return text.substring(0, 50);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId('new');
    setMessages([]);
    setInputValue('');
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) setMessages(session.messages);
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  // Sending messages
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const userMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);
    setInputValue('');
    setLoading(true);

    const isNewChat = currentSessionId === 'new';
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...newMessages,
        ],
      });
      const fullContent = response.data.response || '';
      // Simulate streaming
      let currentText = '';
      const words = fullContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = currentText;
            lastMessage.isStreaming = i < words.length - 1;
          }
          return updatedMessages;
        });
        await new Promise(r => setTimeout(r, 20));
      }
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return updatedMessages;
      });


      console.log("TOKEN when saving:", token);
      console.log("USER when saving:", user);
      
      // Save chat (if logged in and new chat)
      if (user && token && isNewChat) {
        try {
          const title = await generateChatTitle(userMessage.content);
          const finalMessages: Message[] = [
            { role: 'user', content: userMessage.content },
            { role: 'assistant', content: fullContent },
          ];
          const saveResp = await axios.post(
            `${process.env.REACT_APP_API_URL}/chats/save`,
            { title, messages: finalMessages },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const newSession: ChatSession = {
            id: saveResp.data.id.toString(),
            title,
            messages: finalMessages,
            timestamp: Date.now(),
          };
          setSessions(prev => [newSession, ...prev]);
          setCurrentSessionId(newSession.id);
        } catch (error) {
          // Do nothing (fail silently but log)
          console.error('Save chat error:', error);
        }
      }
    } catch (error) {
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Error getting response. Try again.';
          lastMessage.isStreaming = false;
        }
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  // Show classic chat app layout
  if (!user) {
    return (
      <div className="app">
        <Sidebar
          sessions={[]}
          currentSessionId={'new'}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onLogout={undefined}
          user={null}
        />
        <div className="main-content" style={{ minHeight: 500 }}>
          <div style={{
            maxWidth: 400, margin: '64px auto', border: '1px solid #eee',
            padding: 32, borderRadius: 8, background: 'white'
          }}>
            <h2 style={{ textAlign: 'center' }}>Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loginError && <div className="error-message">{loginError}</div>}
              <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              <button type="submit">Login</button>
            </form>
            <div style={{ fontSize: 13, marginTop: 20, color: '#888' }}>No account? <a href="#">Contact admin.</a></div>
            <div style={{ fontSize: 13, marginTop: 14, color: '#888' }}>Or continue as guest:</div>
            <button style={{ marginTop: 6 }}
              onClick={() => { setUser(null); setToken(null); setSessions([]); setCurrentSessionId('new'); setMessages([]); }}>
              Guest Mode
            </button>
          </div>
          <ChatWindow
            messages={messages}
            loading={loading}
            onPromptClick={handlePromptClick}
            isNewChat={currentSessionId === 'new' && messages.length === 0}
          />
          <InputArea
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={sendMessage}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onLogout={handleLogout}
        user={user}
      />
      <div className="main-content">
        <ChatWindow
          messages={messages}
          loading={loading}
          onPromptClick={handlePromptClick}
          isNewChat={currentSessionId === 'new' && messages.length === 0}
        />
        <InputArea
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={sendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;