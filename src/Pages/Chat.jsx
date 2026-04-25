/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import Swal from "sweetalert2";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";


const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";
const DEFAULT_DP = "https://via.placeholder.com/40?text=👤"; 
const ZOOM_DP_SIZE = "300px"; 

const THEMES = {
  modern: {
    name: "Slate Work",
    sentBg: "#611f69", // Slack-style purple
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
    sentBg: "#464eb8", // Professional Cobalt
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
  },
  terracotta: {
  name: "Desert Clay",
  sentBg: "#9a3412", // Rich burnt orange
  sentText: "#fff7ed",
  receivedBg: "#fff7ed",
  receivedText: "#431407",
  chatBg: "#ffffff",
  headerText: "#9a3412",
  timeSent: "rgba(255, 247, 237, 0.7)",
  timeReceived: "#9a3412"
},
royal: {
  name: "Royal Blue",
  sentBg: "#1e3a8a",
  sentText: "#eff6ff",
  receivedBg: "#f1f5f9",
  receivedText: "#020617",
  chatBg: "#ffffff",
  headerText: "#1e3a8a",
  timeSent: "rgba(239, 246, 255, 0.6)",
  timeReceived: "#475569"
},
rose: {
  name: "Rose Soft",
  sentBg: "#9f1239",
  sentText: "#fff1f2",
  receivedBg: "#fdf2f8",
  receivedText: "#500724",
  chatBg: "#ffffff",
  headerText: "#9f1239",
  timeSent: "rgba(255, 241, 242, 0.6)",
  timeReceived: "#9d174d"
}

};

function Chat({ currentUserPhone }) {
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomType, setZoomType] = useState("dp"); // "dp" for profile, "media" for chat images
  const [zoomedImage, setZoomedImage] = useState(null); 
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [profileModalUser, setProfileModalUser] = useState(null);
const [profileBio, setProfileBio] = useState("");
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [isListening, setIsListening] = useState(false);
const recognitionRef = useRef(null);
const [chatWallpaper, setChatWallpaper] = useState(null);
const wallpaperInputRef = useRef(null);
const [showFunVideo, setShowFunVideo] = useState(false);
const [isTyping, setIsTyping] = useState(false);
const typingTimeoutRef = useRef(null);

const lastTypingSentRef = useRef(0);


