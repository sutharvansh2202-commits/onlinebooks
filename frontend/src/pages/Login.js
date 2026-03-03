import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUser } from "../context/UserContext";

export default function Login() {
  // OTP login states
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpLoginEmail, setOtpLoginEmail] = useState("");
  const [otpSentLogin, setOtpSentLogin] = useState(false);
  const [otpLogin, setOtpLogin] = useState("");
  const [otpLoginToast, setOtpLoginToast] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = useNavigate();
  const { login } = useUser();

  // Define handleLogin function before return
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setToast("Please enter email and password.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      const user = res.data.user;

      // ✅ Store userId for MongoDB sync
      localStorage.setItem("userId", user._id);
      // ✅ Store token for authentication
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      // ✅ Store user in context
      login(user);

      setToast("✓ Login successful");

      setTimeout(() => {
        setToast("");
        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 1200);

    } catch (error) {
      setToast(
        error.response?.data?.message || "Invalid email or password"
      );
      setTimeout(() => setToast(""), 2500);
    }
  };

  // Add loading state for OTP sending
  const [otpSending, setOtpSending] = useState(false);

  return (
    <div className="auth-card">
      <h2>Login</h2>

      <div className="auth-field">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="auth-field" style={{ position: "relative" }}>
        <label>Password</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{ paddingRight: "40px" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            height: "24px",
            width: "24px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button className="auth-button" onClick={handleLogin}>
        Login
      </button>
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="link-btn"
          style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => setShowOtpLogin(true)}
        >
          Login with OTP?
        </button>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {/* OTP Login Modal */}
      {showOtpLogin && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "98vw", height: "130vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }} onClick={() => setShowOtpLogin(false)}>
          <div className="modal-card" style={{ maxWidth: 400, margin: "80px auto", background: "#fff", borderRadius: 12, padding: 24, position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", fontSize: 18, cursor: "pointer" }} onClick={() => setShowOtpLogin(false)}>✕</button>
            <h3>Login with OTP</h3>
            {!otpSentLogin ? (
              <>
                <label>Email</label>
                <input
                  type="email"
                  value={otpLoginEmail}
                  onChange={e => setOtpLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ width: "97%", height: 40, marginBottom: 12, borderRadius: 10, border: "1px solid #ccc", padding: "0 8px", marginTop: 10 }}
                />
                <button
                  className="auth-button"
                  disabled={otpSending}
                  style={{ width: "100%", marginTop: 8, opacity: otpSending ? 0.6 : 1 }}
                  onClick={async () => {
                    if (!otpLoginEmail.trim()) {
                      setOtpLoginToast("Enter your email.");
                      setTimeout(() => setOtpLoginToast(""), 2000);
                      return;
                    }
                    setOtpSending(true);
                    try {
                      const res = await api.post("/auth/send-otp", { email: otpLoginEmail.trim() });
                      if (res.data.success) {
                        setOtpSentLogin(true);
                        setOtpLoginToast("OTP sent to your email.");
                      } else {
                        setOtpLoginToast(res.data.message || "Failed to send OTP.");
                      }
                    } catch (err) {
                      setOtpLoginToast("Failed to send OTP.");
                    }
                    setTimeout(() => {
                      setOtpSending(false);
                      setOtpLoginToast("");
                    }, 2000);
                  }}
                >{otpSending ? "Sending..." : "Send OTP"}</button>
              </>
            ) : (
              <>
                <label>OTP</label>
                <input
                  type="text"
                  value={otpLogin}
                  onChange={e => setOtpLogin(e.target.value)}
                  placeholder="Enter OTP"
                  style={{ width: "97%", height: 40, marginBottom: 12, borderRadius: 10, border: "1px solid #ccc", padding: "0 8px", marginTop: 13 }}
                />
                <button
                  className="auth-button"
                  onClick={async () => {
                    if (!otpLogin.trim()) {
                      setOtpLoginToast("Enter OTP.");
                      setTimeout(() => setOtpLoginToast(""), 2000);
                      return;
                    }
                    try {
                      const res = await api.post("/auth/verify-otp", { email: otpLoginEmail.trim(), otp: otpLogin.trim() });
                      if (res.data.success && res.data.user) {
                        localStorage.setItem("userId", res.data.user._id);
                        if (res.data.token) {
                          localStorage.setItem("token", res.data.token);
                        }
                        login(res.data.user);
                        setOtpLoginToast("Login successful");
                        setTimeout(() => {
                          setShowOtpLogin(false);
                          setOtpSentLogin(false);
                          setOtpLoginEmail("");
                          setOtpLogin("");
                          if (res.data.user.role === "admin") {
                            navigate("/admin");
                          } else {
                            navigate("/");
                          }
                        }, 1200);
                      } else {
                        setOtpLoginToast(res.data.message || "Invalid OTP");
                      }
                    } catch (err) {
                      setOtpLoginToast("Failed to login with OTP.");
                    }
                    setTimeout(() => setOtpLoginToast(""), 2000);
                  }}
                  style={{ width: "100%", marginTop: 8 }}
                >Login with OTP</button>
              </>
            )}
            {otpLoginToast && <div className="toast toast-success" style={{ marginTop: 12 }}>{otpLoginToast}</div>}
          </div>
        </div>
      )}
    </div>
  );
}