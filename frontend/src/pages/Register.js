import { useState } from "react";
import { api } from "../services/api";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const { login } = useUser();
  const navigate = useNavigate();

  const register = async () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password.trim()) {
      setToast("Please fill all fields.");
      setTimeout(() => setToast("") , 2500);
      return;
    }
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        mobile,
        password,
        role: "customer"
      });
      // Log in user and redirect
      login(res.data.user);
      localStorage.setItem("userId", res.data.user._id);
      setToast("Registration successful");
      setTimeout(() => {
        setToast("");
        navigate("/");
      }, 1200);
    } catch (err) {
      setToast("Registration failed");
      setTimeout(() => setToast("") , 2500);
    }
  };

  return (
    <div className="auth-card">
      <h2>Register</h2>
      <div className="auth-field">
        <label>Name</label>
        <input
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="auth-field">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="auth-field">
        <label>Mobile No</label>
        <input
          type="tel"
          placeholder="Enter your mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <div className="auth-field" style={{ position: "relative" }}>
        <label>Password</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ paddingRight: "40px" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>
      <button className="auth-button" onClick={register}>Register</button>
      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}