const downloadChat = () => {
  if (!messages.length) return;

  let chatText = "";

  messages.forEach((msg) => {
    const sender =
      msg.sender === currentUserPhone ? "You" : selectedUser.username;

    const time = new Date(msg.createdAt).toLocaleString();

    let content = msg.text || "";

    if (msg.fileType === "image") content = "[Image]";
    if (msg.fileType === "video") content = "[Video]";
    if (msg.fileType === "pdf") content = "[PDF Document]";
    if (msg.fileType === "location") content = "[Location]";
    if (msg.fileType === "payment") content = `[Payment ${msg.text}]`;

    chatText += `${time} - ${sender}: ${content}\n`;
  });

  const blob = new Blob([chatText], { type: "text/plain" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${selectedUser.username}_chat.txt`;
  a.click();

  URL.revokeObjectURL(url);
};


const handleSendLocation = () => {
  if (!navigator.geolocation) {
    return Swal.fire("Error", "Geolocation is not supported by your browser", "error");
  }

  Swal.fire({
    title: "Share Location?",
    text: "This will send your current coordinates to the chat.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Share",
  }).then((result) => {
    if (result.isConfirmed) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          const formData = new FormData();
          formData.append("sender", currentUserPhone);
          formData.append("receiver", selectedUser.phoneNumber);
          formData.append("text", "📍 Live Location"); 
          formData.append("fileUrl", mapUrl); 
          formData.append("fileType", "location");

          try {
            await axios.post(`${API_URL}/message/send`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            Swal.fire({ icon: "success", title: "Location Shared", timer: 1000, showConfirmButton: false });
          } catch (err) {
            console.error(err);
          }
        },
        (error) => {
          Swal.fire("Error", "Unable to retrieve your location. Make sure GPS is on.", "error");
        }
      );
    }
  });
};
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  
  const handleEmojiClick = (emojiData) => {
  setNewMessage((prev) => prev + emojiData.emoji);
};

  const scrollToBottomInstant = () => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, 100); // slight delay so DOM is ready
};


  const handleCloseChat = () => {
    setSelectedUser(null);
    setConversationId(null);
    setMessages([]);

  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteMessage = async (messageId) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This message will be deleted for everyone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // red
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.put(`${API_URL}/message/delete/${messageId}`, {
        senderPhone: currentUserPhone
      });

      if (res.data.success) {
        // ✅ Update UI instantly
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  isDeleted: true,
                  text: "This message was deleted",
                  fileUrl: "",
                  fileType: "text"
                }
              : msg
          )
        );

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Message deleted successfully.",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error deleting message", err);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete the message.",
      });
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

useEffect(() => {
  if (!conversationId || !selectedUser) return;

  const interval = setInterval(async () => {
    const res = await axios.get(
      `${API_URL}/typing/${conversationId}/${selectedUser.phoneNumber}`
    );
    setIsTyping(res.data.typing);
  }, 100);

  return () => clearInterval(interval);
}, [conversationId, selectedUser]);



  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Speech Recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN"; // Indian English 🇮🇳

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setNewMessage((prev) => prev + " " + transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
    setIsListening(false);
  };

  recognitionRef.current = recognition;
}, []);



 useEffect(() => {
  const fetchUnread = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/unread-counts/${currentUserPhone}`
      );
      const counts = {};
      res.data.forEach(item => {
        counts[item._id] = item.count;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error(err);
    }
  };

  fetchUnread();
  const interval = setInterval(fetchUnread, 2000);

  return () => clearInterval(interval);
}, [currentUserPhone]);

  

  // ✅ REFRESH USER LIST EVERY 2 SECONDS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users`);
        const filtered = res.data.filter((u) => u.phoneNumber !== currentUserPhone);
        
        // Only update state if the data is actually different to prevent unnecessary re-renders
        setUserList(prevList => {
          if (JSON.stringify(prevList) === JSON.stringify(filtered)) {
            return prevList;
          }
          return filtered;
        });
      } catch (err) {
        console.error("Error refreshing user list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers(); // Initial fetch
    const userInterval = setInterval(fetchUsers, 2000); // Refresh every 2 seconds

    return () => clearInterval(userInterval);
  }, [currentUserPhone]);

 const fetchMessages = React.useCallback(async (convId) => {
  if (!convId || !selectedUser) return;

  try {
    const res = await axios.get(`${API_URL}/messages/${convId}`);

    // 🛑 Ignore stale response
    if (convId !== conversationId) return;

    setMessages(res.data);

    // ✅ AUTO MARK AS SEEN if chat is open
    const hasUnseen = res.data.some(
      msg =>
        msg.sender === selectedUser.phoneNumber &&
        !msg.seen &&
        !msg.isDeleted
    );

    if (hasUnseen) {
      await axios.put(`${API_URL}/messages/mark-seen`, {
        conversationId: convId,
        receiver: currentUserPhone
      });

      // 🔥 Instant UI update
      setMessages(prev =>
        prev.map(msg =>
          msg.sender === selectedUser.phoneNumber
            ? { ...msg, seen: true }
            : msg
        )
      );
    }

  } catch (err) {
    console.error(err);
  }
}, [conversationId, selectedUser, currentUserPhone]);


