/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import EmojiPicker from "emoji-picker-react";

const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";

const THEMES = {
  modern: {
    name: "Slate Work",
    sentBg: "#611f69",
    sentText: "#ffffff",
    receivedBg: "#f8f8f8",
    receivedText: "#1d1c1d",
    chatBg: "#ffffff",
    headerText: "#1d1c1d",
    timeSent: "rgba(255, 255, 255, 0.7)",
    timeReceived: "#616061"
  },
  midnight: {
    name: "Arctic Enterprise",
    sentBg: "#464eb8",
    sentText: "#ffffff",
    receivedBg: "#f0f0f0",
    receivedText: "#242424",
    chatBg: "#ffffff",
    headerText: "#242424",
    timeSent: "rgba(255, 255, 255, 0.6)",
    timeReceived: "#808080"
  },
  sunset: {
    name: "Emerald Finance",
    sentBg: "#064e3b", 
    sentText: "#ecfdf5",
    receivedBg: "#f3f4f6",
    receivedText: "#111827",
    chatBg: "#ffffff",
    headerText: "#064e3b",
    timeSent: "rgba(236, 253, 245, 0.6)",
    timeReceived: "#6b7280"
  }
};

function Group({ currentUserPhone }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesAreaRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const [usersList, setUsersList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const isAdmin = selectedGroup?.admin === currentUserPhone;

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      const map = {};
      res.data.forEach(u => {
        map[u.phoneNumber] = u.username;
      });
      setUsersMap(map);
      setUsersList(res.data); 
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedGroup) return;
    setSelectedFile(file);
    shouldAutoScrollRef.current = true;

    const formData = new FormData();
    formData.append("groupId", selectedGroup._id);
    formData.append("sender", currentUserPhone);
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_URL}/group/message/send`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Media send failed", err);
    }
    e.target.value = "";
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/group/list/${currentUserPhone}`
      );
      setGroups(res.data);
      if (selectedGroup) {
        const updated = res.data.find(
          g => g._id === selectedGroup._id
        );
        if (updated) {
          setSelectedGroup(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 3000);
    return () => clearInterval(interval);
  }, [currentUserPhone]);

  const fetchMessages = async () => {
    if (!selectedGroup) return;
    try {
      const res = await axios.get(`${API_URL}/group/messages/${selectedGroup._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedGroup?._id]);

  useEffect(() => {
    if (selectedGroup && shouldAutoScrollRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, selectedGroup?._id]);

  const handleDeleteGroupMessage = async (messageId) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This message will be deleted for everyone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(
        `${API_URL}/group/message/delete/${messageId}`,
        { senderPhone: currentUserPhone }
      );
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, text: "This message was deleted", fileUrl: "", fileType: "text" }
            : m
        )
      );
    } catch (err) {
      Swal.fire("Error", "You can only delete your own message", "error");
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      return Swal.fire("Error", "Geolocation not supported", "error");
    }

    Swal.fire({
      title: "Share Location?",
      text: "Send your current location to the group.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Share"
    }).then((result) => {
      if (!result.isConfirmed) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

          const formData = new FormData();
          formData.append("groupId", selectedGroup._id);
          formData.append("sender", currentUserPhone);
          formData.append("text", "📍 Live Location");
          formData.append("fileType", "location");
          formData.append("fileUrl", mapUrl);

          try {
            const res = await axios.post(
              `${API_URL}/group/message/send`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessages(prev => [...prev, res.data]);
            Swal.fire({
              icon: "success",
              title: "Location Shared",
              timer: 1200,
              showConfirmButton: false
            });
          } catch (err) {
            console.error(err);
          }
        },
        () => {
          Swal.fire("Error", "Unable to get location", "error");
        }
      );
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    setShowEmojiPicker(false);
    shouldAutoScrollRef.current = true;
    const formData = new FormData();
    formData.append("groupId", selectedGroup._id);
    formData.append("sender", currentUserPhone);
    formData.append("text", newMessage);
    if (selectedFile) formData.append("file", selectedFile);

    setNewMessage("");
    setSelectedFile(null);

    try {
      const res = await axios.post(`${API_URL}/group/message/send`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const { value: groupName } = await Swal.fire({
        title: "Create Group",
        input: "text",
        inputPlaceholder: "Enter group name",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value || !value.trim()) return "Group name is required";
        }
      });

      if (!groupName) return;

      const availableUsers = usersList.filter(
        u => u.phoneNumber !== currentUserPhone
      );

      if (availableUsers.length === 0) {
        Swal.fire("No users", "No users available to add", "info");
        return;
      }

      const html = `
        <div style="text-align:left; max-height:300px; overflow:auto;">
          ${availableUsers
            .map(
              u => `
                <label style="display:flex; gap:8px; margin-bottom:6px; cursor:pointer;">
                  <input type="checkbox" value="${u.phoneNumber}" />
                  ${u.username} (${u.phoneNumber})
                </label>
              `
            )
            .join("")}
        </div>
      `;

      const { value: members } = await Swal.fire({
        title: "Add Members",
        html,
        showCancelButton: true,
        preConfirm: () => {
          return Array.from(
            document.querySelectorAll("input[type=checkbox]:checked")
          ).map(el => el.value);
        }
      });

      await axios.post(`${API_URL}/group/create`, {
        name: groupName.trim(),
        admin: currentUserPhone,
        members: members || []
      });

      Swal.fire("Success", "Group created successfully 🎉", "success");
      fetchGroups();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create group", "error");
    }
  };

  const handleAddMember = async () => {
    const availableUsers = usersList.filter(
      u =>
        !selectedGroup.members.includes(u.phoneNumber) &&
        u.phoneNumber !== currentUserPhone
    );

    if (availableUsers.length === 0) {
      Swal.fire("No users", "All users are already in this group", "info");
      return;
    }

    const options = {};
    availableUsers.forEach(u => {
      options[u.phoneNumber] = `${u.username} (${u.phoneNumber})`;
    });

    const { value: selectedPhone } = await Swal.fire({
      title: "Add Member",
      input: "select",
      inputOptions: options,
      inputPlaceholder: "Select a user",
      showCancelButton: true
    });

    if (!selectedPhone) return;

    try {
      await axios.put(`${API_URL}/group/add-user`, {
        groupId: selectedGroup._id,
        admin: currentUserPhone,
        phone: selectedPhone
      });
      Swal.fire("Added!", "Member added successfully", "success");
      fetchGroups();
    } catch (err) {
      Swal.fire("Error", "Failed to add member", "error");
    }
  };

  const handleRemoveMember = async (phone) => {
    const ok = await Swal.fire({
      title: "Remove member?",
      text: phone,
      icon: "warning",
      showCancelButton: true
    });
    if (!ok.isConfirmed) return;
    await axios.put(`${API_URL}/group/remove-user`, {
      groupId: selectedGroup._id,
      admin: currentUserPhone,
      phone
    });
    fetchGroups();
  };

  const handleLeaveGroup = async () => {
    const confirm = await Swal.fire({
      title: "Leave group?",
      text: "You will no longer receive messages from this group",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Leave",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${API_URL}/group/leave`, {
        groupId: selectedGroup._id,
        phone: currentUserPhone
      });
      await Swal.fire({
        icon: "success",
        title: "You left the group",
        timer: 2000,
        showConfirmButton: false
      });
      setSelectedGroup(null);
      setMessages([]);
      fetchGroups();
    } catch (err) {
      Swal.fire("Error", "Failed to leave group", "error");
    }
  };

  const handleDeleteGroup = async () => {
    const ok = await Swal.fire({
      title: "Delete group?",
      text: "This will delete all messages permanently",
      icon: "warning",
      showCancelButton: true
    });
    if (!ok.isConfirmed) return;
    await axios.delete(`${API_URL}/group/delete/${selectedGroup._id}`, {
      data: { admin: currentUserPhone }
    });
    setSelectedGroup(null);
    fetchGroups();
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0f172a; font-family: "Inter", "Segoe UI", sans-serif; }
        .chat-bg { height: calc(100vh - 60px); display: flex; justify-content: center; align-items: center; overflow: hidden; }
        .chat-container { width: 100%; height: 100%; background: #fff; display: flex; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .chat-container { width: 95%; max-width: 1300px; height: 90%; border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.25); } }
        .sidebar-box { flex: 1; background: #f8fafc; display: flex; flex-direction: column; border-right: 1px solid #e5e7eb; transition: transform 0.3s ease; position: absolute; width: 100%; height: 100%; z-index: 10; transform: ${selectedGroup ? "translateX(-100%)" : "translateX(0)"}; }
        @media (min-width: 768px) { .sidebar-box { flex: 0.28; position: relative; transform: none; width: auto; } }
        .sidebar-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
        .sidebar-header h3 { margin: 0; font-size: 18px; }
        .create-group-btn { background: #2563eb; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .search-wrapper { padding: 12px 16px; }
        .search-input { width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid #d1d5db; outline: none; font-size: 14px; }
        .user-list-item { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; transition: background 0.2s; }
        .user-list-item:hover { background: #e5e7eb; }
        .user-list-item.selected { background: #dbeafe; border-left: 4px solid #2563eb; }
        .chat-box { flex: 1; display: flex; flex-direction: column; padding: 18px; background: ${THEMES[currentTheme].chatBg}; transition: background 0.3s, transform 0.3s ease; position: relative; width: 100%; height: 100%; transform: ${selectedGroup ? "translateX(0)" : "translateX(100%)"}; }
        @media (min-width: 768px) { .chat-box { flex: 0.72; transform: none; } }
        .chat-header { display: flex; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
        .back-btn { border: none; background: transparent; font-size: 24px; cursor: pointer; margin-right: 10px; color: #1f2937; display: flex; align-items: center; }
        @media (min-width: 768px) { .back-btn { display: none; } }
        .chat-header-info { flex: 1; overflow: hidden; }
        .chat-header h3 { margin: 0; font-size: 16px; color: ${THEMES[currentTheme].headerText}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-toggle { font-size: 12px; color: #2563eb; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .theme-selector-container { margin-left: auto; display: flex; gap: 8px; align-items: center; }
        .theme-circle { width: 18px; height: 18px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
        .theme-circle.active { border-color: #000; }
        .admin-actions { display: flex; gap: 5px; margin-left: 10px; }
        .admin-btn { padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; border: 1px solid #d1d5db; background: white; }
        .admin-btn.delete { color: #ef4444; border-color: #fecaca; }
        .messages-area { flex: 1; padding: 14px 6px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .message-row { display: flex; width: 100%; }
        .message-row.sent { justify-content: flex-end; }
        .message-row.received { justify-content: flex-start; }
        .message-bubble { display: flex; flex-direction: column; max-width: 85%; position: relative; }
        @media (min-width: 768px) { .message-bubble { max-width: 70%; } }
        .sent .message-bubble { align-items: flex-end; }
        .received .message-bubble { align-items: flex-start; }
        .message-content { position: relative; padding: 10px 14px 28px 14px; border-radius: 16px; font-size: 14px; line-height: 1.4; min-width: 80px; min-height: 42px; }
        .sent .message-content { background: ${THEMES[currentTheme].sentBg}; color: ${THEMES[currentTheme].sentText}; border-bottom-right-radius: 4px; }
        .received .message-content { background: ${THEMES[currentTheme].receivedBg}; color: ${THEMES[currentTheme].receivedText}; border-bottom-left-radius: 4px; }
        .message-text { display: block; word-break: break-word; white-space: pre-wrap; }
        .message-meta { position: absolute; bottom: 6px; right: 10px; font-size: 10px; opacity: 0.75; white-space: nowrap; pointer-events: none; }
        .delete-text { position: absolute; bottom: 6px; left: 10px; font-size: 11px; cursor: pointer; color: #f87171; opacity: 0; transition: opacity 0.2s ease; white-space: nowrap; }
        .message-row.sent:hover .delete-text { opacity: 1; }
        .sender-name { font-size: 11px; font-weight: 600; margin-bottom: 2px; color: #64748b; margin-left: 4px; }
        .message-input-area { display: flex; align-items: center; gap: 8px; padding: 12px 0 0 0; border-top: 1px solid #e5e7eb; background: #fff; }
        .input-wrapper { flex: 1; }
        .input-wrapper input { width: 100%; height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid #d1d5db; outline: none; font-size: 14px; }
        .send-btn { height: 40px; padding: 0 16px; border-radius: 20px; background: #1e88e5; color: #fff; border: none; cursor: pointer; font-weight: 500; font-size: 14px; }
        .file-btn { width: 38px; height: 38px; border-radius: 50%; background-color: #f3f4f6; border: 1px solid #d1d5db; font-size: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #2563eb; flex-shrink: 0; }
        .members-overlay { position: absolute; top: 65px; left: 5%; width: 90%; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; z-index: 20; max-height: 60%; overflow-y: auto; }
        @media (min-width: 768px) { .members-overlay { width: 250px; left: 20px; top: 75px; } }
        .member-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      `}</style>

      <div className="chat-bg">
        <div className="chat-container">
          {/* SIDEBAR */}
          <div className="sidebar-box">
            <div className="sidebar-header">
              <h3>👥 Groups</h3>
              <button className="create-group-btn" onClick={handleCreateGroup}>+</button>
            </div>
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search groups..." 
                className="search-input" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredGroups.map((g) => (
                <div 
                  key={g._id} 
                  onClick={() => {
                    shouldAutoScrollRef.current = true;
                    setSelectedGroup(g);
                  }}
                  className={`user-list-item ${selectedGroup?._id === g._id ? "selected" : ""}`}
                >
                  <div className="user-info">
                    <strong>{g.name}</strong>
                    <br/>
                    <small>{g.members.length} members</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="chat-box">
            {selectedGroup ? (
              <>
                <div className="chat-header">
                  <button
                    className="back-btn"
                    onClick={() => {
                      setSelectedGroup(null);
                      setMessages([]);
                      setShowMembers(false);
                    }}
                  >
                    ←
                  </button>

                  <div className="chat-header-info">
                    <h3>{selectedGroup.name}</h3>
                    <span className="member-toggle" onClick={() => setShowMembers(!showMembers)}>
                      👥 View Members
                    </span>
                  </div>

                  <div className="theme-selector-container">
                    {Object.keys(THEMES).map((key) => (
                      <div 
                        key={key} 
                        className={`theme-circle ${currentTheme === key ? "active" : ""}`} 
                        style={{ backgroundColor: THEMES[key].sentBg }} 
                        onClick={() => setCurrentTheme(key)} 
                        title={THEMES[key].name} 
                      />
                    ))}
                  </div>

                  <div className="admin-actions">
                    {isAdmin ? (
                      <>
                        <button className="admin-btn" onClick={handleAddMember}>Add</button>
                        <button className="admin-btn delete" onClick={handleDeleteGroup}>Delete</button>
                      </>
                    ) : (
                      <button className="admin-btn delete" onClick={handleLeaveGroup}>Leave</button>
                    )}
                  </div>
                </div>

                {showMembers && (
                  <div className="members-overlay">
                    <div style={{ padding: "12px", fontWeight: "bold", borderBottom: "1px solid #eee", display: 'flex', justifyContent: 'space-between' }}>
                      Members
                      <span style={{cursor: 'pointer'}} onClick={() => setShowMembers(false)}>✕</span>
                    </div>
                    {selectedGroup.members.map(m => (
                      <div key={m} className="member-item">
                        <span>
                          {usersMap[m] || "Unknown"} <small style={{ color: "#64748b" }}>({m})</small>
                          {m === selectedGroup.admin && <small style={{ color: "blue", marginLeft: 6 }}>(Admin)</small>}
                        </span>
                        {isAdmin && m !== currentUserPhone && (
                          <button onClick={() => handleRemoveMember(m)} style={{ color: "red", border: "none", background: "none", cursor: "pointer", fontSize: "10px" }}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="messages-area"
                  ref={messagesAreaRef}
                  onScroll={() => {
                    const el = messagesAreaRef.current;
                    if (!el) return;
                    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
                    shouldAutoScrollRef.current = atBottom;
                  }}
                >
                  {messages.map((m, i) => {
                    const isMe = m.sender === currentUserPhone;
                    return (
                      <div key={i} className={`message-row ${isMe ? "sent" : "received"}`}>
                        <div className="message-bubble">
                          {!isMe && <span className="sender-name">{usersMap[m.sender] || m.sender}</span>}
                          <div className="message-content">
                            {m.text && <span className="message-text">{m.text}</span>}
                            
                            {/* ADDED LOCATION LOGIC HERE */}
                    {m.fileType === "location" && (() => {
  const coords = m.fileUrl.split("?q=")[1];
  const [lat, lng] = coords.split(",");

  const mapImage = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${lng},${lat}&z=15&size=450,200&l=map&pt=${lng},${lat},pm2rdm`;

  return (
    <div
      onClick={() => window.open(m.fileUrl, "_blank")}
      style={{
        width: "240px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        marginTop: "6px",
        background: "#fff"
      }}
    >
      <img
        src={mapImage}
        alt="Location"
        style={{
          width: "100%",
          height: "140px",
          objectFit: "cover"
        }}
      />

      <div style={{ padding: "10px" }}>
        <div style={{ fontWeight: "600", fontSize: "14px" }}>
          📍 Live Location
        </div>

        <div style={{ fontSize: "12px", color: "#2563eb" }}>
          Open in Google Maps
        </div>
      </div>
    </div>
  );
})()}

                            {m.fileType === "image" && (
                              <img src={m.fileUrl} alt="sent" style={{ maxWidth: "100%", borderRadius: "12px", marginTop: "6px" }} />
                            )}
                            {m.fileType === "video" && (
                              <video src={m.fileUrl} controls style={{ maxWidth: "100%", borderRadius: "12px", marginTop: "6px" }} />
                            )}
                           {m.fileType === "pdf" && (
  <a 
    href={m.fileUrl} // Just use the clean URL
    target="_blank" 
    rel="noreferrer"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px",
      marginTop: "6px",
      background: "#f1f5f9",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      textDecoration: "none",
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "14px",
      width: "fit-content"
    }}
  >
    <span style={{ fontSize: "24px" }}>📄</span>
    <span>Open PDF Document</span>
  </a>
)}
{/* ------------------------------ */}
                            {/* FIXED: Using isDeleted to match the backend schema */}
{isMe && !m.isDeleted && (
  <span className="delete-text" onClick={() => handleDeleteGroupMessage(m._id)}>Delete</span>
)}
                            <div className="message-meta">
                              <span className="message-time">{formatTime(m.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input-area">
                  {showEmojiPicker && (
                    <div style={{ position: "absolute", bottom: "80px", left: "20px", zIndex: 1000 }}>
                      <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
                    </div>
                  )}

                  <button type="button" className="file-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>+</button>
                  <button type="button" className="file-btn" onClick={() => setShowEmojiPicker((prev) => !prev)}>😊</button>
                  <button type="button" className="file-btn" title="Send Location" onClick={handleSendLocation}>📍</button>
                  
                  <div className="input-wrapper">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..."
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                  </div>
                  <button className="send-btn" onClick={handleSendMessage}>Send</button>
                  <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,.pdf,application/pdf" onChange={handleFileSelect} />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <span style={{ fontSize: '50px' }}>👥</span>
                <p>Select a group to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Group;