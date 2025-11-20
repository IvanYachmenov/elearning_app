import { useState } from 'react';
import { api, setAuthToken } from "../../../api/client.js";
import { Link, useNavigate } from "react-router-dom";

function LoginPage({ onAuth }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [accessToken, setAccessToken] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setProfile(null)

        try {
            const resp = await api.post("/api/auth/token/", {
                username,
                password,
            });

            const { access, refresh } = resp.data;
            setAccessToken(access);

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);

            setAuthToken(access);

            const meResp = await api.get("/api/auth/me/");
            setProfile(meResp.data);

            if(onAuth) {
                onAuth(access, meResp.data);
            }

            navigate("/home");

        } catch (err) {
            console.error(err);
            setError("Login failed. Invalid username or password.");
        }
    }

    const handleLoadProfile = async () => {
        setError(null);

        try {
            const token = accessToken || localStorage.getItem("access");
            if(!token) {
                setError("No access token. Please log in first!");
                return;
            }

            setAuthToken(token);
            const meResp = await api.get("/api/auth/me/");
            setProfile(meResp.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load profile.");
        }
    }
    return (
        <div style={{ maxWidth:400, margin: "40px auto", fontFamily: "sans-serif" }}>
            <h1>Login page</h1>
            <form onSubmit={handleLogin} style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Username:
                        <input
                            style={{ width: "100%", padding: 6, marginTop: 4 }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Password:
                        <input
                            type="password"
                            style={{ width: "100%", padding: 6, marginTop: 4 }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>

                <button type="submit" style={{ padding: "6px 12px"}}>
                    Login
                </button>
            </form>

             <p>
                 Don't have an account?{" "}
                 <Link to="/register">Register</Link>
             </p>

            <button onClick={handleLoadProfile} style={{padding: "6px 12px"}}>
                Load Profile
            </button>

            {error && (
                <p style={{ color: "red", marginTop: 15 }}>
                  {error}
                </p>
            )}

            {accessToken && (
                <p style={{ marginTop: 15, wordBreak: "break-all" }}>
                  <strong>Access token:</strong> {accessToken}
                </p>
            )}

            {profile && (
                <div style={{ marginTop: 20 }}>
                  <h2>Profile:</h2>
                  <pre>{JSON.stringify(profile, null, 2)}</pre>
                </div>
            )}

        </div>
    );
}

export default LoginPage;