import {
  Search,
  Network,
  BarChart3,
  Settings,
  Sun,
  Moon,
  User,
  FileText,
} from "lucide-react";

export default function Sidebar({
  activeView,
  setActiveView,
  theme,
  toggleTheme,
  openSettings,
  openAuth,
  currentUser,
  t,
}) {
  return (
    <aside className="sidebar">
      <div className="logo-box">
        <Network size={26} />
      </div>

      <nav className="nav-icons">
        <button
          className={activeView === "search" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("search")}
          title={t.navSearch}
        >
          <Search size={24} />
        </button>

        <button
          className={activeView === "graph" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("graph")}
          title={t.navGraph}
        >
          <Network size={24} />
        </button>

        <button
          className={
            activeView === "networkPapers" ? "nav-btn active" : "nav-btn"
          }
          onClick={() => setActiveView("networkPapers")}
          title={t.navNetworkPapers}
        >
          <FileText size={24} />
        </button>

        <button
          className={activeView === "analytics" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("analytics")}
          title={t.navAnalytics}
        >
          <BarChart3 size={24} />
        </button>
      </nav>

      <div className="bottom-icons">
        <button className="nav-btn" onClick={toggleTheme} title={t.navChangeTheme}>
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <button className="nav-btn" onClick={openSettings} title={t.navSettings}>
          <Settings size={22} />
        </button>

        <button
          className={currentUser ? "nav-btn user-btn logged" : "nav-btn user-btn"}
          onClick={openAuth}
          title={currentUser ? t.navAccount : t.navLogin}
        >
          {currentUser ? (
            <span className="sidebar-initial">
              {currentUser.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          ) : (
            <User size={22} />
          )}
        </button>
      </div>
    </aside>
  );
}
