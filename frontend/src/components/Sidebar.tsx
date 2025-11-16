import React from 'react';
import '../styles/Sidebar.css';

interface User {
  id: number;
  email: string;
}

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
  onLogout?: () => void;
  user?: User | null;
}

function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onLogout,
  user,
}: SidebarProps) {
  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>+</span> New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="chat-history">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`chat-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              <span className="chat-icon">💬</span>
              <span className="chat-title">{session.title}</span>
            </div>
          ))
        ) : (
          <div className="no-chats">No chats yet. Start a new conversation!</div>
        )}
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Bottom Menu */}
      <div className="sidebar-bottom">
        <button className="sidebar-btn">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      {/* User Profile Section */}
      <div className="user-section">
        {user ? (
          <>
            <div className="user-info">
              <div className="profile-avatar">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-email">{user.email}</div>
                <div className="user-status">Logged In</div>
              </div>
            </div>
            {onLogout && (
              <button className="logout-btn" onClick={onLogout} title="Logout">
                🚪
              </button>
            )}
          </>
        ) : (
          <div className="guest-info">
            <div className="profile-avatar">G</div>
            <div className="user-details">
              <div className="user-email">Guest User</div>
              <div className="user-status">No Login</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;