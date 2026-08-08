import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from '../components/AppShell';
import { messageApi } from '../api/messageApi';
import { getSocket } from '../socket/socketClient';

export function MessagesPage() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserIdFromUrl = searchParams.get('recipientId') || searchParams.get('userId');
  const targetUserNameFromUrl = searchParams.get('name') || 'Alumni Member';

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null); // { otherUser, conversationId }
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await messageApi.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);

        // If targetUserId URL param exists, open or create active conversation
        if (targetUserIdFromUrl) {
          const match = res.data.find(c => c.otherUser?._id === targetUserIdFromUrl);
          if (match) {
            selectConversation(match);
          } else {
            // Placeholder conversation for direct initiation
            setActiveConversation({
              otherUser: { _id: targetUserIdFromUrl, name: targetUserNameFromUrl },
              conversationId: null
            });
            fetchHistory(targetUserIdFromUrl);
          }
        } else if (res.data.length > 0 && !activeConversation) {
          selectConversation(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch message history with a specific target user
  const fetchHistory = async (targetUserId) => {
    try {
      const res = await messageApi.getMessageHistory(targetUserId);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to load message history:', err);
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    if (conv.otherUser?._id) {
      fetchHistory(conv.otherUser._id);
      if (conv.conversationId) {
        messageApi.markRead(conv.conversationId);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [targetUserIdFromUrl]);

  // Socket.IO Real-Time Listeners
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      // Check if message belongs to active chat
      if (activeConversation?.otherUser?._id &&
         (newMsg.sender?._id === activeConversation.otherUser._id || newMsg.sender === activeConversation.otherUser._id)) {
        setMessages(prev => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
      }
      fetchConversations();
    };

    const handleUserTyping = (data) => {
      if (data.userId === activeConversation?.otherUser?._id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [token, activeConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConversation?.otherUser?._id) return;

    const textToSend = inputMsg;
    setInputMsg('');

    const recipientId = activeConversation.otherUser._id;

    // Optimistic UI update
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      sender: { _id: user?._id || user?.id, id: user?._id || user?.id, name: user?.name },
      text: textToSend,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await messageApi.sendMessage(recipientId, textToSend);
      if (res.success && res.data) {
        setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data : m));
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <AppShell active="messages">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem', height: 'calc(100vh - 110px)', display: 'flex', gap: '1rem' }}>
        {/* Conversations Sidebar */}
        <div style={{
          width: '320px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border, #334155)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary, #f8fafc)' }}>
            💬 Messages
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 && !loading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                No active conversations. Start a chat from the Alumni Directory!
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConversation?.otherUser?._id === conv.otherUser?._id;
                const name = conv.otherUser?.name || 'User';
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div
                    key={conv.conversationId || conv.otherUser?._id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border, #334155)'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #f8fafc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: 800 }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Chat Window */}
        <div style={{
          flex: 1,
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {activeConversation?.otherUser ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {activeConversation.otherUser.name ? activeConversation.otherUser.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {activeConversation.otherUser.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    {isTyping ? 'typing...' : 'Active in Medha Ecosystem'}
                  </div>
                </div>
              </div>

              {/* Message Stream */}
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((m, idx) => {
                  const currentUserId = user?._id || user?.id;
                  const senderId = typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id) : m.sender;
                  const isMine = Boolean(currentUserId && senderId && String(senderId) === String(currentUserId));

                  const timeString = m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={m._id || idx}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        background: isMine
                          ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                          : 'var(--bg-secondary, #0f172a)',
                        color: isMine ? '#ffffff' : 'var(--text-primary, #f8fafc)',
                        padding: '0.65rem 0.95rem',
                        borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        border: isMine ? 'none' : '1px solid var(--border, #334155)',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        lineHeight: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <div>{m.text}</div>
                      {timeString && (
                        <div
                          style={{
                            alignSelf: 'flex-end',
                            fontSize: '0.68rem',
                            opacity: 0.75,
                            marginTop: '0.1rem'
                          }}
                        >
                          {timeString}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border, #334155)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-secondary, #0f172a)',
                    border: '1px solid var(--border, #334155)',
                    borderRadius: '999px',
                    color: 'var(--text-primary, #f8fafc)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Send 🚀
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
