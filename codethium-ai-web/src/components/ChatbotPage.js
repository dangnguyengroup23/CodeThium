
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatbotPage.css';

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { id: Date.now(), text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: '1', title: 'New Chat', snippet: 'Hello! I\'m your AI assistant...' }
  ]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const messagesEndRef = useRef(null);
  const settingsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  useEffect(() => {
    const textarea = document.querySelector('.input');
    const resize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener('input', resize);
    return () => textarea.removeEventListener('input', resize);
  }, []);

  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSettingsOpen && settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
        setIsPasswordFormOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/chat', { message: input }, {
        timeout: 10000
      });
      const aiReply = response.data.reply || 'No response received from AI.';
      setMessages((prev) => [...prev, { id: Date.now(), text: aiReply, sender: 'ai' }]);
    } catch (err) {
      console.error('API Error:', err);
      let errorMessage = 'Failed to connect to the AI service. Please try again later.';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      setMessages((prev) => [...prev, { id: Date.now(), text: errorMessage, sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([{ id: Date.now(), text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'ai' }]);
    setChatHistory((prev) => [
      { id: Date.now().toString(), title: 'New Chat', snippet: 'Hello! I\'m your AI assistant...' },
      ...prev
    ]);
  };

  const handleDeleteChat = (id) => {
    setChatHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen((prev) => !prev);
    setIsPasswordFormOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
  };

  const handlePasswordFormToggle = () => {
    setIsPasswordFormOpen((prev) => !prev);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
  };

  const handleLogout = () => {
    
    console.log('Logging out...');
    
    window.location.href = '/login';
   
    setIsSettingsOpen(false);
    setIsPasswordFormOpen(false);
  };

  const handlePasswordChange = async (e) => {
  e.preventDefault();

  // Validate new password and confirmation
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    setPasswordError('New password and confirm password do not match.');
    return;
  }

  if (passwordData.newPassword.length < 6) {
    setPasswordError('New password must be at least 6 characters long.');
    return;
  }

  try {
    // Call backend API to change password
    const response = await fetch("http://localhost:4000/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      },
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setPasswordError(data.error || "Something went wrong");
      return;
    }

    // Success
    alert(data.message);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setIsPasswordFormOpen(false);
    setIsSettingsOpen(false);
  } catch (err) {
    console.error("Password change failed:", err);
    setPasswordError("Failed to change password. Try again later.");
  }
};



  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  return (
    <div className="appContainer" role="application">
      {/* Sidebar */}
      <div className="sidebar" aria-label="Chat history sidebar">
        <div className="sidebarHeader">
          <div className="sidebarTitle">CodeThium AI</div>
          <div className="sidebarActions">
            <button
              className="iconButton newChat"
              title="New Chat"
              onClick={handleNewChat}
              aria-label="Start a new chat"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
            <button
              className="iconButton settings"
              title="Settings"
              onClick={handleSettingsToggle}
              aria-label="Open settings"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon" aria-hidden="true">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.07-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09 1s.02.7.07.94L2.86 14.52c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.07.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.02-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="historyList">
          {chatHistory.map((item) => (
            <div key={item.id} className="historyItem active" role="button" tabIndex={0}>
              <div className="historyPreview">
                <span className="previewIcon"><img src='/icons/lgo.png'  /></span>
                <div className="previewText">
                  <div className="previewTitle">{item.title}</div>
                  <div className="previewSnippet">{item.snippet}</div>
                </div>
              </div>
              <button
                className="deleteButton"
                title="Delete chat"
                onClick={() => handleDeleteChat(item.id)}
                aria-label={`Delete chat ${item.title}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="icon small" aria-hidden="true">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="mainContainer">
        <div className="chatHeader">
          <div className="chatTitle">
            <span className="chatIcon"><img src='/icons/lgo.png'  /></span>
            New Chat
          </div>
          <div className="chatActions">
            <button className="iconButton share" title="Share" aria-label="Share chat">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5.44 1.31-.35 1.74l-6.24 3.61 6.14 3.54c.44.26.49.91.14 1.28-.28.24-.69.2-.94-.06l-7.02-4.07v3.21c0 .45.54.67.85.35l7.75-4.87c.26-.17.38-.53.3-.87s-.34-.63-.75-.63h-.03z"/>
              </svg>
            </button>
            <button className="iconButton more" title="More options" aria-label="More options">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon" aria-hidden="true">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-2 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-2 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="messagesContainer">
          <div className="messagesWrapper">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender}`}
                role="region"
                aria-label={`${msg.sender} message`}
              >
                <div className={`messageBubble ${msg.sender}`}>
                  {msg.sender === 'ai' && (
                    <div className="messageAvatar">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                  {msg.sender === 'user' && (
                    <div className="messageAvatar user">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai" aria-live="polite">
                <div className="messageBubble ai">
                  <div className="loadingIndicator">
                    <div className="loadingDot"></div>
                    <div className="loadingDot"></div>
                    <div className="loadingDot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="inputContainer">
          <div className="inputWrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input"
              placeholder="Send a message..."
              onKeyDown={handleKeyPress}
              rows={1}
              disabled={isLoading}
              aria-label="Chat input"
            />
            <button
              className={`sendButton ${isLoading ? 'disabled' : ''}`}
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="loadingSpinner" aria-hidden="true">
                  <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-18c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm0 14c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="sendIcon" aria-hidden="true">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Bubble Panel */}
      {isSettingsOpen && (
        <div className="settingsBubble" ref={settingsRef} role="dialog" aria-labelledby="settingsTitle">
          <div className="settingsContent">
            <div className="settingsHeader">
              <h2 id="settingsTitle" className="settingsTitle">Settings</h2>
              <button
                className="iconButton close"
                onClick={handleSettingsToggle}
                aria-label="Close settings"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="icon" aria-hidden="true">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="settingsBody">
              <button
                className="settingsButton logout"
                onClick={handleLogout}
                aria-label="Log out"
              >
                Log Out
              </button>
              <button
                className="settingsButton changePasswordToggle"
                onClick={handlePasswordFormToggle}
                aria-label={isPasswordFormOpen ? "Hide password change form" : "Show password change form"}
              >
                {isPasswordFormOpen ? 'Cancel' : 'Change Password'}
              </button>
              {isPasswordFormOpen && (
                <form onSubmit={handlePasswordChange} className="passwordForm">
                  <div className="formGroup">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-describedby="passwordError"
                    />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-describedby="passwordError"
                    />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-describedby="passwordError"
                    />
                  </div>
                  {passwordError && (
                    <div id="passwordError" className="errorMessage" role="alert">
                      {passwordError}
                    </div>
                  )}
                  <button type="submit" className="settingsButton changePassword">
                    Submit
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotPage;
