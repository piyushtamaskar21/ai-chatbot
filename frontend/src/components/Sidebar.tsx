import React from 'react';
import { Plus, MessageSquare, Settings, LogOut } from 'lucide-react';
import '../styles/Sidebar.css';

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  timestamp: number;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
}

function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="chat-history">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`chat-item ${
              currentSessionId === session.id ? 'active' : ''
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare size={16} />
            <span className="chat-title">{session.title}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Bottom Menu */}
      <div className="sidebar-bottom">
        <button className="sidebar-btn">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button className="sidebar-btn">
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="user-profile">
        <div className="profile-avatar">P</div>
      </div>
    </div>
  );
}

export default Sidebar;
