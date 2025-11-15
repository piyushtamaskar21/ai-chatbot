import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('new');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate title from first message using AI
  const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat`,
        {
          messages: [
            {
              role: 'system',
              content: 'Generate a short, concise title (max 50 characters) for a chat conversation based on the first user message. Return ONLY the title, nothing else.',
            },
            { role: 'user', content: firstMessage },
          ],
          temperature: 0.5,
          max_tokens: 50,
        }
      );
      return response.data.response.trim().substring(0, 50);
    } catch (error) {
      console.error('Error generating title:', error);
      return firstMessage.substring(0, 50);
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
    if (session) {
      setMessages(session.messages);
    }
  };

  // Handle prompt suggestion click
  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];

    // Add empty assistant message for streaming
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages([...newMessages, assistantMessage]);
    setInputValue('');
    setLoading(true);

    // If this is a new chat, prepare to save it
    const isNewChat = currentSessionId === 'new';

    try {
      // Call the backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat`,
        {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...newMessages,
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          timeout: 60000,
        }
      );

      // Get the full response text
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

        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Final update
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
        }
        return updatedMessages;
      });

      // Handle new chat - generate title and save
      if (isNewChat) {
        try {
          const title = await generateChatTitle(userMessage.content);

          // Create properly typed messages array
          const finalMessages: Message[] = [
            { role: 'user', content: userMessage.content },
            { role: 'assistant', content: fullContent },
          ];

          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: title,
            messages: finalMessages,
            timestamp: Date.now(),
          };

          setSessions(prev => [newSession, ...prev]);
          setCurrentSessionId(newSession.id);
        } catch (error) {
          console.error('Error saving new chat:', error);
        }
      } else {
        // Update existing session
        setSessions(prev =>
          prev.map(s => {
            if (s.id === currentSessionId) {
              const updatedMessages: Message[] = [
                ...newMessages,
                { role: 'assistant', content: fullContent },
              ];
              return {
                ...s,
                messages: updatedMessages,
              };
            }
            return s;
          })
        );
      }
    } catch (error: any) {
      console.error('Error:', error);

      const errorMsg =
        error.response?.data?.detail ||
        'Could not get response. Please check that backend is running at http://localhost:8000';

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = `Error: ${errorMsg}`;
          lastMessage.isStreaming = false;
        }
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
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