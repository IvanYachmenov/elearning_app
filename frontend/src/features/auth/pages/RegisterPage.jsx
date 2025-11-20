import { useState } from "react";
import { api, setAuthToken } from "../../../api/client";
import { Link, useNavigate } from "react-router-dom";

function RegisterPage({ onAuth }) {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);

      try {
          // register user
          await api.post("/api/auth/register/", form);

          // login with that data
          const loginResp = await api.post("/api/auth/token/", {
              username: form.username,
              password: form.password,
          });

          const { access, refresh } = loginResp.data;
          localStorage.setItem("access", access);
          localStorage.setItem("refresh", refresh);
          setAuthToken(access);

          const meResp = await api.get("/api/auth/me");

          if(onAuth) {
              onAuth(access, meResp.data);
          }

          navigate("/home");

      } catch (err) {
          console.error(err);
          setError("Registration failed. Maybe username or email already taken.");
      }
    };

    return (
        <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>Sign up</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <label>
                Username:
                <input
                  name="username"
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                Email:
                <input
                  name="email"
                  type="email"
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={form.email}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                Password:
                <input
                  name="password"
                  type="password"
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                First name:
                <input
                  name="first_name"
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={form.first_name}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                Last name:
                <input
                  name="last_name"
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={form.last_name}
                  onChange={handleChange}
                />
              </label>
            </div>

            <button type="submit" style={{ padding: "6px 12px" }}>
              Register
            </button>
        </form>

        <p>
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
        </p>

        {error && (
            <p style={{ color: "red", marginTop: 15 }}>
                {error}
            </p>
        )}
        </div>
    );
}

export default RegisterPage;