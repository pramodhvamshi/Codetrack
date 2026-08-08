import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { AppShell } from '../../components/AppShell';
import { api } from '../../api/client';
import { getSocket } from '../../socket/socketClient';

export function AlumniGroupsPage() {
  const { user, token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [category, setCategory] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [query, setQuery] = useState('');

  // Modals & Drawers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  // Contacts for Multi-Select Picker
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [additionalMemberIds, setAdditionalMemberIds] = useState([]);

  const messagesEndRef = useRef(null);

  const isAlumniUser = user && (user.role === 'alumni' || user.role === 'admin' || user.role === 'coordinator');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    targetAudience: 'all',
    meetingUrl: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async (searchTerm = '', roleFilter = '') => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('query', searchTerm);
      if (roleFilter) queryParams.append('role', roleFilter);

      const res = await api.getJson(`/v2/groups/contacts?${queryParams.toString()}`);
      if (res.success && res.data) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const fetchGroups = async (selectGroup = null) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('category', category);
      queryParams.append('audience', audienceFilter);
      queryParams.append('query', query);

      const res = await api.getJson(`/v2/groups?${queryParams.toString()}`);
      if (res.success && res.data) {
        setGroups(res.data);
        if (selectGroup) {
          selectGroupRoom(selectGroup);
        } else if (res.data.length > 0 && (!activeGroup || !res.data.some(g => g._id === activeGroup._id))) {
          selectGroupRoom(res.data[0]);
        } else if (res.data.length === 0) {
          setActiveGroup(null);
        }
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      setLoadingMessages(true);
      const res = await api.getJson(`/v2/groups/${groupId}/messages`);
      if (res.success && res.data) {
        setMessages(res.data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to load group messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectGroupRoom = (grp) => {
    setActiveGroup(grp);
    fetchGroupMessages(grp._id);
  };

  useEffect(() => {
    fetchGroups();
  }, [category, audienceFilter]);

  // Fetch contacts whenever group creation or member addition modal opens
  useEffect(() => {
    if (isModalOpen) {
      const targetRole = form.targetAudience === 'alumni-only' ? 'alumni' : '';
      fetchContacts(contactSearch, targetRole);
    } else if (isAddMembersModalOpen) {
      const targetRole = activeGroup?.targetAudience === 'alumni-only' ? 'alumni' : '';
      fetchContacts(contactSearch, targetRole);
    }
  }, [isModalOpen, isAddMembersModalOpen, contactSearch, form.targetAudience, activeGroup]);

  // Socket.IO Listener for In-App Native Group Messages
  useEffect(() => {
    if (!token || !activeGroup?._id) return;
    const socket = getSocket(token);
    if (!socket) return;

    socket.emit('join_group', { groupId: activeGroup._id });

    const handleNewGroupMessage = (newMsg) => {
      if (String(newMsg.groupId) === String(activeGroup._id)) {
        setMessages(prev => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on('new_group_message', handleNewGroupMessage);

    return () => {
      socket.emit('leave_group', { groupId: activeGroup._id });
      socket.off('new_group_message', handleNewGroupMessage);
    };
  }, [token, activeGroup]);

  const handleJoinToggle = async (groupId, e) => {
    e.stopPropagation();
    try {
      const res = await api.postJson(`/v2/groups/${groupId}/join`, {});
      if (res.success) {
        fetchGroups(activeGroup);
      }
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const handleToggleMemberSelection = (contactId) => {
    setSelectedMemberIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleToggleAdditionalMemberSelection = (contactId) => {
    setAdditionalMemberIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleAudienceChange = (newAudience) => {
    setForm(prev => ({ ...prev, targetAudience: newAudience }));
    if (newAudience === 'alumni-only') {
      // Remove any student selections when switching to Exclusive Alumni-Only
      setSelectedMemberIds(prev =>
        prev.filter(id => {
          const contactObj = contacts.find(c => String(c._id) === String(id));
          return contactObj ? contactObj.role === 'alumni' : true;
        })
      );
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;

    try {
      const payload = {
        ...form,
        memberIds: selectedMemberIds
      };

      const res = await api.postJson('/v2/groups', payload);
      if (res.success && res.data) {
        setIsModalOpen(false);
        setSelectedMemberIds([]);
        setForm({ title: '', description: '', category: 'General', targetAudience: 'all', meetingUrl: '' });
        fetchGroups(res.data);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (additionalMemberIds.length === 0 || !activeGroup?._id) return;
    try {
      const res = await api.postJson(`/v2/groups/${activeGroup._id}/members`, { memberIds: additionalMemberIds });
      if (res.success && res.data) {
        setActiveGroup(res.data);
        setIsAddMembersModalOpen(false);
        setAdditionalMemberIds([]);
        fetchGroups(res.data);
      }
    } catch (err) {
      console.error('Failed to add group members:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeGroup?._id) return;
    try {
      const res = await api.deleteJson(`/v2/groups/${activeGroup._id}/members/${memberId}`);
      if (res.success && res.data) {
        setActiveGroup(res.data);
        fetchGroups(res.data);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeGroup?._id) return;

    const textToSend = inputMsg.trim();
    setInputMsg('');

    const currentUserId = user?._id || user?.id;
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      groupId: activeGroup._id,
      sender: {
        _id: currentUserId,
        id: currentUserId,
        name: user?.name,
        role: user?.role,
        currentCompany: user?.currentCompany
      },
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await api.postJson(`/v2/groups/${activeGroup._id}/messages`, { text: textToSend });
      if (res.success && res.data) {
        setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data : m));
      }
    } catch (err) {
      console.error('Failed to send group message:', err);
    }
  };

  const currentUserIdStr = user?._id || user?.id;
  const isGroupAdmin = activeGroup && (
    String(activeGroup.creator?._id || activeGroup.creator) === String(currentUserIdStr) ||
    activeGroup.admins?.some(a => String(a._id || a) === String(currentUserIdStr))
  );

  // Filter contacts based on form targetAudience
  const visibleContactsForCreation = contacts.filter(c =>
    form.targetAudience === 'alumni-only' ? c.role === 'alumni' : true
  );

  const visibleContactsForAddition = contacts.filter(c => {
    if (activeGroup?.targetAudience === 'alumni-only' && c.role !== 'alumni') return false;
    return !activeGroup?.members?.some(m => String(m._id || m) === String(c._id));
  });

  return (
    <AppShell active="groups">
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
              👥 Direct Peer Groups & Tech Clubs
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Create peer groups with selected contacts or join public tech clubs to collaborate and chat in real-time.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '0.65rem 1.4rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            ➕ Create New Peer Group / Club
          </button>
        </div>

        {/* Audience & Category Filter Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search group name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGroups()}
            style={{
              padding: '0.5rem 0.85rem',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '999px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              width: '200px',
              outline: 'none'
            }}
          />

          {isAlumniUser && (
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-card, #1e293b)', padding: '0.25rem', borderRadius: '999px', border: '1px solid var(--border, #334155)' }}>
              <button
                onClick={() => setAudienceFilter('all')}
                style={{
                  background: audienceFilter === 'all' ? '#3b82f6' : 'transparent',
                  color: audienceFilter === 'all' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🌐 All Groups
              </button>
              <button
                onClick={() => setAudienceFilter('alumni-only')}
                style={{
                  background: audienceFilter === 'alumni-only' ? '#ec4899' : 'transparent',
                  color: audienceFilter === 'alumni-only' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔒 Alumni Peer Rooms
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {['all', 'General', 'Web Dev', 'System Design', 'Cloud & DevOps', 'AI & ML', 'Placements', 'Higher Studies', 'Startups'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? '#8b5cf6' : 'var(--bg-card, #1e293b)',
                  color: category === cat ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'all' ? '🌟 All Topics' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* DUAL-COLUMN SPLIT LAYOUT: LEFT = GROUPS LIST, RIGHT = NATIVE GROUP CHAT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.25rem', height: 'calc(100vh - 220px)', minHeight: '520px' }}>
          
          {/* LEFT COLUMN: GROUPS LIST */}
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0.9rem 1.15rem', borderBottom: '1px solid var(--border, #334155)', fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
              💬 My Peer Groups & Clubs ({groups.length})
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>Loading groups...</div>
              ) : groups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No active peer groups found. Create one above!
                </div>
              ) : (
                groups.map(grp => {
                  const isSelected = activeGroup?._id === grp._id;
                  const isMember = grp.members?.some(m => String(m._id || m) === String(currentUserIdStr));
                  const isPeerGroup = grp.targetAudience === 'alumni-only';

                  return (
                    <div
                      key={grp._id}
                      onClick={() => selectGroupRoom(grp)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        background: isSelected ? (isPeerGroup ? 'rgba(236, 72, 153, 0.16)' : 'rgba(139, 92, 246, 0.16)') : 'var(--bg-secondary, #0f172a)',
                        border: isSelected ? (isPeerGroup ? '1px solid #ec4899' : '1px solid #8b5cf6') : '1px solid var(--border, #334155)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span style={{ background: isPeerGroup ? 'rgba(236, 72, 153, 0.2)' : 'rgba(139, 92, 246, 0.18)', color: isPeerGroup ? '#f472b6' : '#c084fc', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {isPeerGroup ? '🔒 Alumni Peer Group' : '🌐 Public Club'}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleJoinToggle(grp._id, e)}
                          style={{
                            background: isMember ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: isMember ? '#10b981' : '#60a5fa',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '0.15rem 0.55rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isMember ? '✅ Enrolled' : '+ Join'}
                        </button>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc', marginBottom: '0.2rem' }}>
                        {grp.title}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {grp.description}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '0.35rem', fontWeight: 600 }}>
                        👥 {grp.members?.length || 1} Members • By {grp.creator?.name || 'User'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: NATIVE GROUP CHAT ROOM */}
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {activeGroup ? (
              <>
                {/* Chat Room Header */}
                <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {activeGroup.title}
                      </h3>
                      <button
                        onClick={() => setIsMembersModalOpen(true)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '999px',
                          padding: '0.15rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        👥 {activeGroup.members?.length || 1} Members
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Category: {activeGroup.category} • Created by {activeGroup.creator?.name || 'User'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isGroupAdmin && (
                      <button
                        onClick={() => setIsAddMembersModalOpen(true)}
                        style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#c084fc',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Add Contacts
                      </button>
                    )}

                    {activeGroup.meetingUrl && (
                      <a
                        href={activeGroup.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        🔗 Join Live Meet Call
                      </a>
                    )}
                  </div>
                </div>

                {/* Message Stream */}
                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Loading group messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                      👋 Welcome to <strong>{activeGroup.title}</strong>! Start the peer conversation below.
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const senderObj = m.sender || {};
                      const senderId = typeof m.sender === 'object' ? (senderObj._id || senderObj.id) : m.sender;
                      const isMine = Boolean(currentUserIdStr && senderId && String(senderId) === String(currentUserIdStr));
                      const senderName = senderObj.name || 'Group Member';
                      const senderRole = senderObj.role || 'student';
                      const timeString = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                      return (
                        <div
                          key={m._id || idx}
                          style={{
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                            maxWidth: '72%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMine ? 'flex-end' : 'flex-start'
                          }}
                        >
                          {!isMine && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: senderRole === 'alumni' ? '#10b981' : senderRole === 'coordinator' ? '#c084fc' : '#60a5fa', marginBottom: '0.2rem' }}>
                              {senderName} {senderRole === 'alumni' ? '🎓 Alumni' : senderRole === 'coordinator' ? '👑 Coordinator' : ''}
                            </div>
                          )}

                          <div style={{
                            background: isMine
                              ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                              : 'var(--bg-secondary, #0f172a)',
                            color: isMine ? '#ffffff' : '#f8fafc',
                            padding: '0.65rem 0.95rem',
                            borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            border: isMine ? 'none' : '1px solid var(--border, #334155)',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            lineHeight: 1.5
                          }}>
                            <div>{m.text}</div>
                            {timeString && (
                              <div style={{ textAlign: 'right', fontSize: '0.65rem', opacity: 0.75, marginTop: '0.2rem' }}>
                                {timeString}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Composer */}
                <form onSubmit={handleSendGroupMessage} style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border, #334155)', display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder={`Message #${activeGroup.title}...`}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-secondary, #0f172a)',
                      border: '1px solid var(--border, #334155)',
                      borderRadius: '999px',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '0.65rem 1.3rem',
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
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                Select a group on the left to start group chat
              </div>
            )}
          </div>
        </div>

        {/* 1. CREATE PEER GROUP MODAL WITH MULTI-SELECT CONTACT PICKER */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>👥 Create Custom Peer Group</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleCreateGroup} style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Group / Peer Room Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Referral Squad / CBIT CSE Core 2022"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                {isAlumniUser && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Group Access Level</label>
                    <select
                      value={form.targetAudience}
                      onChange={(e) => handleAudienceChange(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                    >
                      <option value="all">🌐 Public Student & Alumni Group (Open to All)</option>
                      <option value="alumni-only">🔒 Exclusive Alumni-Only Peer Group</option>
                    </select>
                  </div>
                )}

                {/* MULTI-SELECT CONTACT PICKER */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                      {form.targetAudience === 'alumni-only' ? 'Select Alumni Members to Add (Alumni Only)' : 'Select Members to Add'}
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>
                      Selected: {selectedMemberIds.length} members
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Search contact name, company..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.82rem', marginBottom: '0.5rem' }}
                  />

                  <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {visibleContactsForCreation.length === 0 ? (
                      <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                        {form.targetAudience === 'alumni-only' ? 'No Alumni contacts found' : 'No contacts found'}
                      </div>
                    ) : (
                      visibleContactsForCreation.map(c => {
                        const isChecked = selectedMemberIds.includes(c._id);
                        return (
                          <div
                            key={c._id}
                            onClick={() => handleToggleMemberSelection(c._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              background: isChecked ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                                  {c.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  {c.role === 'alumni' ? `🎓 ${c.currentCompany || 'Alumni'}` : `💻 ${c.branch || 'Student'}`}
                                </div>
                              </div>
                            </div>

                            <span style={{ fontSize: '0.68rem', color: c.role === 'alumni' ? '#10b981' : '#60a5fa', fontWeight: 600 }}>
                              {c.role}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Description & Purpose</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe what this peer group is for..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.55rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Create Peer Group</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. MEMBERS ROSTER DRAWER */}
        {isMembersModalOpen && activeGroup && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>👥 Group Members ({activeGroup.members?.length})</h3>
                <button onClick={() => setIsMembersModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {activeGroup.members?.map(m => {
                  const mId = m._id || m;
                  const isCreator = String(mId) === String(activeGroup.creator?._id || activeGroup.creator);

                  return (
                    <div key={mId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', borderRadius: '8px', border: '1px solid var(--border, #334155)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                          {m.name || 'Member'} {isCreator && <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>👑 Admin</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {m.role === 'alumni' ? `🎓 ${m.currentCompany || 'Alumni'}` : `💻 ${m.branch || 'Student'}`}
                        </div>
                      </div>

                      {isGroupAdmin && String(mId) !== String(currentUserIdStr) && (
                        <button
                          onClick={() => handleRemoveMember(mId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. ADD MEMBERS MODAL (ADMIN CONTROL) */}
        {isAddMembersModalOpen && activeGroup && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: '18px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  ➕ Add Contacts ({activeGroup.targetAudience === 'alumni-only' ? 'Alumni Only' : 'All Contacts'})
                </h3>
                <button onClick={() => setIsAddMembersModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Search contact name..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                />

                <div style={{ maxHeight: '220px', overflowY: 'auto', background: 'var(--bg-secondary, #0f172a)', borderRadius: '8px', border: '1px solid var(--border, #334155)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {visibleContactsForAddition.length === 0 ? (
                    <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No available contacts</div>
                  ) : (
                    visibleContactsForAddition.map(c => {
                      const isChecked = additionalMemberIds.includes(c._id);
                      return (
                        <div
                          key={c._id}
                          onClick={() => handleToggleAdditionalMemberSelection(c._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            background: isChecked ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => {}} />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.role === 'alumni' ? `🎓 ${c.currentCompany || 'Alumni'}` : `💻 ${c.branch || 'Student'}`}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setIsAddMembersModalOpen(false)} style={{ background: 'var(--bg-secondary, #0f172a)', color: '#94a3b8', border: '1px solid var(--border, #334155)', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddMembersSubmit} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Add Selected ({additionalMemberIds.length})</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
