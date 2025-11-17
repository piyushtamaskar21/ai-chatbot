import React from 'react';
import '../styles/Sidebar.css';

interface User {
  id: number;
  email: string;
  name?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
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
  const getDisplayName = () => {
    if (!user) {
      return 'Guest User';
    }

    const fullName =
      user.fullName?.trim() ||
      user.name?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    const emailName = user.email?.split('@')[0] ?? '';
    if (!emailName) {
      return user.email;
    }

    return emailName
      .split(/[._-]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  };

  const getInitials = () => {
    const reference = getDisplayName();
    const words = reference.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return user?.email?.charAt(0).toUpperCase() ?? 'G';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const displayName = getDisplayName();
  const userInitials = getInitials();

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
        <div className="user-info" aria-live="polite">
          <div className="profile-avatar" aria-hidden="true">
            {userInitials}
          </div>
          <div className="user-details">
            <div className="user-name">{displayName}</div>
            <div className="user-status">{user ? 'Logged In' : 'Guest Mode'}</div>
          </div>
        </div>
        {user && onLogout && (
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <span aria-hidden="true">↗</span>
            <span className="sr-only">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;