import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG & DATA ────────────────────────────────────────────────────────────
const EMOJI_SET = [
  { emoji: "🌊", label: "Wave",   color: "#38bdf8", bg: "#0c4a6e", glow: "rgba(56,189,248,0.4)" },
  { emoji: "🔥", label: "Fire",   color: "#fb923c", bg: "#7c2d12", glow: "rgba(251,146,60,0.4)" },
  { emoji: "🌙", label: "Moon",   color: "#a78bfa", bg: "#312e81", glow: "rgba(167,139,250,0.4)" },
  { emoji: "🍀", label: "Clover", color: "#34d399", bg: "#064e3b", glow: "rgba(52,211,153,0.4)" },
  { emoji: "⚡", label: "Bolt",   color: "#facc15", bg: "#422006", glow: "rgba(250,204,21,0.4)" },
  { emoji: "🎸", label: "Rock",   color: "#f472b6", bg: "#831843", glow: "rgba(244,114,182,0.4)" },
];

const CHALLENGES = [
  "Post the funniest meme you can find or make 😂",
  "Take a selfie with something unexpected 📸",
  "Write a 3-line story about your morning ✍️",
  "Share your most unpopular opinion 🤔",
  "Post a photo of your view right now 🏞️",
  "Create a cursed image 👻",
];

const SEED_USERS = [
  { id: "u1", username: "neon_fox",    avatar: "🦊", bio: "just vibing 🌙",           email: "neon@demo.com",    password: "demo123", joinDate: "2025-01-15" },
  { id: "u2", username: "cosmic_girl", avatar: "✨", bio: "stars & coffee ☕",        email: "cosmic@demo.com",  password: "demo123", joinDate: "2025-01-20" },
  { id: "u3", username: "byte_wizard", avatar: "🧙", bio: "code & chaos 💻",         email: "wizard@demo.com",  password: "demo123", joinDate: "2025-01-18" },
  { id: "u4", username: "lunar_cat",   avatar: "🐱", bio: "nap specialist 😴",       email: "cat@demo.com",     password: "demo123", joinDate: "2025-01-22" },
  { id: "u5", username: "shadow_run",  avatar: "🏃", bio: "always moving 🚀",        email: "shadow@demo.com",  password: "demo123", joinDate: "2025-01-19" },
  { id: "u6", username: "pixel_dream", avatar: "🎨", bio: "making things pretty ✏️", email: "pixel@demo.com",   password: "demo123", joinDate: "2025-01-21" },
  { id: "u7", username: "wild_card",   avatar: "🃏", bio: "expect nothing 🎰",       email: "wild@demo.com",    password: "demo123", joinDate: "2025-01-23" },
  { id: "u8", username: "echo_wave",   avatar: "🌊", bio: "sound & surf 🎶",         email: "echo@demo.com",    password: "demo123", joinDate: "2025-01-17" },
];

function generateId() { return "id_" + Math.random().toString(36).slice(2, 11); }

function generateDailyAssignments(users) {
  const a = {};
  users.forEach(u => { a[u.id] = EMOJI_SET[Math.floor(Math.random() * EMOJI_SET.length)]; });
  return a;
}

// seed follow graph: each seed user follows a couple others
function generateSeedFollows() {
  const f = {};
  SEED_USERS.forEach((u, i) => {
    f[u.id] = new Set();
    // follow next 2 in circular list
    f[u.id].add(SEED_USERS[(i + 1) % SEED_USERS.length].id);
    f[u.id].add(SEED_USERS[(i + 2) % SEED_USERS.length].id);
  });
  return f;
}

const POST_TEXTS = [
  "Just vibing today 🎶", "Morning energy is OFF the charts ☕",
  "Can't believe how good today feels!", "Who else is having the best day?? 🙌",
  "New meme just dropped, you're welcome 😂", "POV: You just joined the coolest group",
  "This is my contribution to chaos 🌀", "Sending good vibes ✨",
  "Today's challenge accepted! Let's goooo 🔥", "Pineapple on pizza is elite 🍕",
  "Living my best life rn", "Plot twist incoming…", "No thoughts, just energy ⚡",
  "this post has no meaning", "y'all are not ready for this one 👀",
];

function generateSeedPosts(users, assignments) {
  const posts = [];
  users.forEach((u, i) => {
    const count = 1 + (i % 3);
    for (let c = 0; c < count; c++) {
      posts.push({
        id: generateId(), userId: u.id, username: u.username, avatar: u.avatar,
        emoji: assignments[u.id],
        text: POST_TEXTS[(i * 3 + c) % POST_TEXTS.length],
        isMeme: (i + c) % 4 === 0,
        hasMedia: (i + c) % 3 === 0,  // simulated media flag
        reactions: { "❤️": Math.floor(Math.random()*28)+1, "😂": Math.floor(Math.random()*14)+1, "🔥": Math.floor(Math.random()*18)+1, "👏": Math.floor(Math.random()*8)+1 },
        comments: [],
        createdAt: Date.now() - Math.floor(Math.random() * 5400000),
        isGroupPost: Math.random() > 0.35,
      });
    }
  });
  return posts;
}

// seed DM conversations
function generateSeedDMs(currentUserId) {
  if (!currentUserId) return {};
  const msgs = {};
  SEED_USERS.slice(0, 4).forEach((u, i) => {
    if (u.id === currentUserId) return;
    const key = [currentUserId, u.id].sort().join("__");
    msgs[key] = [
      { id: generateId(), fromId: u.id, text: ["hey! nice to see you here 👋", "what's up?", "omg this app is so cool", "check this out lol"][i], createdAt: Date.now() - 300000 - i * 60000 },
    ];
  });
  return msgs;
}

