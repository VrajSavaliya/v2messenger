import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://v2messenger-backend.onrender.com";

function Register() {

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRegister = async () => {

    if (!username || !phoneNumber || !pin || !confirmPin) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required",
      });
      return;
    }

    if (!/^\d{10,}$/.test(phoneNumber)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Please enter a valid phone number",
      });
      return;
    }

    if (pin.length !== 6 || confirmPin.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid PIN",
        text: "PIN must be exactly 6 digits",
      });
      return;
    }

    if (pin !== confirmPin) {
      Swal.fire({
        icon: "error",
        title: "PIN Mismatch",
        text: "PIN and Confirm PIN do not match",
      });
      return;
    }

    try {

      const response = await axios.post(`${API_URL}/register`, {
        username,
        phoneNumber,
        pin,
      });

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: response.data.message,
        confirmButtonColor: "#000",
      }).then(() => navigate("/"));

      setUsername("");
      setPhoneNumber("");
      setPin("");
      setConfirmPin("");

    } catch (error) {

      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Server error",
      });

    }
  };

  return (
    <>
      <style>{`

        body {
          margin:0;
          background:#000;
        }

        .register-bg {
          height:100vh;
          background:#000;
          display:flex;
          justify-content:center;
          align-items:center;
          font-family:"Segoe UI",sans-serif;
          padding:20px;
        }

        .register-card {
          width:820px;
          height:520px;
          background:#fff;
          display:flex;
          border-radius:14px;
          box-shadow:0 25px 60px rgba(255,255,255,0.15);
          overflow:hidden;
        }


        /* MOBILE */

        @media(max-width:767px){

          .register-card{
            width:100%;
            height:auto;
            flex-direction:column;
            padding:20px;
          }

          .logo-box{
            width:120px !important;
            height:120px !important;
          }

          .register-left h1{
            font-size:20px !important;
          }

          .register-right{
            padding:20px 10px !important;
          }

        }


        .register-left{
          flex:1;
          background:#f2f2f2;
          display:flex;
          justify-content:center;
          align-items:center;
          flex-direction:column;
        }


        .register-left h1{
          margin-top:20px;
          font-size:26px;
          letter-spacing:1px;
          color:#000;
        }


        /* VIDEO LOGO FIX */

        .logo-box{

          width:200px;
          height:200px;
          border-radius:30px;
          overflow:hidden;
          background:white;
          box-shadow:0 20px 50px rgba(0,0,0,0.25);

          display:flex;
          justify-content:center;
          align-items:center;

        }


        .logo-box video{

          width:220px;
          height:220px;
          object-fit:cover;

        }


        .register-right{
          flex:1;
          padding:50px;
          background:#fff;
        }


        .register-right h2{
          margin-bottom:25px;
          font-weight:600;
          color:#000;
        }


        .register-right input{

          width:100%;
          padding:12px 16px;
          margin-bottom:18px;
          border-radius:30px;
          border:1px solid #000;
          background:transparent;
          font-size:14px;
          outline:none;
          color:#000;
          box-sizing:border-box;

        }


        .register-right button{

          width:100%;
          padding:12px;
          background:#000;
          border:none;
          border-radius:30px;
          color:#fff;
          font-size:15px;
          cursor:pointer;
          transition:0.3s;

        }


        .register-right button:hover{

          background:#333;

        }


        .login-link{

          margin-top:22px;
          font-size:13px;
          text-align:center;

        }


        .login-link a{

          color:#000;
          text-decoration:none;
          font-weight:600;

        }

      `}</style>


      <div className="register-bg">

        <div className="register-card">


          {/* LEFT */}

          <div className="register-left">

            <div className="logo-box">

              <video autoPlay loop muted playsInline preload="auto">

                <source
                  src="https://res.cloudinary.com/dfglchdhs/video/upload/v1772365423/v2messenger/chat/1772365408212.mp4"
                  type="video/mp4"
                />

              </video>

            </div>

            <h1>V2Messenger</h1>

          </div>



          {/* RIGHT */}

          <div className="register-right">

            <h2>
              {isMobile ? "Create Account" : "Register Member"}
            </h2>


            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
            />


            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e)=>setPhoneNumber(e.target.value.replace(/\D/g,""))}
              maxLength={15}
            />


            <input
              type="password"
              placeholder="6-digit PIN"
              maxLength={6}
              value={pin}
              onChange={(e)=>setPin(e.target.value.replace(/\D/g,""))}
            />


            <input
              type="password"
              placeholder="Confirm 6-digit PIN"
              maxLength={6}
              value={confirmPin}
              onChange={(e)=>setConfirmPin(e.target.value.replace(/\D/g,""))}
            />


            <button onClick={handleRegister}>
              REGISTER
            </button>


            <p className="login-link">
              Already have an account?
              <Link to="/"> Login →</Link>
            </p>


          </div>


        </div>

      </div>

    </>
  );
}

export default Register;