useEffect(() => {
  console.log("Wallpaper updated:", chatWallpaper);
}, [chatWallpaper]);


 useEffect(() => {
  if (!conversationId) return;

  fetchMessages(conversationId); // initial load

  const interval = setInterval(() => {
    fetchMessages(conversationId);
  }, 1500);

  return () => clearInterval(interval);
}, [conversationId, fetchMessages]);


  const toggleMic = () => {
  if (!recognitionRef.current) return;

  if (isListening) {
    recognitionRef.current.stop();
  } else {
    recognitionRef.current.start();
  }
};


  const handleUserClick = async (user) => {
  setSelectedUser(user);
  setConversationId(null);   // ✅ ADD THIS
  setMessages([]);   
  setChatWallpaper(null); // ✅ RESET OLD WALLPAPER         // ✅ clear old messages
  prevMsgCountRef.current = 0;

  try {
    const res = await axios.get(`${API_URL}/conversations/${currentUserPhone}`);
    let conversation = res.data.find((c) =>
      c.members.includes(user.phoneNumber)
    );

    if (conversation) {
      setConversationId(conversation._id);
      await fetchMessages(conversation._id);
      const wpRes = await axios.get(
  `${API_URL}/chat/wallpaper/${conversation._id}/${currentUserPhone}`
);
setChatWallpaper(wpRes.data);
      // MARK AS SEEN (backend)
      await axios.put(`${API_URL}/messages/mark-seen`, {
        conversationId: conversation._id,
        receiver: currentUserPhone
      });

      // ✅ FRONTEND-ONLY FIX (IMPORTANT)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === user.phoneNumber && !msg.isDeleted
            ? { ...msg, seen: true }
            : msg
        )
      );

      setUnreadCounts((prev) => ({
        ...prev,
        [user.phoneNumber]: 0
      }));
    }
  } catch (err) {
    console.error(err);
  }
};


  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    setShowEmojiPicker(false);
    
    const formData = new FormData();
    formData.append("sender", currentUserPhone);
    formData.append("receiver", selectedUser.phoneNumber);
    formData.append("text", newMessage);

    if (selectedFile) {
        formData.append("file", selectedFile);
        
        // Explicitly set fileType for PDFs so the backend 
        // and database stay synchronized
        if (selectedFile.type === "application/pdf") {
            formData.append("fileType", "pdf");
        }
    }

    // Clear UI state
    setNewMessage("");
    setSelectedFile(null);

    try {
        const res = await axios.post(`${API_URL}/message/send`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        // Update conversation ID if this was the first message
        if (!conversationId) {
            const convRes = await axios.get(`${API_URL}/conversations/${currentUserPhone}`);
            let newConv = convRes.data.find((c) => c.members.includes(selectedUser.phoneNumber));
            if (newConv) setConversationId(newConv._id);
        }
    } catch (err) {
        console.error("Error sending message:", err);
        // Optional: Notify user if the upload failed
    }
};

  const handleZoomDP = async (e, user) => {
  e.stopPropagation();
  try {
    const res = await axios.get(`${API_URL}/profiledata/${user.phoneNumber}`);
    setProfileBio(res.data.bio || "No bio available");
    setProfileModalUser(user);
  } catch (err) {
    console.error(err);
  }
};


  const closeZoomDP = () => setZoomedImage(null);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      scrollToBottom();
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, selectedUser]);

  const filteredUsers = userList.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .unread-dot {
          width: 10px;
          height: 10px;
          background-color: #2563eb; 
          border-radius: 50%;
          margin-left: auto; 
        }

        .user-info-container {
          display: flex;
          align-items: center;
          flex: 1;
        }

        body {
          margin: 0;
          background: #0f172a;
          font-family: "Inter", "Segoe UI", sans-serif;
          /* Fix height for mobile browsers */
          height: 100vh;
          height: -webkit-fill-available;
          overflow: hidden;
        }

        .chat-bg {
          height: 100vh;
          height: -webkit-fill-available;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .chat-container {
          width: 100%;
          height: 100%;
          background: #fff;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        /* Desktop specific styling */
        @media (min-width: 768px) {
          .chat-container {
            width: 95%;
            height: 85vh;
            border-radius: 18px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          }
        }

        /* ===== SIDEBAR ===== */
        .sidebar-box {
          flex: 1;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e7eb;
          transition: transform 0.3s ease;
          width: 100%;
          height: 100%;
        }

        /* Hide sidebar on mobile when chat is open */
        @media (max-width: 767px) {
          .sidebar-box {
            position: absolute;
            z-index: 10;
            left: 0;
            top: 0;
            transform: ${selectedUser ? 'translateX(-100%)' : 'translateX(0)'};
          }
        }

        @media (min-width: 768px) {
          .sidebar-box {
            flex: 0.35;
            position: relative;
            transform: none !important;
          }
        }

        .sidebar-box h3 {
          padding: 20px;
          margin: 0;
          font-size: 18px;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-wrapper {
          padding: 12px 16px;
        }

        .search-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          outline: none;
          font-size: 14px;
        }

        .typing-indicator {
          font-size: 12px;
          color: #16a34a;
          animation: pulse 1.2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }


        .user-list-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .payment-bubble {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white;
  padding: 14px;
  border-radius: 16px;
  min-width: 220px;
  max-width: 260px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 5px solid #22c55e;
}
.download-chat-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #ffffff;
  border: 1.5px solid #0f172a;

  cursor: pointer;
  font-size: 16px;

  transition: all 0.2s ease;
}

.download-chat-btn:hover {
  background: #2563eb;
  color: #ffffff;
  transform: translateY(-1px);
}

.download-chat-btn:active {
  transform: scale(0.95);
}
.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
  .payment-title {
  font-size: 13px;
  opacity: 0.8;
}
  .payment-success {
  color: #22c55e;
  font-weight: bold;
  font-size: 12px;
}

        .payment-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 700;
          font-size: 13px;
        }

        .payment-amount {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 1px;
}
.payment-user {
  font-size: 13px;
  opacity: 0.9;
}

