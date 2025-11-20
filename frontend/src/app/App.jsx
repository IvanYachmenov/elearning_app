import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "../styles/index.css";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import HomePage from "../features/home/pages/HomePage";
import { api, setAuthToken } from "../api/client";

function App() {
    const [user, setUser] = useState(null);
    const[isCheckedAuth, setIsCheckedAuth] = useState(true);

    // try to get user from localStorage (not to log in twice)
    useEffect(() => {
        const token = localStorage.getItem("access");
        if(!token) {
            setIsCheckedAuth(false);
            return;
        }

        setAuthToken(token);
        api
            .get("/api/auth/me/")
            .then((resp) => {
                setUser(resp.data);
            })
            .catch(() => {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setAuthToken(null);
                setUser(null);
            })
            .finally(() => {
                setIsCheckedAuth(false);
            });
    }, []);

    const handleAuthSuccess = (accessToken, profile) => {
        localStorage.setItem("access", accessToken);
        setAuthToken(accessToken);
        setUser(profile);
    };

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setAuthToken(null);
        setUser(null);
    };

    if(isCheckedAuth){
        return <div style={{ padding:24 }}>Loading...</div>
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* by default -> to Registration */}
                <Route path="/" element={<Navigate to={"/register"} replace />} />

                <Route
                    path="/register"
                    element={
                    user ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <RegisterPage onAuth={handleAuthSuccess} />
                        )
                    }
                />

                <Route
                    path="/login"
                    element={
                        user ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <LoginPage onAuth={handleAuthSuccess} />
                        )
                    }
                />

                <Route
                    path="/home"
                    element={
                        user ? (
                            <HomePage user={user} onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* if smth went wrong */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;