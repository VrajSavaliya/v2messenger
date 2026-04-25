/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const DEFAULT_DP = "https://via.placeholder.com/120?text=👤";

function Profile() {
  const phone = localStorage.getItem("userPhone");
  const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";

  const fileInputRef = useRef(null);

  const [user, setUser] = useState({
    username: "",
    phoneNumber: ""
  });

  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [bio, setBio] = useState(""); 
  const [profilePicUrl, setProfilePicUrl] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/user/${phone}`)
      .then((res) => {
        setUser(res.data);
        setNewName(res.data.username);
      })
      .catch(() => {
        Swal.fire("Error", "Failed to load user data", "error");
      });
  }, [phone]);
  
  useEffect(() => {
    axios
      .get(`${API_URL}/profiledata/${phone}`)
      .then((res) => {
        setBio(res.data.bio || "");
        setProfilePicUrl(res.data.profilePicture || "");
      })
      .catch(() => {
        Swal.fire("Error", "Failed to load profile data", "error");
      });
  }, [phone]);

  const handleUpdate = async () => {
    if (!newName) {
      Swal.fire("Error", "Name cannot be empty", "error");
      return;
    }

    try {
      await axios.put(`${API_URL}/user/update`, {
        phoneNumber: phone,
        username: newName,
        pin: newPin || undefined
      });

      localStorage.setItem("userName", newName);
      Swal.fire("Success", "Profile updated", "success");
      setNewPin("");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Update failed", "error");
    }
  };

  const handleDeleteAccount = async () => {
    const { value: pin } = await Swal.fire({
      title: "PERMANENT DELETION",
      text: "This will erase your identity, chats, and media. This cannot be undone.",
      input: "password",
      inputPlaceholder: "Enter 6-digit PIN to confirm",
      inputAttributes: {
        maxlength: 6,
        autocapitalize: "off",
        autocorrect: "off",
        style: "text-align: center; letter-spacing: 5px; font-weight: bold;"
      },
      showCancelButton: true,
      confirmButtonColor: "#000",
      cancelButtonColor: "#fff",
      confirmButtonText: "DELETE ACCOUNT",
      cancelButtonText: "CANCEL",
      reverseButtons: true,
      background: "#fff",
      color: "#000",
      customClass: {
        popup: 'professional-popup',
        confirmButton: 'pro-delete-btn',
        input: 'pro-input'
      }
    });

    if (pin) {
      Swal.fire({
        title: "Processing...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        background: "#fff",
        color: "#000"
      });

      try {
        const response = await axios.post(`${API_URL}/user/delete-account`, {
          phoneNumber: phone,
          pin: pin
        });

        if (response.data.success) {
          localStorage.clear();
          await Swal.fire({
            icon: "success",
            title: "ACCOUNT CLOSED",
            text: "Your data has been successfully wiped from our servers.",
            confirmButtonColor: "#000",
            background: "#fff",
            color: "#000"
          });
          window.location.href = "/";
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "VERIFICATION FAILED",
          text: err.response?.data?.message || "Could not delete account.",
          confirmButtonColor: "#000",
          background: "#fff",
          color: "#000"
        });
      }
    }
  };
  
  const handleBioUpdate = async () => {
    try {
      await axios.put(`${API_URL}/profiledata/update-bio`, {
        phoneNumber: phone,
        bio: bio
      });
    } catch (err) {
      Swal.fire("Error", "Bio update failed", "error");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfilePicUrl(previewUrl);

    const formData = new FormData();
    formData.append("profilePicture", file);
    formData.append("phoneNumber", phone); 

    try {
      await axios.put(`${API_URL}/profiledata/update-pic`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire("Success", "Profile photo updated!", "success");
    } catch(err) {
      Swal.fire("Error", err.response?.data?.message || "File upload failed", "error");
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #0f172a;
          font-family: "Inter", "Segoe UI", sans-serif;
        }

        .profile-bg {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .profile-container {
          width: 100%;
          max-width: 1000px;
          height: auto;
          min-height: 85vh;
          background: #fff;
          display: flex;
          flex-direction: row;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }

        @media (max-width: 768px) {
          .profile-container {
            flex-direction: column;
            height: auto;
          }
        }

        /* ===== SIDEBAR (Left) ===== */
        .sidebar-box {
          flex: 0.35;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          border-right: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .sidebar-box {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            padding: 30px 20px;
          }
        }

        .sidebar-box h3 {
          margin: 0 0 30px 0;
          font-size: 18px;
          color: #1e293b;
        }

        .profile-pic-wrapper {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .profile-pic-wrapper:hover {
          transform: scale(1.05);
        }

        .profile-picture {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #427f2cff;
          padding: 4px;
          background: #fff;
        }

        .edit-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: #427f2cff;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid #fff;
        }

        .bio-section {
          width: 100%;
          margin-top: 30px;
        }

        .bio-section label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .bio-input {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          min-height: 100px;
          outline: none;
          transition: border-color 0.2s;
        }

        .bio-input:focus {
          border-color: #427f2cff;
        }

        /* ===== FORM AREA (Right) ===== */
        .form-box {
          flex: 0.65;
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        @media (max-width: 768px) {
          .form-box {
            padding: 30px 20px;
          }
        }

        .form-box h3 {
          margin: 0 0 30px 0;
          font-size: 22px;
          color: #0f172a;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .input-group input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }

        .input-group input:focus {
          border-color: #427f2cff;
          box-shadow: 0 0 0 3px rgba(66, 127, 44, 0.1);
        }

        .input-group input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .update-btn {
          margin-top: 20px;
          width: 100%;
          padding: 14px;
          background: #427f2cff;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: background 0.2s;
        }

        .update-btn:hover {
          background: #102209ff;
        }

        .danger-zone {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #fee2e2;
        }

        .delete-btn {
          background: none;
          color: #ef4444;
          border: 1px solid #ef4444;
          padding: 12px;
          width: 100%;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          background: #ef4444;
          color: white;
        }

        .info-text {
          margin-top: 20px;
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange} 
        style={{ display: 'none' }}
        accept="image/*"
      />

      <div className="profile-bg">
        <div className="profile-container">
          {/* LEFT SIDEBAR - Identity */}
          <div className="sidebar-box">
            <h3>🙍‍♂️ Identity</h3>
            
            <div className="profile-pic-wrapper" onClick={triggerFileInput}>
              <img 
                src={profilePicUrl || DEFAULT_DP} 
                className="profile-picture" 
                alt="Profile"
                onError={(e) => e.target.src = DEFAULT_DP}
              />
              <div className="edit-badge">📷</div>
            </div>

            <div className="bio-section">
              <label>Bio / Status</label>
              <textarea
                className="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={handleBioUpdate}
                placeholder="Tell the world something about yourself..."
                maxLength={150}
              />
            </div>
            
            <div style={{marginTop: '20px', color: '#64748b', fontSize: '12px', textAlign: 'center'}}>
                This bio is visible to your contacts.
            </div>
          </div>

          {/* RIGHT CONTENT - Settings */}
          <div className="form-box">
            <h3>Account Settings</h3>

            <div className="input-group">
              <label>Phone Number</label>
              <input value={user.phoneNumber} disabled />
            </div>

            <div className="input-group">
              <label>Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="input-group">
              <label>Security PIN (6-digits)</label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Leave blank to keep current"
              />
            </div>

            <button className="update-btn" onClick={handleUpdate}>
              SAVE CHANGES
            </button>

            <div className="danger-zone">
              <button className="delete-btn" onClick={handleDeleteAccount}>
                DELETE ACCOUNT PERMANENTLY
              </button>
            </div>

            <p className="info-text">
              Updates to your profile name and photo are synced across all devices.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;