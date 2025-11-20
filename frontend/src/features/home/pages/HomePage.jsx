function HomePage({ user, onLogout }) {
  return (
    <div style={{ maxWidth: 900,
        margin: "40px auto",
        fontFamily: "sans-serif",
        display: "grid",
        gridTemplateColumns: "250px 1fr",
        gap: "24px",
    }}
    >
        {/* left side */}
        <aside
        style={{
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "#020617",
          border: "1px solid #1e293b",
        }}
        >
            <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Menu</h2>
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button style={{ textAlign: "left", padding: "8px 10px" }}>
                    Profile
                </button>
                <button style={{ textAlign: "left", padding: "8px 10px" }}>
                    Courses
                </button>
                <button style={{ textAlign: "left", padding: "8px 10px" }}>
                    Shop
                </button>
                <button style={{ textAlign: "left", padding: "8px 10px" }}>
                    Settings
                </button>
            </nav>

             <hr style={{ margin: "16px 0", borderColor: "#1e293b" }} />

             <button
                 onClick={onLogout}
                 style={{ width: "100%", padding: "8px 10px" }}
             >
                Logout
             </button>
        </aside>

        {/* right side */}
         <main
        style={{
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "#020617",
          border: "1px solid #1e293b",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
          Welcome, {user.username}
        </h1>

        <p style={{ marginBottom: "8px", color: "#9ca3af" }}>
          This is your main page. Later here will be quick access to your
          courses, progress and recommendations.
        </p>

        <section
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "10px",
            backgroundColor: "#020617",
            border: "1px solid #1e293b",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Profile</h2>
          <div style={{ display: "grid", gap: "6px" }}>
            <div>
              <strong>Username:</strong> {user.username}
            </div>
            {user.first_name || user.last_name ? (
              <div>
                <strong>Name:</strong> {user.first_name} {user.last_name}
              </div>
            ) : null}
            {user.email && (
              <div>
                <strong>Email:</strong> {user.email}
              </div>
            )}
            <div>
              <strong>Role:</strong> {user.role}
            </div>
            <div>
              <strong>Points:</strong> {user.points}
            </div>
            <div>
              <strong>Two-factor:</strong>{" "}
              {user.two_factor_enabled ? "enabled" : "disabled"}
            </div>
          </div>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            What&apos;s next
          </h2>
          <ul style={{ marginLeft: "18px" }}>
            <li>In the Profile section, you will edit your data later.</li>
            <li>The Courses section will show your enrolled courses.</li>
            <li>The Shop will let you spend points on cosmetics / bonuses.</li>
          </ul>
        </section>
      </main>

    </div>
  );
}

export default HomePage;