.payment-divider {
  height: 1px;
  background: rgba(255,255,255,0.2);
}
        .payment-footer {
  font-size: 11px;
  opacity: 0.7;
}

        .user-list-item:hover {
          background: #e5e7eb;
        }

        .user-list-item.selected {
          background: #dbeafe;
          border-left: 4px solid #2563eb;
        }

        .user-dp {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          margin-right: 12px;
          object-fit: cover;
        }

        /* ===== CHAT AREA ===== */
        .chat-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: ${THEMES[currentTheme].chatBg};
          height: 100%; 
          overflow: hidden; 
          position: relative;
        }

        /* Mobile full screen chat */
        @media (max-width: 767px) {
          .chat-box {
            position: fixed;
            inset: 0;
            z-index: 20;
            width: 100vw;
            height: 100vh;
            height: -webkit-fill-available;
            transform: ${selectedUser ? 'translateX(0)' : 'translateX(100%)'};
            transition: transform 0.3s ease-out;
          }
        }

        .msg-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          padding: 6px;
        }

        @media (min-width: 768px) {
          .chat-box {
            flex: 0.65;
            transform: none !important;
          }
        }

        .chat-header {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
          flex-shrink: 0; 
          z-index: 30;
          height: 60px;
        }

        .close-chat-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-right: 8px;
          color: #64748b;
        }

        @media (min-width: 768px) {
          .close-chat-btn { display: none; }
        }

        .close-chat-btn svg {
          width: 20px;
          height: 20px;
          stroke-width: 2.5px;
        }

        .chat-header-dp {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          margin-right: 12px;
          cursor: pointer;
        }

        .chat-header-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .chat-header-info h3 {
          margin: 0;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: ${THEMES[currentTheme].headerText};
        }

        /* Unified Selector for Wallpaper + Themes */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .theme-selector-container {
          display: none; /* Hide dots on mobile to save space */
          align-items: center;
          gap: 6px;
        }
        @media (min-width: 768px) {
            .theme-selector-container { display: flex; }
        }

        .theme-circle {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 1.5px solid #e2e8f0;
          transition: transform 0.2s;
        }

        .theme-circle.active { 
          border-color: #0f172a; 
          transform: scale(1.1);
        }

        .wallpaper-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #ffffff;
  border: 1.5px solid #0f172a;

  cursor: pointer;
  font-size: 16px;

  transition: all 0.2s ease;
}

