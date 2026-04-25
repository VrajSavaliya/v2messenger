import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";
const DEFAULT_DP = "https://via.placeholder.com/40?text=👤";

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Status() {
  const feedRef = useRef(null);
  const phoneNumber = localStorage.getItem("userPhone");
  const username = localStorage.getItem("userName");

  const [file, setFile] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      const map = {};
      res.data.forEach((u) => {
        map[u.phoneNumber] = {
          username: u.username,
          profilePicture: u.profilePicture || DEFAULT_DP,
        };
      });
      setUserMap(map);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchStatus = async () => {
    const scrollTop = feedRef.current?.scrollTop || 0;

    try {
      const res = await axios.get(`${API_URL}/status`);
      setStatuses(res.data);

      setTimeout(() => {
        if (feedRef.current) {
          feedRef.current.scrollTop = scrollTop;
        }
      }, 0);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStatus();

    const intervalId = setInterval(fetchStatus, 2000); 

    return () => clearInterval(intervalId);
  }, []);

  const uploadStatus = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("status", file);
    formData.append("phoneNumber", phoneNumber);
    formData.append("username", username);

    try {
      await axios.post(`${API_URL}/status/upload`, formData);
      setFile(null);
      fetchStatus();
    } catch (err) {
      console.error("Error uploading status:", err);
    }
  };

  const deleteStatus = async (id) => {
    const result = await Swal.fire({
      title: "Delete Status?",
      text: "This status will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "No, Keep it",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/status/${id}`);
      
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Your status has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchStatus();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete status",
      });
    }
  };

  const getUser = (phone) =>
    userMap[phone] || { username: "Unknown", profilePicture: DEFAULT_DP };

  const filteredStatuses = statuses.filter((s) => {
    const user = getUser(s.phoneNumber);
    return user.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #0f172a;
          font-family: "Inter", "Segoe UI", sans-serif;
        }

        .status-bg {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
        }

        .status-container {
          width: 100%;
          max-width: 1300px;
          height: 90vh;
          background: #fff;
          display: flex;
          flex-direction: row;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }

        /* ===== SIDEBAR ===== */
        .sidebar-box {
          width: 320px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e7eb;
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

        .upload-section-sidebar {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }

        .upload-trigger-btn {
          width: 100%;
          padding: 12px;
          background: #427f2c;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
        }

        .upload-trigger-btn:hover { background: #1e3a15; }

        .file-preview-sidebar {
            margin-top: 10px;
            font-size: 12px;
            color: #407e29;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f0fdf4;
            padding: 8px;
            border-radius: 8px;
            border: 1px solid #dcfce7;
        }

        /* ===== FEED AREA ===== */
        .feed-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          overflow-y: auto;
        }

        .feed-header {
          padding: 18px;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 10;
        }

        .feed-header h3 { margin: 0; font-size: 16px; color: #1d1c1d; }

        .content-area {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .section-title {
          width: 100%;
          max-width: 600px;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ===== STATUS CARD ===== */
        .status-card {
          width: 100%;
          max-width: 600px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .status-card-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
        }

        .status-user-dp {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 12px;
          object-fit: cover;
          border: 2px solid #407e29;
          padding: 2px;
        }

        .status-user-info strong { display: block; font-size: 14px; }
        .status-user-info small { color: #6b7280; font-size: 12px; }

        .status-media-container {
          width: 100%;
          background: #000;
          display: flex;
          justify-content: center;
          min-height: 300px;
        }

        .status-media-container img, .status-media-container video {
          max-width: 100%;
          max-height: 500px;
          object-fit: contain;
          display: block;
        }

        .status-card-footer {
          padding: 12px 16px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #f3f4f6;
        }

        .delete-text-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .empty-state {
            text-align: center;
            color: #9ca3af;
            margin: 40px 0;
            font-size: 14px;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .status-container {
            flex-direction: column;
            height: 100vh;
            border-radius: 0;
          }
          .sidebar-box {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }
          .status-bg {
            padding: 0;
          }
          .status-media-container {
            min-height: 200px;
          }
        }

        .feed-box::-webkit-scrollbar { width: 6px; }
        .feed-box::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
      `}</style>

      <div className="status-bg">
        <div className="status-container">
          {/* LEFT SIDEBAR */}
          <div className="sidebar-box">
            <h3>🔁 Updates</h3>
            
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search updates..." 
                className="search-input" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="upload-section-sidebar">
              <button 
                className="upload-trigger-btn" 
                onClick={() => fileInputRef.current.click()}
              >
                <span>📷</span> Add Status
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                accept="image/*,video/*" 
                onChange={(e) => setFile(e.target.files[0])} 
              />

              {file && (
                <div className="file-preview-sidebar">
                  <span>📎 {file.name.substring(0, 15)}...</span>
                  <div style={{display:'flex', gap: '8px'}}>
                    <button onClick={uploadStatus} style={{background:'#611f69', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer'}}>Post</button>
                    <button onClick={() => setFile(null)} style={{background:'none', border:'none', color:'red', cursor:'pointer', fontWeight:'bold'}}>X</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px', fontSize: '12px', color: '#6b7280' }}>
                Status updates disappear after 24 hours.
            </div>
          </div>

          {/* RIGHT FEED AREA */}
          <div className="feed-box" ref={feedRef}>
            <div className="feed-header">
              <h3>Recent Statuses</h3>
            </div>

            <div className="content-area">
              {/* MY UPDATES */}
              <div className="section-title">My Updates</div>
              {filteredStatuses.filter(s => s.phoneNumber === phoneNumber).length > 0 ? (
                filteredStatuses.filter(s => s.phoneNumber === phoneNumber).map(s => {
                  const user = getUser(s.phoneNumber);
                  return (
                    <div key={s._id} className="status-card">
                      <div className="status-card-header">
                        <img src={user.profilePicture} className="status-user-dp" alt="dp" onError={(e) => e.target.src = DEFAULT_DP} />
                        <div className="status-user-info">
                          <strong>You</strong>
                          <small>{formatTimeAgo(s.createdAt)}</small>
                        </div>
                      </div>
                      <div className="status-media-container">
                        {s.mediaType === "image" ? (
                          <img src={s.mediaUrl} alt="status" />
                        ) : (
                          <video src={s.mediaUrl} controls />
                        )}
                      </div>
                      <div className="status-card-footer">
                        <button className="delete-text-btn" onClick={() => deleteStatus(s._id)}>DELETE</button>
                      </div>
                    </div>
                  );
                })
              ) : <div className="empty-state">No updates from you.</div>}

              {/* RECENT UPDATES */}
              <div className="section-title">Recent Updates</div>
              {filteredStatuses.filter(s => s.phoneNumber !== phoneNumber).length > 0 ? (
                filteredStatuses.filter(s => s.phoneNumber !== phoneNumber).map(s => {
                  const user = getUser(s.phoneNumber);
                  return (
                    <div key={s._id} className="status-card">
                      <div className="status-card-header">
                        <img src={user.profilePicture} className="status-user-dp" alt="dp" onError={(e) => e.target.src = DEFAULT_DP} />
                        <div className="status-user-info">
                          <strong>{user.username}</strong>
                          <small>{formatTimeAgo(s.createdAt)}</small>
                        </div>
                      </div>
                      <div className="status-media-container">
                        {s.mediaType === "image" ? (
                          <img src={s.mediaUrl} alt="status" />
                        ) : (
                          <video src={s.mediaUrl} controls />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : <div className="empty-state">No recent updates found.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Status;