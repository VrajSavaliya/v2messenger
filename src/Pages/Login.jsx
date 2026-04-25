import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";

function Login() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Screen resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async () => {

    if (phone.length !== 10) {
      Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    if (pin.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid PIN",
        text: "PIN must be exactly 6 digits",
      });
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/login`, {
        phoneNumber: phone,
        pin: pin,
      });

      const userData = response.data.user || {
        username: "User",
        phoneNumber: phone,
      };

      localStorage.setItem("userName", userData.username);
      localStorage.setItem("userPhone", userData.phoneNumber);

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome, ${userData.username}!`,
        confirmButtonColor: "#4CAF50",
      });

      setPhone("");
      setPin("");

      navigate("/home", { replace: true });

    } catch (error) {

      const errorMessage =
        error.response?.data?.message ||
        "Login failed due to a server error.";

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: errorMessage,
        confirmButtonColor: "#d32f2f",
      });
    }
  };

  return (
    <>
      <style>{`

        body {
          margin: 0;
          background: #000;
        }

        .login-bg {
          height: 100vh;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: "Segoe UI", sans-serif;
          padding: 20px;
        }

        .login-card {
          width: 820px;
          height: 420px;
          background: #fff;
          display: flex;
          border-radius: 14px;
          box-shadow: 0 25px 60px rgba(255,255,255,0.1);
          overflow: hidden;
        }

        /* Mobile Layout */

        @media (max-width: 767px) {

          .login-card {
            width: 100%;
            height: auto;
            flex-direction: column;
            padding: 20px;
          }

          .login-left {
            padding: 20px 0;
          }

          .login-left h1 {
            font-size: 20px !important;
          }

          .login-right {
            padding: 20px 10px !important;
          }
        }

        .login-left {
          flex: 1;
          background: #f2f2f2;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        }

        .login-left h1 {
          margin-top: 20px;
          font-size: 26px;
          letter-spacing: 1px;
          color: #000;
        }

        /* VIDEO STYLE */

        .login-left video {
  width: 190px;
  height: 190px;
  object-fit: cover;
  border-radius: 30px;
  background: white;
  padding: 10px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.25);

  /* FIX BLACK LINE */
  overflow: hidden;
  transform: scale(1.03);
}

        .login-right {
          flex: 1;
          padding: 60px 50px;
          background: #fff;
        }

        .login-right h2 {
          margin-bottom: 30px;
          font-weight: 600;
          color: #000;
        }

        .login-right input {

          width: 100%;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 30px;
          border: 1px solid #000;
          background: transparent;
          font-size: 14px;
          outline: none;
          color: #000;
          box-sizing: border-box;
        }

        .login-right button {

          width: 100%;
          padding: 12px;
          background: #000;
          border: none;
          border-radius: 30px;
          color: #fff;
          font-size: 15px;
          cursor: pointer;
          transition: 0.3s;
        }

        .login-right button:hover {
          background: #333;
        }

        .register-link {
          margin-top: 25px;
          font-size: 13px;
          text-align: center;
        }

        .register-link a {
          color: #000;
          text-decoration: none;
          font-weight: 600;
        }

      `}</style>

      <div className="login-bg">

        <div className="login-card">

          {/* LEFT SIDE */}

          <div className="login-left">

            <video autoPlay loop muted playsInline preload="auto">
              <source
                src="https://res.cloudinary.com/dfglchdhs/video/upload/v1772365423/v2messenger/chat/1772365408212.mp4"
                type="video/mp4"
              />
            </video>

            <h1>V2Messenger</h1>

          </div>


          {/* RIGHT SIDE */}

          <div className="login-right">

            <h2>{isMobile ? "Login" : "Member Login"}</h2>

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
              maxLength={10}
            />

            <input
              type="password"
              placeholder="6-digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, ""))
              }
              maxLength={6}
            />

            <button onClick={handleLogin}>
              LOGIN
            </button>

            <p className="register-link">
              New user?{" "}
              <Link to="/register">
                Create account →
              </Link>
            </p>

          </div>

        </div>

      </div>
    </>
  );
}

export default Login;