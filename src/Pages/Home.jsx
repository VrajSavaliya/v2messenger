/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Chat from "./Chat";
import Status from "./Status";
import Profile from "./Profile";
import Group from "./Group";

import {
  MessageCircle,
  BarChart3,
  User,
  LogOut,
  Users
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const name = localStorage.getItem("userName");
    const phone = localStorage.getItem("userPhone");

    if (!name || !phone) {
      navigate("/Login", { replace: true });
    } else {
      setUserName(name);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Do you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000",
      confirmButtonText: "Logout",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/", { replace: true });
      }
    });
  };

  const renderPage = () => {
    const phone = localStorage.getItem("userPhone");
    if (activeTab === "chat") return <Chat currentUserPhone={phone} />;
    if (activeTab === "status") return <Status />;
    if (activeTab === "profile") return <Profile />;
    if (activeTab === "group") return <Group currentUserPhone={phone} />;
  };

  return (
    <>
      <style>{`
        body { margin: 0; background: #f5f5f5; }

        /* 🔥 Welcome Animation */
        @keyframes welcomeFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-animate {
          animation: welcomeFade 0.6s ease-out;
        }

        .app-container {
          height: 100vh;
          display: flex;
          flex-direction: ${isMobile ? "column" : "row"};
          font-family: "Segoe UI", sans-serif;
          overflow: hidden;
        }

        .header {
          background: linear-gradient(135deg, #111827, #000000);
          color: #ffffff;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1f2937;
          z-index: 10;
        }

        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #d1d5db; }

        .main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .content {
          flex: 1;
          padding: 20px;
          background: #f5f5f5;
          overflow-y: auto;
          position:relative;
          padding-bottom: ${isMobile ? "80px" : "20px"};
        }

        .navigation {
          background: #ffffff;
          display: flex;
          border-color: #e5e7eb;
          border-style: solid;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }

        @media (max-width: 767px) {
          .navigation {
            position: fixed;
            bottom: 0;
            left:0;
            right:0;
            width: 100%;
            height: 64px;
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            border-top-width: 1px;
            z-index:1000;
          }
        }

        @media (min-width: 768px) {
          .navigation {
            width: 260px;
            flex-direction: column;
            justify-content: flex-start;
            padding: 20px 0;
            border-right-width: 1px;
            height: 100vh;
          }
          .nav-logo {
             padding: 0 24px 30px;
             border-bottom: 1px solid #eee;
             margin-bottom: 20px;
          }
        }

        .nav-btn {
          background: none;
          border: none;
          color: #64748b;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          width: ${isMobile ? "auto" : "100%"};
          padding: ${isMobile ? "0" : "12px 24px"};
          flex-direction: ${isMobile ? "column" : "row"};
          gap: 12px;
          font-size: ${isMobile ? "12px" : "16px"};
        }

        .nav-btn:hover {
          color: #2563eb;
          background: ${isMobile ? "none" : "#f8fafc"};
        }

        .nav-btn.active {
          color: #2563eb;
          background: ${isMobile ? "none" : "#eff6ff"};
          font-weight: 600;
        }

        .nav-btn.logout {
          color: #ef4444;
          margin-top: ${isMobile ? "0" : "auto"};
        }
      `}</style>

      <div className="app-container">
        {!isMobile && (
          <div className="navigation">
            <div className="nav-logo welcome-animate">
              <h1 style={{ fontSize: "20px", color: "#000" }}>V2Messenger</h1>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Welcome, <strong>{userName}</strong>
              </p>
            </div>
            <NavContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleLogout={handleLogout}
            />
          </div>
        )}

        <div className="main-wrapper">
          {isMobile && (
            <div className="header welcome-animate">
              <div>
                <h1>V2Messenger</h1>
                <p>
                  Welcome, <strong>{userName}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="content">{renderPage()}</div>

          {isMobile && (
            <div className="navigation">
              <NavContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NavContent({ activeTab, setActiveTab, handleLogout }) {
  return (
    <>
      <button className={`nav-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
        <MessageCircle size={20} />
        <span>Chat</span>
      </button>

      <button className={`nav-btn ${activeTab === "group" ? "active" : ""}`} onClick={() => setActiveTab("group")}>
        <Users size={20} />
        <span>Group</span>
      </button>

      <button className={`nav-btn ${activeTab === "status" ? "active" : ""}`} onClick={() => setActiveTab("status")}>
        <BarChart3 size={20} />
        <span>Status</span>
      </button>

      <button className={`nav-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
        <User size={20} />
        <span>Profile</span>
      </button>

      <button className="nav-btn logout" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </>
  );
}

export default Home;