.wallpaper-icon-btn:hover {
  background: #2563eb;
  color: #ffffff;
  transform: translateY(-1px);
}

.wallpaper-icon-btn:active {
  transform: scale(0.95);
}

        /* ===== MESSAGES AREA ===== */
        .messages-area {
          flex: 1; 
          padding: 15px;
          overflow-y: auto; 
          background: ${THEMES[currentTheme].chatBg};
          display: flex;
          flex-direction: column;
          /* Ensure smooth scrolling on iOS */
          -webkit-overflow-scrolling: touch;
        }

        .message-bubble {
          display: flex;
          margin-bottom: 12px;
          width: 100%;
        }

        .sent { justify-content: flex-end; }
        .received { justify-content: flex-start; }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          border-radius: 14px;
          max-width: 85%;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          position: relative;
        }

        @media (min-width: 768px) {
          .message-content { max-width: 65%; }
        }

        .sent .message-content {
          background: ${THEMES[currentTheme].sentBg};
          color: ${THEMES[currentTheme].sentText};
          border-bottom-right-radius: 2px;
        }

        .received .message-content {
          background: ${THEMES[currentTheme].receivedBg};
          color: ${THEMES[currentTheme].receivedText};
          border-bottom-left-radius: 2px;
        }

        .message-time {
          font-size: 10px;
          opacity: 0.7;
          align-self: flex-end;
        }

        .status-ticks { font-size: 12px; margin-left: 4px; }
        .tick-grey { color: #94a3b8; }
        .tick-blue { color: #34b7f1; }

        .chat-media {
          max-width: 200px;
          max-height: 300px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          object-fit: cover;
        }

        /* ===== INPUT AREA ===== */
        .message-input-area {
          display: flex;
          align-items: center;
          gap: 5px; 
          padding: 8px 10px;
          background: #fff;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .input-wrapper { flex: 1; display: flex; align-items: center; background: #f1f5f9; border-radius: 25px; padding: 0 12px; }

        .file-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          cursor: pointer;
          font-size: 16px;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1e88e5;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0; /* Hide text, use icon logic or just keep small */
        }
        .send-btn::after { content: '➤'; font-size: 16px; }

        .file-preview {
          position: absolute;
          bottom: 60px;
          left: 10px;
          right: 10px;
          padding: 8px 15px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12px;
          z-index: 40;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }

        .dp-zoom-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .zoom-dp {
          width: 80vw;
          height: 80vw;
          max-width: 350px;
          max-height: 350px;
          border-radius: 50%;
          border: 4px solid #fff;
          object-fit: cover;
        }

        .zoom-media {
          max-width: 95%;
          max-height: 90vh;
          border-radius: 8px;
          object-fit: contain;
        }
      `}</style>

        {profileModalUser && (
  <div className="dp-zoom-modal" onClick={() => setProfileModalUser(null)}>
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "16px",
        width: "90%",
        maxWidth: "420px",
        textAlign: "center"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <img
  src={profileModalUser.profilePicture || DEFAULT_DP}
  alt="dp"
  style={{
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "16px",
    border: "4px solid #e5e7eb"
  }}
/>


      <h3 style={{ margin: "5px 0" }}>
        {profileModalUser.username}
      </h3>

      <small style={{ color: "#64748b" }}>
        {profileModalUser.phoneNumber}
      </small>

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          background: "#f8fafc",
          borderRadius: "10px",
          fontSize: "14px",
          color: "#334155"
        }}
      >
        {profileBio}
      </div>

      <button
        onClick={() => setProfileModalUser(null)}
        style={{
          marginTop: "15px",
          padding: "8px 20px",
          border: "none",
          borderRadius: "20px",
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

      {zoomedImage && (
        <div className="dp-zoom-modal" onClick={() => setZoomedImage(null)}>
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className={zoomType === "dp" ? "zoom-dp" : "zoom-media"} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <div className="chat-bg">
        <div className="chat-container">
          {/* Sidebar */}
          <div className="sidebar-box">
            <h3>💬 Chats</h3>
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredUsers.map((user) => (
                <div 
                  key={user.phoneNumber} 
                  onClick={() => handleUserClick(user)} 
                  className={`user-list-item ${selectedUser?.phoneNumber === user.phoneNumber ? "selected" : ""}`}
                >
                  <img src={user.profilePicture || DEFAULT_DP} alt="dp" className="user-dp" />
                  <div className="user-info-container">
                    <div className="user-info">
                      <strong>{user.username}</strong>
                      <br></br>
                      <small>{user.phoneNumber}</small>
                    </div>
                    {unreadCounts[user.phoneNumber] > 0 && selectedUser?.phoneNumber !== user.phoneNumber && (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Box */}
          <div className="chat-box">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <button className="close-chat-btn" onClick={() => setSelectedUser(null)} title="Back to list">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  <img 
                    src={selectedUser.profilePicture || DEFAULT_DP} 
                    alt="dp" 
                    className="chat-header-dp" 
                    onClick={(e) => {
                      setZoomType("dp");
                      handleZoomDP(e, selectedUser);
                    }} 
                  />

                  <div className="chat-header-info">
  <h3>{selectedUser.username}</h3>

  {isTyping && (
    <span
      style={{
        fontSize: "12px",
        color: "#16a34a",
        marginTop: "2px"
      }}
    >
      typing…
    </span>
  )}
</div>
                  <div className="header-actions">
                    {/* Fun Video Button */}
                   <button
  className="download-chat-btn"
  onClick={downloadChat}
  title="Download Chat"
>
  ⬇
</button>
                    <button
                      className="wallpaper-icon-btn"
                      title="Change chat wallpaper"
                      onClick={() => wallpaperInputRef.current.click()}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="4" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </button>
                    <input
  type="file"
  ref={fileInputRef}
  hidden
  accept="image/*,video/*,.pdf" // ✅ Add .pdf
  onChange={(e) => setSelectedFile(e.target.files[0])}
/>
                    <input
                      type="file"
                      ref={wallpaperInputRef}
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        if (!e.target.files[0] || !conversationId) return;

                        const formData = new FormData();
                        formData.append("owner", currentUserPhone);
                        formData.append("conversationId", conversationId);
                        formData.append("type", "image");
                        formData.append("wallpaper", e.target.files[0]);

                        const res = await axios.post(
                          `${API_URL}/chat/wallpaper/set`,
                          formData,
                          { headers: { "Content-Type": "multipart/form-data" } }
                        );

                        setChatWallpaper(res.data);
                      }}
                    />

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
                  </div>
                </div>

                <div
  key={chatWallpaper?.value || "default"}
  className="messages-area"
  style={{
    background:
      chatWallpaper?.type === "image"
        ? `url(${chatWallpaper.value}) center / cover no-repeat`
        : chatWallpaper?.type === "color"
        ? chatWallpaper.value
        : THEMES[currentTheme].chatBg
  }}
>


                  {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.sender === currentUserPhone ? "sent" : "received"}`}>
                      <span className={`message-content ${msg.isDeleted ? "deleted" : ""}`}>
                        {msg.isDeleted ? (
                          <span>🚫 This message was deleted</span>
                        ) : (
                          <>
                            {msg.fileType === "image" && (
                              <img src={msg.fileUrl} className="chat-media" alt="sent" onClick={() => {
                                setZoomType("media");
                                setZoomedImage(msg.fileUrl);
                              }} />
                            )}
                            {msg.fileType === "video" && (
                              <video src={msg.fileUrl} className="chat-media" controls />
                            )}
                            {/* Inside msg.isDeleted ternary check */}
{/* Inside msg.isDeleted ternary check */}
{msg.fileType === "pdf" && (
  <div
    onClick={() => {
      // Direct open is often more reliable for mobile/modern browsers than the iframe viewer
      window.open(msg.fileUrl, "_blank");
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "12px",
      background: "#fff",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
    }}
  >
    <div style={{ 
      width: "40px", 
      height: "40px", 
      background: "#fee2e2", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      borderRadius: "8px" 
    }}>
      <span style={{ fontSize: "20px" }}>📕</span>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "14px" }}>
        PDF Document
      </div>
      <div style={{ fontSize: "11px", color: "#ef4444" }}>
        Click to open document
      </div>
    </div>
  </div>
)}
                            {msg.fileType === "location" && (
                                <div 
                                    onClick={() => window.open(msg.fileUrl, "_blank")}
                                    style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border: "1px solid #e2e8f0",
                                    width: "200px"
                                    }}
                                >
                                    <div style={{ padding: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "18px" }}>📍</span>
                                    <span style={{ fontWeight: "600", color: "#1e293b" }}>Live Location</span>
                                    </div>
                                    <div style={{ padding: "12px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <p style={{ fontSize: "12px", color: "#2563eb", textAlign: "center", width: "100%", margin: 0 }}>View on Google Maps</p>
                                    </div>
                                </div>
                            )}
                           {msg.fileType === "payment" || msg.text.includes("₹") ? (
  <div className="payment-bubble">
    <div className="payment-header">
      <span className="payment-title">💸 Payment</span>
      <span className="payment-success">✓ Success</span>
    </div>
    <div className="payment-amount">₹{msg.text.match(/\d+/)?.[0]}</div>
    <div className="payment-user">
      {msg.sender === currentUserPhone ? `Paid to ${selectedUser.username}` : `Received from ${selectedUser.username}`}
    </div>
    <div className="payment-divider"></div>
    <div className="payment-footer">Txn ID: {msg._id?.slice(-6)} • Secure Transfer</div>
  </div>
) : msg.fileType === "location" ? (
  <div 
    onClick={() => window.open(msg.fileUrl, "_blank")}
    style={{
      background: "#fff",
      borderRadius: "12px",
      overflow: "hidden",
      cursor: "pointer",
      border: "1px solid #e2e8f0",
      width: "220px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}
  >
    <div style={{ padding: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "18px" }}>📍</span>
      <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>Live Location</span>
    </div>
    {/* Map Placeholder Image/Visual */}
    <div style={{ height: "100px", background: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
       <img 
         src="https://maps.gstatic.com/tactile/pane/default_geocode-2x.png" 
         alt="map" 
         style={{ width: "40px", opacity: 0.6, marginBottom: "5px" }} 
       />
       <span style={{ fontSize: "11px", color: "#64748b" }}>Click to view on Maps</span>
    </div>
    <div style={{ padding: "8px", textAlign: "center", borderTop: "1px solid #eee" }}>
       <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "bold" }}>Open Google Maps</span>
    </div>
  </div>
) : (
  <span>{msg.text}</span>
)}

                          </>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {msg.sender === currentUserPhone && !msg.isDeleted && (
                              <div className="status-ticks">
                                {msg.seen ? (
                                  <span className="tick-blue">✓✓</span>
                                ) : (
                                  <span className="tick-grey">✓</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {msg.sender === currentUserPhone && !msg.isDeleted && (
                            <span className="delete-btn" onClick={() => handleDeleteMessage(msg._id)} style={{fontSize:'10px', color:'red', marginLeft:'10px', cursor:'pointer'}}>Delete</span>
                          )}
                        </div>
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedFile && (
                  <div className="file-preview">
                    📎 {selectedFile.name} <button onClick={() => setSelectedFile(null)} style={{border:'none', background:'none', color:'red', cursor:'pointer', fontWeight:'bold'}}>×</button>
                  </div>
                )}

                <div className="message-input-area">
                {showEmojiPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "70px",
                      left: "10px",
                      zIndex: 1000
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      height={300}
                      width={280}
                    />
                  </div>
                )}

                  <button
                    type="button"
                    className="file-btn"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    +
                  </button>
                  <button
                  type="button"
                  className="file-btn"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  😊
                </button>
                <button
                  type="button"
                  className="file-btn"
                  onClick={toggleMic}
                  style={{
                    background: isListening ? "#ef4444" : "#f1f5f9",
                    color: isListening ? "#fff" : "#64748b"
                  }}
                  title="Speak"
                >
                  {isListening ? "🔴" : "🎤"}
                </button>
                <button
                    type="button"
                    className="file-btn"
                    title="Share Location"
                    onClick={handleSendLocation}
                >
                    📍
                </button>

                  <button
  type="button"
  className="file-btn"
  title="Send money"
  onClick={async () => {
    const result = await Swal.fire({
      title: "Send Money",
      input: "number",
      inputLabel: "Enter amount (₹)",
      inputPlaceholder: "e.g. 500",
      showCancelButton: true,
      confirmButtonText: "Pay",
      cancelButtonText: "Cancel",
      inputAttributes: {
        min: 1
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const amount = result.value;

    try {
      // Step 1: Create Order on Backend
      const { data: order } = await axios.post(`${API_URL}/payment/order`, { amount });

      const options = {
        key: "rzp_test_SLp0KcqojNcqPM",
        amount: order.amount,
        currency: "INR",
        name: "V2 Messenger",
        description: `Transfer to ${selectedUser.username}`,
        order_id: order.id,
        handler: async (response) => {
          // Step 2: Verify Payment on Backend
          const verifyRes = await axios.post(`${API_URL}/payment/verify`, response);

          if (verifyRes.data.success) {
            // Step 3: Send confirmation message to chat
            const formData = new FormData();
            formData.append("sender", currentUserPhone);
            formData.append("receiver", selectedUser.phoneNumber);
            formData.append("text", `₹${amount} paid 👌💲`);
            formData.append("fileType", "payment");

            await axios.post(`${API_URL}/message/send`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
            
            Swal.fire("Success", "Payment Sent!", "success");
          }
        },
        prefill: {
          contact: currentUserPhone,
        },
        theme: { color: "#1e88e5" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error("Payment failed", err);
      Swal.fire("Error", "Payment initiation failed", "error");
    }
  }}
>
  ₹
</button>
                  <div className="input-wrapper">
                    <input
                        type="text"
                        className="msg-input"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);

                            if (!conversationId) return;

                            const now = Date.now();

                        if (now - lastTypingSentRef.current > 800) {
                            axios.post(`${API_URL}/typing`, {
                            conversationId,
                            sender: currentUserPhone,
                            typing: true
                            });

                            lastTypingSentRef.current = now;
                        }

                            // debounce stop typing
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                            axios.post(`${API_URL}/typing`, {
                                conversationId,
                                sender: currentUserPhone,
                                typing: false
                            });
                            }, 1500);
                        }}
                        placeholder="Type message..."
                    />
                  </div>

                  <button className="send-btn" onClick={handleSendMessage} title="Send">
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column' }}>
                <span style={{ fontSize: '48px', marginBottom: '10px' }}>💬</span>
                <p>Select a user to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showFunVideo && (
  <div className="dp-zoom-modal" onClick={() => setShowFunVideo(false)}>
    <div 
      style={{ 
        position: 'relative', 
        width: '90%', 
        maxWidth: '800px', 
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }} 
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={() => setShowFunVideo(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          cursor: 'pointer'
        }}
      >✕</button>
      
      <iframe
  width="100%"
  height="100%"
  /* - autoplay=1: Starts immediately
     - loop=1: Enables looping
     - playlist=WIIV8aUMujE: Required for the loop to work
     Note: Mute is removed so sound starts if the browser allows.
  */
  src="https://www.youtube.com/embed/WIIV8aUMujE?autoplay=1&loop=1&playlist=WIIV8aUMujE" 
  title="Fun Video"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
    </div>
  </div>
)}
    </>
  );
}

export default Chat;