// seed group chat messages
function generateSeedGroupChat(emojiKey, users, assignments) {
  const members = users.filter(u => assignments[u.id]?.emoji === emojiKey);
  const greetings = ["hey everyone 👋", "let's gooo 🔥", "who's here?!", "sup", "ready for today's challenge?", "this group looks fire 😎"];
  return members.slice(0, 4).map((u, i) => ({
    id: generateId(), fromId: u.id, text: greetings[i % greetings.length], createdAt: Date.now() - 240000 + i * 30000,
  }));
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────
function formatTime(ts) {
  const d = Date.now() - ts;
  if (d < 60000)  return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m";
  return Math.floor(d / 3600000) + "h";
}
function dmKey(a, b) { return [a, b].sort().join("__"); }

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

function simulateEmailSend(email, code) {
  // In demo: show code on screen and in console
  // In production: replace with real email API
  return new Promise((resolve) => {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`📧 VERIFICATION EMAIL SENT`);
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Valid for: 10 minutes`);
    console.log(`═══════════════════════════════════════\n`);
    
    // Simulate email delivery delay
    setTimeout(() => {
      resolve({ success: true, code: code, email: email });
    }, 1000);
  });
}

// ─── INVITATION NOTIFICATION ──────────────────────────────────────────────────
function InvitationNotification({ currentUser, invitations, setInvitations, assignments, setAssignments }) {
  const myInvite = invitations[currentUser?.id];
  
  if (!myInvite) return null;
  
  const acceptInvite = () => {
    // Change user's emoji group
    setAssignments(prev => ({
      ...prev,
      [currentUser.id]: myInvite.emoji
    }));
    
    // Remove invitation
    setInvitations(prev => {
      const next = { ...prev };
      delete next[currentUser.id];
      return next;
    });
  };
  
  const declineInvite = () => {
    setInvitations(prev => {
      const next = { ...prev };
      delete next[currentUser.id];
      return next;
    });
  };
  
  return (
    <div className="invitation-banner" style={{ background: myInvite.emoji.bg + "dd", borderColor: myInvite.emoji.color }}>
      <div className="invitation-content">
        <span className="invitation-emoji">{myInvite.emoji.emoji}</span>
        <div className="invitation-text">
          <strong>{myInvite.fromUsername}</strong> invited you to join <strong style={{ color: myInvite.emoji.color }}>{myInvite.emoji.label} Group</strong>!
        </div>
      </div>
      <div className="invitation-actions">
        <button 
          className="invitation-accept" 
          onClick={acceptInvite}
          style={{ background: myInvite.emoji.color }}
        >
          ✓ Accept
        </button>
        <button className="invitation-decline" onClick={declineInvite}>
          ✕ Decline
        </button>
      </div>
    </div>
  );
}

// ─── INVITE TO GROUP MODAL ────────────────────────────────────────────────────
function InviteToGroupModal({ currentUser, users, assignments, invitations, setInvitations, onClose }) {
  const myEmoji = assignments[currentUser?.id];
  const [search, setSearch] = useState("");
  const [sentInvites, setSentInvites] = useState(new Set());
  
  // Filter users: not in my group, not me, not already invited
  const otherUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;
    if (assignments[u.id]?.emoji === myEmoji?.emoji) return false; // already in group
    if (invitations[u.id]?.emoji?.emoji === myEmoji?.emoji) return false; // already invited
    if (sentInvites.has(u.id)) return false; // just invited
    return u.username.toLowerCase().includes(search.toLowerCase());
  });
  
  const sendInvite = (userId) => {
    setInvitations(prev => ({
      ...prev,
      [userId]: {
        from: currentUser.id,
        fromUsername: currentUser.username,
        emoji: myEmoji,
        timestamp: Date.now()
      }
    }));
    setSentInvites(prev => new Set([...prev, userId]));
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 className="invite-title">
          <span style={{ fontSize: 24 }}>{myEmoji?.emoji}</span> Invite to {myEmoji?.label} Group
        </h3>
        <p className="invite-subtitle">Choose users to invite to your daily emoji group</p>
        
        <input 
          className="share-search" 
          placeholder="Search users..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          autoFocus 
        />
        
        <div className="invite-user-list">
          {otherUsers.length === 0 && <p className="invite-empty">No users available to invite</p>}
          {otherUsers.map(u => {
            const ue = assignments[u.id];
            return (
              <div key={u.id} className="invite-user-row">
                <div className="invite-user-info">
                  <div className="invite-avatar" style={{ background: ue?.bg, border: `2px solid ${ue?.color || "#555"}` }}>
                    {u.avatar}
                  </div>
                  <div>
                    <span className="invite-user-name">{u.username}</span>
                    <span className="invite-user-group">{ue?.emoji} {ue?.label} Group</span>
                  </div>
                </div>
                <button 
                  className="invite-send-btn" 
                  onClick={() => sendInvite(u.id)}
                  style={{ background: myEmoji?.color + "22", color: myEmoji?.color, borderColor: myEmoji?.color }}
                >
                  Send Invite
                </button>
              </div>
            );
          })}
        </div>
        
        {sentInvites.size > 0 && (
          <div className="invite-success">
            ✅ Sent {sentInvites.size} invitation{sentInvites.size > 1 ? 's' : ''}!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
function ShareModal({ post, currentUser, users, assignments, onSend, onClose }) {
  const myEmoji = assignments[currentUser?.id];
  const myGroupMembers = users.filter(u => assignments[u.id]?.emoji === myEmoji?.emoji && u.id !== currentUser.id);
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const [search, setSearch] = useState("");

  const filteredDM = otherUsers.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 className="share-title">📤 Share post</h3>
        <p className="share-preview-text">{post.text.slice(0, 72)}{post.text.length > 72 ? "…" : ""}</p>

        {/* Group chat option */}
        {myEmoji && (
          <div className="share-section">
            <span className="share-section-label">Group Chat</span>
            <button className="share-target group-target" onClick={() => onSend("group", myEmoji.emoji)}
              style={{ border: `1px solid ${myEmoji.color}`, background: myEmoji.bg + "33" }}>
              <span style={{ fontSize: 22 }}>{myEmoji.emoji}</span>
              <div className="share-target-info">
                <span style={{ color: myEmoji.color, fontWeight: 600 }}>{myEmoji.label} Group</span>
                <span className="share-target-sub">{myGroupMembers.length + 1} members</span>
              </div>
              <span className="share-arrow">→</span>
            </button>
          </div>
        )}

        {/* DM search */}
        <div className="share-section">
          <span className="share-section-label">Direct Message</span>
          <input className="share-search" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="share-dm-list">
            {filteredDM.slice(0, 6).map(u => {
              const ue = assignments[u.id];
              return (
                <button key={u.id} className="share-target" onClick={() => onSend("dm", u.id)}>
                  <div className="share-avatar" style={{ background: ue?.bg, border: `2px solid ${ue?.color || "#555"}` }}>{u.avatar}</div>
                  <div className="share-target-info">
                    <span className="share-target-name">{u.username}</span>
                    <span className="share-target-sub">{ue?.emoji} {ue?.label}</span>
                  </div>
                  <span className="share-arrow">→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHAT SCREEN ──────────────────────────────────────────────────────────────
function ChatScreen({ currentUser, users, assignments, groupChats, setGroupChats, dmChats, setDmChats }) {
  const myEmoji = assignments[currentUser?.id];
  const [activeChatId, setActiveChatId]       = useState(null);
  const [activeChatType, setActiveChatType]   = useState(null);
  const [slideIn, setSlideIn]                 = useState(false);
  const [inputText, setInputText]             = useState("");
  const bottomRef                             = useRef(null);
  const inputRef                              = useRef(null);

  const dmConvos = Object.keys(dmChats).filter(k => k.includes(currentUser.id));

  // ── open / close full-screen chat with animation
  const openChat = (type, id) => {
    setActiveChatType(type);
    setActiveChatId(id);
    setInputText("");
    requestAnimationFrame(() => requestAnimationFrame(() => setSlideIn(true)));
  };
  const closeChat = () => {
    setSlideIn(false);
    setTimeout(() => { setActiveChatId(null); setActiveChatType(null); }, 300);
  };

  // scroll to bottom whenever messages change
  useEffect(() => {
    if (activeChatId) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });
  // focus input after slide finishes
  useEffect(() => {
    if (slideIn && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [slideIn]);

  // ── derive current chat data
  let messages = [], chatHeader = null;
  if (activeChatType === "group" && activeChatId) {
    messages = groupChats[activeChatId] || [];
    const e = EMOJI_SET.find(x => x.emoji === activeChatId);
    const memberCount = users.filter(u => assignments[u.id]?.emoji === activeChatId).length;
    chatHeader = { title: `${e?.emoji} ${e?.label} Group`, sub: `${memberCount} members · Today`, color: e?.color, bg: e?.bg, glow: e?.glow };
  } else if (activeChatType === "dm" && activeChatId) {
    messages = dmChats[activeChatId] || [];
    const otherId = activeChatId.split("__").find(x => x !== currentUser.id);
    const other  = users.find(u => u.id === otherId);
    const oe     = assignments[otherId];
    chatHeader = { title: other?.username, sub: oe ? `${oe.emoji} ${oe.label} · Online` : "Offline", color: oe?.color, bg: oe?.bg, glow: oe?.glow, avatar: other?.avatar };
  }

  const sendMsg = () => {
    if (!inputText.trim()) return;
    const msg = { id: generateId(), fromId: currentUser.id, text: inputText.trim(), createdAt: Date.now() };
    if (activeChatType === "group")
      setGroupChats(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    else
      setDmChats(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setInputText("");
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="chat-screen-wrap">

      {/* ── Convo list (always visible behind) ── */}
      <div className="chat-list-page">
        <div className="chat-list-header">
          <h2 className="chat-list-title">💬 Chats</h2>
          <NewDMButton currentUser={currentUser} users={users} assignments={assignments} dmChats={dmChats} setDmChats={setDmChats} onOpen={openChat} />
        </div>

        {/* Group */}
        {myEmoji && (
          <>
            <div className="chat-section-label">Group Chat</div>
            {(() => {
              const lastMsg = (groupChats[myEmoji.emoji] || []).slice(-1)[0];
              return (
                <button className="convo-row" onClick={() => openChat("group", myEmoji.emoji)}>
                  <div className="convo-avatar group-avatar" style={{ background: myEmoji.bg, border: `2px solid ${myEmoji.color}`, boxShadow: `0 0 8px ${myEmoji.glow}` }}>
                    {myEmoji.emoji}
                  </div>
                  <div className="convo-info">
                    <span className="convo-name" style={{ color: myEmoji.color }}>{myEmoji.emoji} {myEmoji.label} Group</span>
                    <span className="convo-last">{lastMsg ? (lastMsg.sharedPost ? "📤 Shared a post" : lastMsg.text.slice(0, 44)) : "Start chatting…"}</span>
                  </div>
                  <div className="convo-right">
                    {lastMsg && <span className="convo-time">{formatTime(lastMsg.createdAt)}</span>}
                    <span className="convo-members">{users.filter(u => assignments[u.id]?.emoji === myEmoji.emoji).length} members</span>
                  </div>
                </button>
              );
            })()}
          </>
        )}

        {/* DMs */}
        <div className="chat-section-label" style={{ marginTop: 18 }}>Direct Messages</div>
        {dmConvos.map(key => {
          const otherId = key.split("__").find(x => x !== currentUser.id);
          const other   = users.find(u => u.id === otherId);
          if (!other) return null;
          const oe      = assignments[otherId];
          const lastMsg = (dmChats[key] || []).slice(-1)[0];
          const preview = lastMsg
            ? (lastMsg.sharedPost ? "📤 Shared a post" : (lastMsg.fromId === currentUser.id ? "You: " : "") + lastMsg.text.slice(0, 38))
            : "No messages yet";
          return (
            <button key={key} className="convo-row" onClick={() => openChat("dm", key)}>
              <div className="convo-avatar" style={{ background: oe?.bg, border: `2px solid ${oe?.color || "#555"}` }}>{other.avatar}</div>
              <div className="convo-info">
                <span className="convo-name">{other.username} <span style={{ fontSize: 14 }}>{oe?.emoji}</span></span>
                <span className="convo-last">{preview}</span>
              </div>
              {lastMsg && <span className="convo-time">{formatTime(lastMsg.createdAt)}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Full-screen chat overlay (slides in from right) ── */}
      {activeChatId && (
        <div className={`chat-fullscreen ${slideIn ? "visible" : ""}`}>

          {/* top bar */}
          <div className="chat-fs-topbar" style={{ background: chatHeader?.bg + "dd" }}>
            <button className="chat-back-btn" onClick={closeChat}>←</button>
            {chatHeader?.avatar ? (
              <div className="chat-hdr-avatar" style={{ background: chatHeader.bg, border: `2px solid ${chatHeader.color}`, boxShadow: `0 0 6px ${chatHeader.glow}` }}>{chatHeader.avatar}</div>
            ) : (
              <div className="chat-hdr-emoji-badge" style={{ background: chatHeader?.bg, border: `2px solid ${chatHeader?.color}`, boxShadow: `0 0 6px ${chatHeader?.glow}` }}>
                {chatHeader?.title?.split(" ")[0]}
              </div>
            )}
            <div className="chat-hdr-text">
              <span className="chat-hdr-name" style={{ color: chatHeader?.color }}>{chatHeader?.title}</span>
              <span className="chat-hdr-sub">{chatHeader?.sub}</span>
            </div>
          </div>

          {/* messages */}
          <div className="chat-fs-messages">
            {messages.map((m, i) => {
              const isMe    = m.fromId === currentUser.id;
              const sender  = users.find(u => u.id === m.fromId);
              const showName = activeChatType === "group" && (!messages[i - 1] || messages[i - 1].fromId !== m.fromId);
              return (
                <div key={m.id} className={`msg-row ${isMe ? "me" : ""}`}>
                  {!isMe && activeChatType === "group" && (
                    <div className="msg-mini-avatar" style={{ background: chatHeader?.bg, border: `1px solid ${chatHeader?.color}` }}>{sender?.avatar || "?"}</div>
                  )}
                  <div className={`msg-bubble ${isMe ? "me" : ""}`} style={isMe ? { background: `${chatHeader?.color}30`, borderColor: `${chatHeader?.color}55` } : {}}>
                    {showName && !isMe && <span className="msg-sender-name" style={{ color: chatHeader?.color }}>{sender?.username}</span>}
                    {m.sharedPost && (
                      <div className="msg-shared-post">
                        <span className="msg-shared-label">📤 Shared post</span>
                        <p className="msg-shared-text">{m.sharedPost.text}</p>
                        <div className="msg-shared-meta">
                          <span>{m.sharedPost.avatar} {m.sharedPost.username}</span>
                          <span>{m.sharedPost.emoji?.emoji}</span>
                        </div>
                      </div>
                    )}
                    {m.text && <span className="msg-text">{m.text}</span>}
                    <span className="msg-time">{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* input bar */}
          <div className="chat-fs-inputbar">
            <input ref={inputRef} className="chat-input" placeholder="Message…" value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMsg(); }} />
            <button className="chat-send-btn" onClick={sendMsg} style={{ background: chatHeader?.color + "33", color: chatHeader?.color }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDMButton({ currentUser, users, assignments, dmChats, setDmChats, onOpen }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const others = users.filter(u => u.id !== currentUser.id && u.username.toLowerCase().includes(search.toLowerCase()));

  const startDM = (userId) => {
    const key = dmKey(currentUser.id, userId);
    if (!dmChats[key]) setDmChats(prev => ({ ...prev, [key]: [] }));
    onOpen("dm", key);
    setOpen(false);
    setSearch("");
  };

  return (
    <div style={{ position: "relative", marginTop: 10 }}>
      <button className="new-dm-btn" onClick={() => setOpen(!open)}>+ New Message</button>
      {open && (
        <div className="new-dm-dropdown">
          <input className="share-search" placeholder="Find user…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          {others.slice(0, 6).map(u => {
            const ue = assignments[u.id];
            return (
              <button key={u.id} className="new-dm-row" onClick={() => startDM(u.id)}>
                <div className="convo-avatar" style={{ background: ue?.bg, border: `2px solid ${ue?.color || "#555"}`, width: 30, height: 30, fontSize: 15 }}>{u.avatar}</div>
                <span>{u.username} <span style={{ fontSize: 13 }}>{ue?.emoji}</span></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ userId, currentUser, users, assignments, posts, follows, setFollows, onClose }) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const ue = assignments[user.id];
  const userPosts = posts.filter(p => p.userId === user.id);

  // follow counts
  const followingCount = (follows[user.id] || new Set()).size;
  const followersCount = users.filter(u => (follows[u.id] || new Set()).has(user.id)).length;
  const isMe = currentUser?.id === userId;
  const isFollowing = currentUser && (follows[currentUser.id] || new Set()).has(userId);

  const toggleFollow = () => {
    setFollows(prev => {
      const next = { ...prev };
      const mySet = new Set(next[currentUser.id] || []);
      mySet.has(userId) ? mySet.delete(userId) : mySet.add(userId);
      next[currentUser.id] = mySet;
      return next;
    });
  };

  // total reactions across user's posts
  const totalReactions = userPosts.reduce((s, p) => s + Object.values(p.reactions).reduce((a, b) => a + b, 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-page-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Banner gradient */}
        <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${ue?.bg || "#1a1a2e"}, ${ue?.color || "#444"}33)` }} />

        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-big" style={{ background: ue?.bg, border: `3px solid ${ue?.color}`, boxShadow: `0 0 20px ${ue?.glow}` }}>
            {user.avatar}
          </div>
        </div>

        {/* Name + badge */}
        <div className="profile-name-row">
          <h2 className="profile-username">{user.username}</h2>
          {ue && (
            <div className="profile-emoji-badge" style={{ background: ue.bg, border: `1px solid ${ue.color}`, boxShadow: `0 0 8px ${ue.glow}` }}>
              <span>{ue.emoji}</span>
              <span style={{ color: ue.color, fontWeight: 600, fontSize: 13 }}>{ue.label}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        <p className="profile-bio">{user.bio || "No bio yet"}</p>

        {/* Stats row */}
        <div className="profile-stats-row">
          <div className="pstat"><span className="pstat-num">{userPosts.length}</span><span className="pstat-label">Posts</span></div>
          <div className="pstat"><span className="pstat-num">{followersCount}</span><span className="pstat-label">Followers</span></div>
          <div className="pstat"><span className="pstat-num">{followingCount}</span><span className="pstat-label">Following</span></div>
        </div>

        {/* Follow button */}
        {!isMe && currentUser && (
          <button className={`follow-action-btn ${isFollowing ? "following" : ""}`} onClick={toggleFollow}>
            {isFollowing ? "✓ Following" : `Follow ${user.username}`}
          </button>
        )}

        {/* Posts grid */}
        <div className="profile-posts-grid">
          {userPosts.length === 0 && <p className="profile-empty">No posts yet</p>}
          {userPosts.map(p => (
            <div key={p.id} className="profile-grid-post">
              <div className="pgp-inner">
                {p.hasMedia && <div className="pgp-media-icon">📷</div>}
                {p.isMeme && <div className="pgp-meme-badge">MEME</div>}
                <p className="pgp-text">{p.text}</p>
              </div>
              <div className="pgp-footer">
                <span>❤️ {p.reactions["❤️"]}</span>
                <span>💬 {p.comments.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onReact, onComment, onShare, onProfileClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  return (
    <div className="post-card">
      {post.isGroupPost && (
        <div className="group-tag" style={{ background: post.emoji.bg, color: post.emoji.color, borderColor: post.emoji.color }}>
          <span>{post.emoji.emoji}</span> Group Post
        </div>
      )}
      <div className="post-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar-circle" style={{ background: post.emoji.bg, border: `2px solid ${post.emoji.color}`, boxShadow: `0 0 8px ${post.emoji.glow}` }}
            onClick={() => onProfileClick(post.userId)} style2={{ cursor: "pointer" }}>
            {post.avatar}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="username" onClick={() => onProfileClick(post.userId)}>{post.username}</span>
              <span style={{ fontSize: 14 }}>{post.emoji.emoji}</span>
            </div>
            <span className="timestamp">{formatTime(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Media placeholder */}
      {post.hasMedia && (
        <div className="post-media-placeholder">
          <span style={{ fontSize: 38 }}>🖼️</span>
          <span className="post-media-label">Photo / Video</span>
        </div>
      )}

      {post.isMeme && !post.hasMedia && (
        <div className="meme-box">
          <span style={{ fontSize: 38 }}>{post.avatar}</span>
          <span className="meme-text">{post.text}</span>
        </div>
      )}
      {!post.isMeme && <p className="post-text">{post.text}</p>}

      {/* Reactions */}
      <div className="reactions-row">
        {Object.entries(post.reactions).map(([e, c]) => (
          <button key={e} className="reaction-btn" onClick={() => onReact(post.id, e)}>{e} <span>{c}</span></button>
        ))}
        <button className="reaction-btn add-reaction" onClick={() => onReact(post.id, "🤩")}>+</button>
      </div>

      {/* Actions row */}
      <div className="post-actions">
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>💬 {post.comments.length || "Comment"}</button>
        {currentUser && <button className="action-btn share-action" onClick={() => onShare(post)}>📤 Share</button>}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          {post.comments.map((c, i) => (
            <div key={i} className="comment"><span className="comment-user">{c.username}</span><span className="comment-text">{c.text}</span></div>
          ))}
          {currentUser && (
            <div className="comment-input-row">
              <input className="comment-input" placeholder="Write a comment…" value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { onComment(post.id, commentText); setCommentText(""); } }} />
              <button className="comment-send" onClick={() => { if (commentText.trim()) { onComment(post.id, commentText); setCommentText(""); } }}>→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPanel({ posts }) {
  const grouped = {};
  EMOJI_SET.forEach(e => { grouped[e.emoji] = []; });
  posts.forEach(p => { if (grouped[p.emoji?.emoji]) grouped[p.emoji.emoji].push(p); });

  const ranked = EMOJI_SET.map(e => {
    const gp = grouped[e.emoji];
    const eng = gp.reduce((s, p) => s + Object.values(p.reactions).reduce((a, b) => a + b, 0) + p.comments.length, 0);
    const top = [...gp].sort((a, b) => {
      const aS = Object.values(a.reactions).reduce((x, y) => x + y, 0);
      const bS = Object.values(b.reactions).reduce((x, y) => x + y, 0);
      return bS - aS;
    })[0];
    return { ...e, eng, top, count: gp.length };
  }).sort((a, b) => b.eng - a.eng);

  return (
    <div className="sidebar-card">
      <h3 className="panel-title">🏆 Leaderboard</h3>
      {ranked.map((g, i) => (
        <div key={g.emoji} className="lb-row" style={{ borderLeft: `3px solid ${g.color}` }}>
          <span className="lb-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
          <span style={{ fontSize: 20 }}>{g.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: g.color, fontWeight: 600, fontSize: 13 }}>{g.label}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{g.count} posts · {g.eng} interactions</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHALLENGE ────────────────────────────────────────────────────────────────
function ChallengePanel({ challenge, userEmoji }) {
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="sidebar-card" style={{ border: `1px solid ${userEmoji?.color || "#444"}`, boxShadow: `0 0 10px ${userEmoji?.glow || "transparent"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span>🎯</span>
        <h3 style={{ color: userEmoji?.color, margin: 0, fontSize: 15 }}>Daily Challenge</h3>
        {userEmoji && <span>{userEmoji.emoji}</span>}
      </div>
      <p style={{ color: "#ccc", fontSize: 13, margin: "0 0 10px" }}>{challenge}</p>
      {!done ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input className="comment-input" style={{ flex: 1 }} placeholder="Your answer…" value={text} onChange={e => setText(e.target.value)} />
          <button className="challenge-btn" style={{ background: userEmoji?.color }} onClick={() => { if (text.trim()) setDone(true); }}>Go</button>
        </div>
      ) : (
        <div className="challenge-done">✅ Submitted! "{text}"</div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── auth
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loginErr, setLoginErr] = useState("");
  const [fUser, setFUser] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPass, setFPass] = useState("");
  
  // ── email verification
  const [verificationStep, setVerificationStep] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [userCode, setUserCode] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [codeSending, setCodeSending] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState("");
  
  // ── group invitations
  const [invitations, setInvitations] = useState({}); // { userId: { from, fromUsername, emoji, timestamp } }
  const [showInviteModal, setShowInviteModal] = useState(false);

  // ── app
  const [tab, setTab] = useState("feed");         // feed | mygroup | chat
  const [users, setUsers] = useState(SEED_USERS);
  const [assignments, setAssignments] = useState({});
  const [posts, setPosts] = useState([]);
  const [follows, setFollows] = useState({});       // { userId: Set<followedId> }
  const [groupChats, setGroupChats] = useState({}); // { emojiKey: [msgs] }
  const [dmChats, setDmChats] = useState({});       // { dmKey: [msgs] }
  const [challenge, setChallenge] = useState("");

  // ── modals
  const [profileUserId, setProfileUserId] = useState(null);
  const [sharePost, setSharePost] = useState(null);

  // ── init
  useEffect(() => {
    if (screen === "app" && Object.keys(assignments).length === 0) {
      const a = generateDailyAssignments(users);
      setAssignments(a);
      setPosts(generateSeedPosts(users, a));
      setFollows(generateSeedFollows());
      setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "app" && currentUser && Object.keys(dmChats).length === 0) {
      setDmChats(generateSeedDMs(currentUser.id));
    }
  }, [screen, currentUser]);

  useEffect(() => {
    if (screen === "app" && currentUser && Object.keys(groupChats).length === 0 && Object.keys(assignments).length > 0) {
      const myE = assignments[currentUser.id];
      if (myE) setGroupChats({ [myE.emoji]: generateSeedGroupChat(myE.emoji, users, assignments) });
    }
  }, [screen, currentUser, assignments]);

  // ── auth handlers
  const doRegister = async () => {
    // Validation
    if (!fUser.trim()) { setLoginErr("Username required!"); return; }
    if (!fEmail.trim()) { setLoginErr("Email required!"); return; }
    if (!fPass.trim()) { setLoginErr("Password required!"); return; }
    if (fPass.length < 6) { setLoginErr("Password must be at least 6 characters!"); return; }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fEmail.trim())) { setLoginErr("Invalid email format!"); return; }
    
    // Check if username or email already taken
    if (users.find(u => u.username === fUser.trim())) { setLoginErr("Username already taken!"); return; }
    if (users.find(u => u.email === fEmail.trim())) { setLoginErr("Email already registered!"); return; }
    
    // Generate and send verification code
    const code = generateVerificationCode();
    setSentCode(code);
    setCodeSending(true);
    setLoginErr("");
    
    try {
      await simulateEmailSend(fEmail.trim(), code);
      
      // Create pending user (not registered yet)
      const nu = { 
        id: generateId(), 
        username: fUser.trim(), 
        email: fEmail.trim(),
        password: fPass,
        avatar: ["🦅","🐺","🌸","🎪","🦋","🐉","🦄","🍄"][Math.floor(Math.random()*8)], 
        bio: "", 
        joinDate: new Date().toISOString().slice(0,10) 
      };
      setPendingUser(nu);
      
      // Show verification step
      setVerificationStep(true);
      setVerifySuccess("✉️ Verification code sent to " + fEmail.trim());
      
      // Show code in alert for demo (remove in production)
      alert(`📧 Email sent!\n\nYour verification code: ${code}\n\n(In production, check your email inbox)`);
      
    } catch (err) {
      setLoginErr("Failed to send verification email. Try again.");
    } finally {
      setCodeSending(false);
    }
  };
  
  const verifyCode = () => {
    if (!userCode.trim()) { setLoginErr("Please enter the code!"); return; }
    if (userCode.trim() !== sentCode) { setLoginErr("Incorrect code! Check your email."); return; }
    
    // Code is correct - complete registration
    setUsers(p => [...p, pendingUser]);
    setRegisteredUsers(p => [...p, pendingUser]);
    const a = { ...assignments, [pendingUser.id]: EMOJI_SET[Math.floor(Math.random() * EMOJI_SET.length)] };
    setAssignments(a);
    setFollows(p => ({ ...p, [pendingUser.id]: new Set() }));
    setCurrentUser(pendingUser);
    setScreen("app");
    
    // Reset verification state
    setVerificationStep(false);
    setSentCode("");
    setUserCode("");
    setPendingUser(null);
    setVerifySuccess("");
    setLoginErr(""); 
    setFUser(""); 
    setFEmail(""); 
    setFPass("");
  };
  
  const resendCode = async () => {
    const newCode = generateVerificationCode();
    setSentCode(newCode);
    setCodeSending(true);
    setLoginErr("");
    
    try {
      await simulateEmailSend(pendingUser.email, newCode);
      setVerifySuccess("✉️ New code sent to " + pendingUser.email);
      alert(`📧 New code sent!\n\nYour verification code: ${newCode}\n\n(Check your email)`);
    } catch (err) {
      setLoginErr("Failed to resend code. Try again.");
    } finally {
      setCodeSending(false);
    }
  };
  
  const doLogin = () => {
    if (!fUser.trim()) { setLoginErr("Username required!"); return; }
    if (!fPass.trim()) { setLoginErr("Password required!"); return; }
    
    const found = [...registeredUsers, ...SEED_USERS].find(
  u => u.username === fUser.trim()
    );
    if (!found) { setLoginErr("User not found!"); return; }
    if (found.password !== fPass) { setLoginErr("Incorrect password!"); return; }
    
    setCurrentUser(found); 
    setScreen("app"); 
    setLoginErr(""); 
    setFUser(""); 
    setFPass("");
  };
  const demoLogin = () => {
    setCurrentUser(SEED_USERS[0]);
    setRegisteredUsers(p => [...p, SEED_USERS[0]]);
    setScreen("app");
  };

  // ── post handlers
  const [newPostText, setNewPostText] = useState("");
  const handleNewPost = () => {
    if (!newPostText.trim() || !currentUser) return;
    setPosts(p => [{ id: generateId(), userId: currentUser.id, username: currentUser.username, avatar: currentUser.avatar,
      emoji: assignments[currentUser.id], text: newPostText, isMeme: false, hasMedia: false,
      reactions: { "❤️": 0, "😂": 0, "🔥": 0, "👏": 0 }, comments: [],
      createdAt: Date.now(), isGroupPost: tab === "mygroup" }, ...p]);
    setNewPostText("");
  };
  const handleReact = (postId, emoji) => {
    setPosts(p => p.map(post => post.id === postId ? { ...post, reactions: { ...post.reactions, [emoji]: (post.reactions[emoji] || 0) + 1 } } : post));
  };
  const handleComment = (postId, text) => {
    if (!currentUser) return;
    setPosts(p => p.map(post => post.id === postId ? { ...post, comments: [...post.comments, { username: currentUser.username, text }] } : post));
  };

  // ── share handler
  const handleShareSend = (type, targetId) => {
    const msg = {
      id: generateId(), fromId: currentUser.id,
      text: "", createdAt: Date.now(),
      sharedPost: { text: sharePost.text, avatar: sharePost.avatar, username: sharePost.username, emoji: sharePost.emoji, hasMedia: sharePost.hasMedia },
    };
    if (type === "group") {
      setGroupChats(prev => ({ ...prev, [targetId]: [...(prev[targetId] || []), msg] }));
    } else {
      const key = dmKey(currentUser.id, targetId);
      setDmChats(prev => ({ ...prev, [key]: [...(prev[key] || []), msg] }));
    }
    setSharePost(null);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  // ── Auth screen
  if (screen !== "app") {
    const isReg = screen === "register";
    
    // Email verification step
    if (verificationStep) {
      return (
        <div className="auth-screen">
          <div className="auth-particles">
            {EMOJI_SET.map((e, i) => (
              <div key={i} className="floating-emoji" style={{ left: `${8 + i * 15}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${3.5 + i * 0.6}s` }}>{e.emoji}</div>
            ))}
          </div>
          <div className="auth-card">
            <div className="auth-logo"><span className="logo-emoji">📧</span><h1 className="logo-text">Verify Email</h1></div>
            <p className="auth-tagline">Enter the 6-digit code sent to your email</p>
            
            {verifySuccess && <div className="verify-success">{verifySuccess}</div>}
            
            <div className="verify-info">
              <p className="verify-email">{pendingUser?.email}</p>
              <p className="verify-hint">Check your inbox and spam folder</p>
            </div>

            {/* DEMO MODE: Show code on screen */}
            <div className="code-display-box">
              <div className="code-display-label">🔑 Your Verification Code (DEMO):</div>
              <div className="code-display-value">{sentCode}</div>
              <div className="code-display-note">
                In production, this code will be sent to your email.<br/>
                For now, copy this code and enter it below.
              </div>
            </div>
            
            <div className="auth-form">
              <input 
                className="auth-input verify-code-input" 
                placeholder="Enter 6-digit code" 
                value={userCode} 
                onChange={e => setUserCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                onKeyDown={e => e.key === "Enter" && verifyCode()}
                maxLength={6}
                autoFocus
              />
              {loginErr && <p className="auth-error">{loginErr}</p>}
              <button className="auth-submit" onClick={verifyCode} disabled={codeSending}>
                Verify & Create Account
              </button>
              <button 
                className="resend-code-btn" 
                onClick={resendCode}
                disabled={codeSending}
              >
                {codeSending ? "Sending..." : "Resend Code"}
              </button>
              <button 
                className="back-to-register-btn" 
                onClick={() => {
                  setVerificationStep(false);
                  setSentCode("");
                  setUserCode("");
                  setPendingUser(null);
                  setVerifySuccess("");
                  setLoginErr("");
                }}
              >
                ← Back to Registration
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Normal login/register screen
    return (
      <div className="auth-screen">
        <div className="auth-particles">
          {EMOJI_SET.map((e, i) => (
            <div key={i} className="floating-emoji" style={{ left: `${8 + i * 15}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${3.5 + i * 0.6}s` }}>{e.emoji}</div>
          ))}
        </div>
        <div className="auth-card">
          <div className="auth-logo"><span className="logo-emoji">🌀</span><h1 className="logo-text">EmojiBlend</h1></div>
          <p className="auth-tagline">New groups. New people. Every day.</p>
          <div className="auth-toggle">
            <button className={`toggle-btn ${!isReg ? "active" : ""}`} onClick={() => { setScreen("login"); setLoginErr(""); }}>Login</button>
            <button className={`toggle-btn ${isReg ? "active" : ""}`} onClick={() => { setScreen("register"); setLoginErr(""); }}>Register</button>
          </div>
          <div className="auth-form">
            <input 
              className="auth-input" 
              placeholder="Username" 
              value={fUser} 
              onChange={e => setFUser(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && (isReg ? doRegister() : doLogin())} 
              required
            />
            {isReg && (
              <input 
                className="auth-input" 
                placeholder="Email *" 
                type="email"
                value={fEmail} 
                onChange={e => setFEmail(e.target.value)}
                required
              />
            )}
            <input 
              className="auth-input" 
              placeholder={isReg ? "Password (min 6 characters) *" : "Password *"} 
              type="password" 
              value={fPass} 
              onChange={e => setFPass(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && (isReg ? doRegister() : doLogin())}
              required
            />
            {loginErr && <p className="auth-error">{loginErr}</p>}
            <button 
              className="auth-submit" 
              onClick={isReg ? doRegister : doLogin}
              disabled={codeSending}
            >
              {codeSending ? "Sending code..." : (isReg ? "Create Account" : "Sign In")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── App screen
  const myEmoji = currentUser ? assignments[currentUser.id] : null;
  const myGroupPosts = myEmoji ? posts.filter(p => p.emoji?.emoji === myEmoji.emoji) : [];
  const feedPosts = (tab === "mygroup" ? myGroupPosts : posts).sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = Object.keys(dmChats).filter(k => k.includes(currentUser?.id || "")).reduce((n, k) => n + (dmChats[k]?.filter(m => m.fromId !== currentUser.id).length || 0), 0);

  return (
    <div className="app-screen">
      {/* Header */}
      <header className="app-header">
        <div className="header-left"><span className="header-logo">🌀</span><span className="header-title">EmojiBlend</span></div>
        <div className="header-right">
          {myEmoji && (
            <div className="header-my-emoji" style={{ background: myEmoji.bg, border: `1px solid ${myEmoji.color}`, boxShadow: `0 0 6px ${myEmoji.glow}` }}>
              <span>{myEmoji.emoji}</span><span style={{ color: myEmoji.color, fontSize: 11, fontWeight: 600 }}>{myEmoji.label}</span>
            </div>
          )}
          <button className="header-avatar" onClick={() => setProfileUserId(currentUser?.id)}>{currentUser?.avatar || "👤"}</button>
          <button className="logout-btn" onClick={() => { setScreen("login"); setCurrentUser(null); }}>✕</button>
        </div>
      </header>

      {/* Daily banner */}
      <div className="daily-banner">
        <p className="banner-label">Today's Groups</p>
        <div className="emoji-row">
          {EMOJI_SET.map(e => {
            const active = myEmoji?.emoji === e.emoji;
            const cnt = users.filter(u => assignments[u.id]?.emoji === e.emoji).length;
            return (
              <div key={e.emoji} className={`emoji-chip ${active ? "active" : ""}`} style={{ border: `1px solid ${active ? e.color : "#333"}`, background: active ? e.bg : "rgba(255,255,255,0.03)", boxShadow: active ? `0 0 10px ${e.glow}` : "none" }}>
                <span className="chip-emoji">{e.emoji}</span><span className="chip-count" style={{ color: active ? e.color : "#666" }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invitation notification */}
      <InvitationNotification 
        currentUser={currentUser} 
        invitations={invitations} 
        setInvitations={setInvitations}
        assignments={assignments}
        setAssignments={setAssignments}
      />

      {/* Nav */}
      <nav className="nav-tabs">
        {[
          { key: "feed",    label: "🌐 Feed" },
          { key: "mygroup", label: `${myEmoji?.emoji || "🔲"} My Group` },
          { key: "chat",    label: "💬 Chat", badge: unreadCount },
        ].map(t => (
          <button key={t.key} className={`nav-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.badge > 0 && <span className="nav-badge">{t.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Chat screen (full width) */}
      {tab === "chat" ? (
        <ChatScreen currentUser={currentUser} users={users} assignments={assignments}
          groupChats={groupChats} setGroupChats={setGroupChats} dmChats={dmChats} setDmChats={setDmChats} />
      ) : (
        /* Feed layout */
        <div className="app-layout">
          <main className="main-feed">
            {/* New post */}
            {currentUser && (
              <div className="new-post-box">
                <div className="new-post-row">
                  <div className="avatar-circle small" style={{ background: myEmoji?.bg, border: `2px solid ${myEmoji?.color}`, boxShadow: `0 0 6px ${myEmoji?.glow}` }}>{currentUser.avatar}</div>
                  <textarea className="new-post-input" placeholder="What's on your mind?" value={newPostText} onChange={e => setNewPostText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleNewPost(); }} rows={2} />
                </div>
                <div className="new-post-actions">
                  <span className="post-hint">Ctrl+Enter to post</span>
                  <button className="post-submit-btn" style={{ background: myEmoji?.color || "#38bdf8" }} onClick={handleNewPost}>Post{tab === "mygroup" ? " to Group" : ""}</button>
                </div>
              </div>
            )}
            <div className="feed-list">
              {feedPosts.map(p => (
                <PostCard key={p.id} post={p} currentUser={currentUser}
                  onReact={handleReact} onComment={handleComment}
                  onShare={setSharePost} onProfileClick={setProfileUserId} />
              ))}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            {myEmoji && (() => {
              const members = users.filter(u => assignments[u.id]?.emoji === myEmoji.emoji);
              return (
                <div className="sidebar-card" style={{ border: `1px solid ${myEmoji.color}`, boxShadow: `0 0 10px ${myEmoji.glow}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{myEmoji.emoji}</span>
                      <div><h4 style={{ color: myEmoji.color, margin: 0, fontSize: 15 }}>{myEmoji.label} Group</h4><span style={{ color: "#666", fontSize: 12 }}>{members.length} members</span></div>
                    </div>
                    <button 
                      className="invite-group-btn" 
                      onClick={() => setShowInviteModal(true)}
                      style={{ background: myEmoji.color + "22", color: myEmoji.color, borderColor: myEmoji.color }}
                      title="Invite users to your group"
                    >
                      + Invite
                    </button>
                  </div>
                  <div className="group-members-avatars">
                    {members.map(u => (
                      <div key={u.id} className="mini-avatar" onClick={() => setProfileUserId(u.id)} title={u.username}
                        style={{ background: myEmoji.bg, border: `2px solid ${myEmoji.color}` }}>{u.avatar}</div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <ChallengePanel challenge={challenge} userEmoji={myEmoji} />
            <LeaderboardPanel posts={posts} />
          </aside>
        </div>
      )}

      {/* Profile modal */}
      {profileUserId && (
        <ProfilePage userId={profileUserId} currentUser={currentUser} users={users}
          assignments={assignments} posts={posts} follows={follows} setFollows={setFollows} onClose={() => setProfileUserId(null)} />
      )}

      {/* Share modal */}
      {sharePost && (
        <ShareModal post={sharePost} currentUser={currentUser} users={users}
          assignments={assignments} onSend={handleShareSend} onClose={() => setSharePost(null)} />
      )}

      {/* Invite to group modal */}
      {showInviteModal && (
        <InviteToGroupModal
          currentUser={currentUser}
          users={users}
          assignments={assignments}
          invitations={invitations}
          setInvitations={setInvitations}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300..500;1,9..40,300..500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body,#root{background:#0a0a0f;color:#fff;font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden}

/* ── Auth ── */
.auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;position:relative;overflow:hidden}
.auth-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 30%,rgba(56,189,248,.08) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 20% 80%,rgba(167,139,250,.06) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 80% 70%,rgba(52,211,153,.05) 0%,transparent 60%)}
.auth-particles{position:absolute;inset:0;pointer-events:none}
.floating-emoji{position:absolute;top:-40px;font-size:30px;opacity:.15;animation:floatDown 6s ease-in-out infinite}
@keyframes floatDown{0%{transform:translateY(-40px) rotate(0deg);opacity:.15}50%{opacity:.3}100%{transform:translateY(100vh) rotate(360deg);opacity:.05}}
.auth-card{position:relative;z-index:1;width:100%;max-width:400px;padding:44px 34px;background:rgba(18,18,28,.88);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08);border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.auth-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px}
.logo-emoji{font-size:34px;filter:drop-shadow(0 0 12px rgba(167,139,250,.6))}
.logo-text{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:3px;color:#fff}
.auth-tagline{text-align:center;color:#666;font-size:14px;margin-bottom:22px;font-style:italic}
.auth-toggle{display:flex;background:rgba(255,255,255,.05);border-radius:12px;padding:3px;margin-bottom:18px}
.toggle-btn{flex:1;padding:8px;border:none;background:transparent;color:#666;font-size:14px;border-radius:10px;cursor:pointer;transition:all .2s;font-family:inherit}
.toggle-btn.active{background:rgba(56,189,248,.15);color:#38bdf8}
.auth-form{display:flex;flex-direction:column;gap:10px}
.auth-input{width:100%;padding:11px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border .2s}
.auth-input:focus{border-color:rgba(56,189,248,.4)}
.auth-input::placeholder{color:#555}
.auth-error{color:#f87171;font-size:13px;margin-top:-4px}
.auth-submit{width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#38bdf8,#a78bfa);color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s,transform .1s;margin-top:4px}
.auth-submit:hover{opacity:.9;transform:translateY(-1px)}
.auth-demo-hint{text-align:center;margin-top:14px;color:#555;font-size:13px}
.demo-btn{background:none;border:none;color:#38bdf8;cursor:pointer;font-size:13px;text-decoration:underline;padding:0;font-family:inherit}

/* ── App shell ── */
.app-screen{min-height:100vh;display:flex;flex-direction:column}
.app-header{display:flex;align-items:center;justify-content:space-between;padding:11px 22px;background:rgba(12,12,18,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;z-index:50}
.header-left{display:flex;align-items:center;gap:10px}
.header-logo{font-size:20px;filter:drop-shadow(0 0 8px rgba(167,139,250,.5))}
.header-title{font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:2px}
.header-right{display:flex;align-items:center;gap:8px}
.header-my-emoji{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:18px}
.header-avatar{width:33px;height:33px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;transition:background .2s}
.header-avatar:hover{background:rgba(255,255,255,.14)}
.logout-btn{background:none;border:none;color:#666;font-size:15px;cursor:pointer;padding:4px 6px;border-radius:6px;transition:color .2s}
.logout-btn:hover{color:#f87171}

/* ── Daily banner ── */
.daily-banner{padding:12px 22px;background:rgba(14,14,22,.7);border-bottom:1px solid rgba(255,255,255,.04)}
.banner-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:7px}
.emoji-row{display:flex;gap:7px;flex-wrap:wrap}
.emoji-chip{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:18px;transition:all .2s}
.emoji-chip.active{transform:scale(1.06)}
.chip-emoji{font-size:17px}
.chip-count{font-size:12px;font-weight:600}

/* ── Nav ── */
.nav-tabs{display:flex;gap:4px;padding:9px 22px;background:#0a0a0f}
.nav-tab{position:relative;padding:7px 16px;border-radius:18px;border:none;background:transparent;color:#666;font-size:14px;cursor:pointer;font-family:inherit;transition:all .2s}
.nav-tab:hover{color:#aaa;background:rgba(255,255,255,.05)}
.nav-tab.active{background:rgba(56,189,248,.12);color:#38bdf8}
.nav-badge{position:absolute;top:2px;right:4px;background:#f472b6;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center}

/* ── Feed layout ── */
.app-layout{display:flex;gap:22px;padding:18px 22px;max-width:1180px;margin:0 auto;width:100%;flex:1}
.main-feed{flex:1;min-width:0;max-width:620px}
.sidebar{width:310px;flex-shrink:0;display:flex;flex-direction:column;gap:14px}

/* ── New post ── */
.new-post-box{background:rgba(18,18,28,.7);border:1px solid rgba(255,255,255,.07);border-radius:17px;padding:14px;margin-bottom:14px;backdrop-filter:blur(8px)}
.new-post-row{display:flex;gap:10px;align-items:flex-start}
.new-post-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 13px;color:#fff;font-size:14px;font-family:inherit;resize:none;outline:none;transition:border .2s}
.new-post-input:focus{border-color:rgba(56,189,248,.3)}
.new-post-input::placeholder{color:#555}
.new-post-actions{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-left:42px}
.post-hint{font-size:11px;color:#444}
.post-submit-btn{padding:7px 20px;border-radius:10px;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s,transform .1s}
.post-submit-btn:hover{opacity:.85;transform:translateY(-1px)}

/* ── Post card ── */
.post-card{background:rgba(18,18,28,.7);border:1px solid rgba(255,255,255,.06);border-radius:17px;padding:14px;margin-bottom:10px;backdrop-filter:blur(8px);transition:border-color .2s}
.post-card:hover{border-color:rgba(255,255,255,.11)}
.group-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:11px;font-size:11px;font-weight:600;border:1px solid;margin-bottom:9px;text-transform:uppercase;letter-spacing:.5px}
.post-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.avatar-circle{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer}
.avatar-circle.small{width:32px;height:32px;font-size:16px}
.username{font-weight:600;font-size:14px;color:#fff;cursor:pointer;transition:color .2s}
.username:hover{color:#38bdf8}
.timestamp{font-size:11px;color:#555}
.post-text{color:#ccc;font-size:15px;line-height:1.5;margin-bottom:10px}

/* ── Media placeholder ── */
.post-media-placeholder{background:linear-gradient(135deg,rgba(25,25,40,.9),rgba(18,18,32,.95));border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:28px;margin-bottom:10px;display:flex;flex-direction:column;align-items:center;gap:6px}
.post-media-label{color:#666;font-size:12px}

/* ── Meme ── */
.meme-box{background:linear-gradient(135deg,rgba(30,30,50,.9),rgba(20,20,35,.95));border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:22px;margin-bottom:10px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.meme-text{color:#fff;font-size:17px;font-weight:600;font-family:'Bebas Neue',sans-serif;letter-spacing:1px}

/* ── Reactions ── */
.reactions-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}
.reaction-btn{display:flex;align-items:center;gap:4px;padding:3px 9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:14px;color:#aaa;font-size:13px;cursor:pointer;transition:all .15s;font-family:inherit}
.reaction-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.16)}
.reaction-btn span{color:#666;font-size:12px}
.add-reaction{color:#555;font-size:15px}

/* ── Actions ── */
.post-actions{display:flex;gap:12px;margin-bottom:3px}
.action-btn{background:none;border:none;color:#666;font-size:13px;cursor:pointer;padding:3px 0;font-family:inherit;transition:color .2s}
.action-btn:hover{color:#38bdf8}
.share-action:hover{color:#fb923c}

/* ── Comments ── */
.comments-section{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
.comment{display:flex;gap:7px;margin-bottom:6px}
.comment-user{color:#fff;font-weight:600;font-size:13px;white-space:nowrap}
.comment-text{color:#999;font-size:13px}
.comment-input-row{display:flex;gap:7px;margin-top:7px}
.comment-input{flex:1;padding:7px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:13px;font-family:inherit;outline:none}
.comment-input:focus{border-color:rgba(56,189,248,.3)}
.comment-input::placeholder{color:#555}
.comment-send{padding:7px 13px;border-radius:10px;border:none;background:rgba(56,189,248,.15);color:#38bdf8;cursor:pointer;font-size:15px;transition:background .2s}
.comment-send:hover{background:rgba(56,189,248,.25)}

/* ── Sidebar cards ── */
.sidebar-card{background:rgba(18,18,28,.8);border:1px solid rgba(255,255,255,.06);border-radius:17px;padding:16px;backdrop-filter:blur(8px)}
.panel-title{color:#fff;font-size:15px;margin-bottom:12px}
.group-members-avatars{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.mini-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:transform .2s}
.mini-avatar:hover{transform:scale(1.18)}

/* ── Challenge ── */
.challenge-btn{padding:7px 14px;border-radius:10px;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s}
.challenge-btn:hover{opacity:.85}
.challenge-done{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);border-radius:10px;padding:9px 11px;color:#34d399;font-size:13px}

/* ── Leaderboard ── */
.lb-row{background:rgba(255,255,255,.03);border-radius:11px;padding:10px;margin-bottom:7px;display:flex;align-items:center;gap:9px}
.lb-rank{font-size:17px;min-width:26px}

/* ── Chat screen ── */
.chat-screen-wrap{position:relative;flex:1;min-height:0;height:calc(100vh - 140px);overflow:hidden}

/* list page */
.chat-list-page{height:100%;overflow-y:auto;padding:18px 22px;background:#0a0a0f}
.chat-list-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.chat-list-title{color:#fff;font-size:20px;font-weight:700}
.chat-section-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1.4px;margin-bottom:8px}
.convo-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:15px;border:none;background:transparent;width:100%;cursor:pointer;transition:background .18s;text-align:left;margin-bottom:4px}
.convo-row:hover{background:rgba(255,255,255,.06)}
.convo-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.convo-avatar.group-avatar{font-size:22px}
.convo-info{flex:1;min-width:0}
.convo-name{display:block;color:#fff;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.convo-last{display:block;color:#666;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.convo-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0}
.convo-time{color:#555;font-size:11px}
.convo-members{color:#777;font-size:11px;font-weight:500}

.new-dm-btn{padding:8px 14px;border-radius:10px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:#666;font-size:13px;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap}
.new-dm-btn:hover{border-color:#38bdf8;color:#38bdf8}
.new-dm-dropdown{background:rgba(18,18,28,.96);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px;margin-top:8px;box-shadow:0 12px 40px rgba(0,0,0,.5);position:absolute;z-index:10;width:260px;right:0}
.new-dm-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:none;background:transparent;width:100%;color:#ccc;font-size:14px;cursor:pointer;transition:background .15s;font-family:inherit;text-align:left}
.new-dm-row:hover{background:rgba(255,255,255,.08)}

/* ── full-screen chat overlay ── */
.chat-fullscreen{
  position:absolute;inset:0;z-index:20;
  background:#0e0e14;
  display:flex;flex-direction:column;
  transform:translateX(100%);
  transition:transform .3s cubic-bezier(.4,0,.2,1);
  will-change:transform;
}
.chat-fullscreen.visible{transform:translateX(0)}

/* top bar */
.chat-fs-topbar{
  display:flex;align-items:center;gap:12px;
  padding:12px 18px;
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.chat-back-btn{
  background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;
  padding:4px 8px;border-radius:8px;transition:color .2s,background .2s;
  line-height:1;display:flex;align-items:center;justify-content:center;
}
.chat-back-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.chat-hdr-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
.chat-hdr-emoji-badge{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.chat-hdr-text{display:flex;flex-direction:column}
.chat-hdr-name{color:#fff;font-weight:600;font-size:16px}
.chat-hdr-sub{color:#666;font-size:12px}

/* messages scroll */
.chat-fs-messages{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:8px}
.msg-row{display:flex;gap:8px;align-items:flex-end}
.msg-row.me{justify-content:flex-end}
.msg-mini-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.msg-bubble{max-width:75%;padding:9px 13px;border-radius:18px;border:1px solid transparent}
.msg-bubble:not(.me){background:rgba(255,255,255,.07);border-radius:18px 18px 18px 5px}
.msg-bubble.me{border-radius:18px 18px 5px 18px}
.msg-sender-name{display:block;font-size:11px;font-weight:700;margin-bottom:2px}
.msg-text{color:#eee;font-size:14px;line-height:1.45;display:block}
.msg-time{display:block;color:#555;font-size:10px;margin-top:4px;text-align:right}
.msg-bubble:not(.me) .msg-time{text-align:left}

.msg-shared-post{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:10px;margin-bottom:4px}
.msg-shared-label{display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
.msg-shared-text{color:#ddd;font-size:13px;margin:4px 0}
.msg-shared-meta{display:flex;justify-content:space-between;font-size:11px;color:#666;margin-top:4px}

/* input bar */
.chat-fs-inputbar{
  display:flex;gap:10px;align-items:center;
  padding:14px 18px;
  border-top:1px solid rgba(255,255,255,.07);
  background:#0e0e14;
  flex-shrink:0;
}
.chat-input{flex:1;padding:11px 16px;border-radius:24px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border .2s}
.chat-input:focus{border-color:rgba(56,189,248,.35)}
.chat-input::placeholder{color:#555}
.chat-send-btn{width:42px;height:42px;border-radius:50%;border:none;font-size:18px;cursor:pointer;transition:opacity .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.chat-send-btn:hover{opacity:.8}

/* ── Share modal ── */
.share-modal{max-width:400px}
.share-title{color:#fff;font-size:18px;margin-bottom:6px}
.share-preview-text{color:#777;font-size:13px;margin-bottom:16px;font-style:italic}
.share-section{margin-bottom:14px}
.share-section-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block}
.share-search{width:100%;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:13px;font-family:inherit;outline:none;margin-bottom:8px}
.share-search:focus{border-color:rgba(56,189,248,.3)}
.share-search::placeholder{color:#555}
.share-dm-list{display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto}
.share-target{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;border:none;background:transparent;width:100%;cursor:pointer;transition:background .15s;text-align:left}
.share-target:hover{background:rgba(255,255,255,.07)}
.share-target.group-target{border:1px solid;margin-bottom:4px}
.share-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.share-target-info{flex:1;min-width:0}
.share-target-name{display:block;color:#fff;font-size:14px;font-weight:600}
.share-target-sub{display:block;color:#666;font-size:12px}
.share-arrow{color:#555;font-size:16px}

/* ── Profile page ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center}
.modal-content{background:rgba(18,18,28,.95);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:28px 24px;width:90%;max-width:380px;position:relative;max-height:82vh;overflow-y:auto}
.modal-close{position:absolute;top:12px;right:16px;background:none;border:none;color:#666;font-size:17px;cursor:pointer;z-index:2}
.modal-close:hover{color:#fff}

.profile-page-modal{background:rgba(14,14,22,.97);border:1px solid rgba(255,255,255,.08);border-radius:22px;width:92%;max-width:460px;max-height:85vh;overflow-y:auto;position:relative}
.profile-banner{height:100px;border-radius:22px 22px 0 0;width:100%}
.profile-avatar-wrap{display:flex;justify-content:center;margin-top:-42px;position:relative;z-index:1}
.profile-avatar-big{width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:#1a1a2e}
.profile-name-row{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px}
.profile-username{color:#fff;font-size:20px;font-weight:700}
.profile-emoji-badge{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:14px}
.profile-bio{color:#888;font-size:14px;text-align:center;margin:6px 0 14px;padding:0 20px}
.profile-stats-row{display:flex;justify-content:center;gap:10px;margin-bottom:16px}
.pstat{flex:1;max-width:100px;background:rgba(255,255,255,.04);border-radius:12px;padding:10px 6px;text-align:center}
.pstat-num{display:block;font-size:19px;font-weight:700;color:#fff}
.pstat-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.4px}
.follow-action-btn{display:block;width:calc(100% - 40px);margin:0 auto 16px;padding:10px;border-radius:12px;border:2px solid #38bdf8;background:transparent;color:#38bdf8;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.follow-action-btn:hover{background:rgba(56,189,248,.15)}
.follow-action-btn.following{background:rgba(56,189,248,.12);border-color:#38bdf8;color:#fff}

.profile-posts-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 12px 16px}
.profile-empty{color:#666;text-align:center;font-size:14px;padding:20px;grid-column:1/-1}
.profile-grid-post{background:rgba(255,255,255,.05);border-radius:12px;overflow:hidden;min-height:120px;display:flex;flex-direction:column;position:relative}
.pgp-inner{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;gap:6px}
.pgp-text{color:#ccc;font-size:12px;text-align:center;line-height:1.35}
.pgp-media-icon{position:absolute;top:7px;right:8px;font-size:15px}
.pgp-meme-badge{position:absolute;top:7px;left:7px;background:rgba(251,146,60,.25);color:#fb923c;font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px;letter-spacing:.5px}
.pgp-footer{display:flex;justify-content:space-between;padding:6px 10px;background:rgba(0,0,0,.25);font-size:11px;color:#888}

/* ── Responsive ── */
/* ── Group Invitations ───────────────────────────────────────────────────── */
.invitation-banner{background:#1a1a2e;border:2px solid;border-radius:12px;padding:14px 18px;margin:0 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;animation:slideDown 0.3s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.invitation-content{display:flex;align-items:center;gap:12px;flex:1}
.invitation-emoji{font-size:32px}
.invitation-text{color:#fff;font-size:14px;line-height:1.4}
.invitation-actions{display:flex;gap:8px}
.invitation-accept{padding:8px 18px;border-radius:10px;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.2s;font-family:inherit}
.invitation-accept:hover{opacity:0.85}
.invitation-decline{padding:8px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s;font-family:inherit}
.invitation-decline:hover{background:rgba(255,255,255,0.1);color:#fff}
.invite-group-btn{padding:5px 12px;border-radius:8px;border:1px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit}
.invite-group-btn:hover{opacity:0.8;transform:scale(1.05)}
.invite-modal{max-width:440px}
.invite-title{color:#fff;font-size:18px;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.invite-subtitle{color:#888;font-size:13px;margin-bottom:16px}
.invite-user-list{display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;margin-top:12px}
.invite-user-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;transition:all 0.2s}
.invite-user-row:hover{background:rgba(255,255,255,0.06)}
.invite-user-info{display:flex;align-items:center;gap:10px;flex:1}
.invite-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px}
.invite-user-name{display:block;color:#fff;font-size:14px;font-weight:600}
.invite-user-group{display:block;color:#666;font-size:12px;margin-top:2px}
.invite-send-btn{padding:6px 14px;border-radius:8px;border:1px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit}
.invite-send-btn:hover{opacity:0.85}
.invite-empty{text-align:center;color:#666;padding:32px;font-size:14px}
.invite-success{background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);color:#34d399;padding:10px;border-radius:10px;text-align:center;font-size:13px;margin-top:12px}

/* ── Email Verification ──────────────────────────────────────────────────── */
.verify-success{background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);color:#34d399;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;text-align:center}
.verify-info{text-align:center;margin-bottom:18px;padding:14px;background:rgba(255,255,255,0.03);border-radius:12px}
.verify-email{color:#38bdf8;font-size:15px;font-weight:600;margin-bottom:4px}
.verify-hint{color:#666;font-size:12px;margin-top:4px}
.code-display-box{background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(167,139,250,0.1));border:2px solid rgba(56,189,248,0.3);border-radius:14px;padding:18px;margin:16px 0;text-align:center}
.code-display-label{color:#38bdf8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.code-display-value{font-size:36px;font-weight:700;color:#fff;letter-spacing:12px;font-family:'Courier New',monospace;text-shadow:0 0 20px rgba(56,189,248,0.5);margin:12px 0;user-select:all;cursor:pointer}
.code-display-note{color:#888;font-size:11px;line-height:1.5;margin-top:10px}
.verify-code-input{text-align:center;font-size:24px;letter-spacing:8px;font-weight:700;font-family:'Courier New',monospace}
.resend-code-btn{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#aaa;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.2s;margin-top:8px}
.resend-code-btn:hover{background:rgba(255,255,255,0.1);color:#fff}
.resend-code-btn:disabled{opacity:0.5;cursor:not-allowed}
.back-to-register-btn{width:100%;padding:8px;border-radius:8px;border:none;background:transparent;color:#666;font-size:12px;cursor:pointer;font-family:inherit;transition:color 0.2s;margin-top:8px}
.back-to-register-btn:hover{color:#38bdf8}

@media(max-width:900px){.app-layout{flex-direction:column}.sidebar{width:100%;flex-direction:row;flex-wrap:wrap}.sidebar>*{flex:1;min-width:230px}.chat-screen-wrap{height:calc(100vh - 130px)}}
@media(max-width:600px){.app-layout{padding:12px}.app-header{padding:9px 14px}.daily-banner{padding:9px 14px}.nav-tabs{padding:7px 10px}.chat-screen-wrap{height:calc(100vh - 120px)}.chat-list-page{padding:14px}.profile-posts-grid{grid-template-columns:1fr}.new-dm-dropdown{width:220px}}
`;

if (typeof document !== "undefined" && !document.getElementById("emojisocial-v2")) {
  const s = document.createElement("style");
  s.id = "emojisocial-v2";
  s.textContent = CSS;
  document.head.appendChild(s);
}
