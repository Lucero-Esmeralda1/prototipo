import { useEffect, useState } from "react";
import axios from "axios";

import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Palette,
  Bell,
  Globe,
  Shield,
  Database,
  LogOut,
  Trash2,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import PaperCard from "./components/PaperCard";
import CitationGraph from "./components/CitationGraph";
import PaperDetailsPanel from "./components/PaperDetailsPanel";
import AnalyticsPanel from "./components/AnalyticsPanel";
import FilterPanel from "./components/FilterPanel";

import "./App.css";

export default function App() {
  const API_URL = "http://127.0.0.1:8000";

  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  const [settings, setSettings] = useState({
    newPublications: true,
    citationUpdates: false,
    language: "es",
    publicProfile: true,
  });

  const [activeView, setActiveView] = useState("search");
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState([]);
  const [allPapers, setAllPapers] = useState([]);

  const [graphData, setGraphData] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    yearFrom: "2014",
    yearTo: String(new Date().getFullYear()),
    author: "",
    area: "all",
    minCitations: "0",
  });

  const trendingTopics = [
    "Knowledge Graph",
    "Machine Learning",
    "Citation Network",
    "Natural Language Processing",
    "Computer Vision",
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("researchgraph_current_user");
    const savedTheme = localStorage.getItem("researchgraph_theme");
    const savedSettings = localStorage.getItem("researchgraph_settings");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("researchgraph_theme", nextTheme);
      return nextTheme;
    });
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const updatedSettings = {
        ...prev,
        [key]: value,
      };

      localStorage.setItem(
        "researchgraph_settings",
        JSON.stringify(updatedSettings)
      );

      return updatedSettings;
    });
  };

  const handleExportData = () => {
    const exportData = {
      currentUser,
      settings,
      savedUsers: JSON.parse(localStorage.getItem("researchgraph_users") || "[]"),
      currentSearch: {
        query,
        papers,
      },
      currentGraph: graphData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "researchgraph-data.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const openSettings = () => {
    setShowAuth(false);
    setShowAccount(false);
    setShowFilters(false);
    setShowSettings(true);
  };

  const openAuth = () => {
    setShowSettings(false);
    setShowFilters(false);

    if (currentUser) {
      setShowAuth(false);
      setShowAccount(true);
    } else {
      setShowAccount(false);
      setAuthMode("login");
      setShowAuth(true);
    }
  };

  const closeModals = () => {
    setShowSettings(false);
    setShowAuth(false);
    setShowAccount(false);
  };

  const getStoredUsers = () => {
    const users = localStorage.getItem("researchgraph_users");
    return users ? JSON.parse(users) : [];
  };

  const saveStoredUsers = (users) => {
    localStorage.setItem("researchgraph_users", JSON.stringify(users));
  };

  const handleRegister = ({ fullName, email, password }) => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return {
        ok: false,
        message: "Completa todos los campos.",
      };
    }

    if (!cleanEmail.includes("@")) {
      return {
        ok: false,
        message: "Ingresa un correo válido.",
      };
    }

    if (password.length < 6) {
      return {
        ok: false,
        message: "La contraseña debe tener mínimo 6 caracteres.",
      };
    }

    const users = getStoredUsers();

    const exists = users.some((user) => user.email === cleanEmail);

    if (exists) {
      return {
        ok: false,
        message: "Ya existe una cuenta con este correo.",
      };
    }

    const newUser = {
      id: crypto.randomUUID(),
      fullName: cleanName,
      email: cleanEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    saveStoredUsers(updatedUsers);

    const sessionUser = {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    localStorage.setItem(
      "researchgraph_current_user",
      JSON.stringify(sessionUser)
    );

    setCurrentUser(sessionUser);
    setShowAuth(false);
    setShowAccount(true);

    return {
      ok: true,
      message: "Cuenta creada correctamente.",
    };
  };

  const handleLogin = ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return {
        ok: false,
        message: "Ingresa tu correo y contraseña.",
      };
    }

    const users = getStoredUsers();

    const user = users.find(
      (item) => item.email === cleanEmail && item.password === password
    );

    if (!user) {
      return {
        ok: false,
        message: "Correo o contraseña incorrectos.",
      };
    }

    const sessionUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    };

    localStorage.setItem(
      "researchgraph_current_user",
      JSON.stringify(sessionUser)
    );

    setCurrentUser(sessionUser);
    setShowAuth(false);
    setShowAccount(true);

    return {
      ok: true,
      message: "Sesión iniciada correctamente.",
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("researchgraph_current_user");
    setCurrentUser(null);
    setShowAccount(false);
    setShowAuth(true);
    setAuthMode("login");
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;

    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
    );

    if (!confirmDelete) return;

    const users = getStoredUsers();
    const updatedUsers = users.filter((user) => user.id !== currentUser.id);

    saveStoredUsers(updatedUsers);
    localStorage.removeItem("researchgraph_current_user");

    setCurrentUser(null);
    setShowAccount(false);
    setShowAuth(true);
    setAuthMode("register");
  };

  const applyFiltersToPapers = (paperList, activeFilters) => {
    return paperList.filter((paper) => {
      const paperYear = Number(paper.year || 0);
      const yearFrom = Number(activeFilters.yearFrom || 0);
      const yearTo = Number(activeFilters.yearTo || 9999);
      const minCitations = Number(activeFilters.minCitations || 0);

      const authorsText = (paper.authors || []).join(" ").toLowerCase();
      const topicsText = (paper.topics || []).join(" ").toLowerCase();
      const citations = Number(paper.citation_count || 0);

      const yearOk = paperYear >= yearFrom && paperYear <= yearTo;

      const authorOk =
        !activeFilters.author.trim() ||
        authorsText.includes(activeFilters.author.trim().toLowerCase());

      const areaOk =
        activeFilters.area === "all" ||
        topicsText.includes(activeFilters.area.toLowerCase());

      const citationOk = citations >= minCitations;

      return yearOk && authorOk && areaOk && citationOk;
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    const filtered = applyFiltersToPapers(allPapers, filters);
    setPapers(filtered);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetValues = {
      yearFrom: "2014",
      yearTo: String(new Date().getFullYear()),
      author: "",
      area: "all",
      minCitations: "0",
    };

    setFilters(resetValues);
    setPapers(allPapers);
  };

  const handleSearch = async (customQuery = query) => {
    if (!customQuery.trim()) return;

    try {
      setLoading(true);
      setQuery(customQuery);
      setGraphData(null);
      setSelectedPaper(null);
      setSelectedNode(null);

      const response = await axios.get(`${API_URL}/api/search`, {
        params: {
          query: customQuery,
          max_results: 10,
        },
      });

      const fetchedPapers = response.data.papers || [];

      setAllPapers(fetchedPapers);
      setPapers(applyFiltersToPapers(fetchedPapers, filters));
      setActiveView("search");
    } catch (error) {
      console.error("Error buscando papers:", error);
      alert("Error al buscar papers. Verifica que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaper = async (paper) => {
    try {
      setLoading(true);
      setSelectedPaper(paper);
      setSelectedNode(null);
      setShowFilters(false);
      setActiveView("graph");

      const response = await axios.get(`${API_URL}/api/graph`, {
        params: {
          paper_id: paper.paper_id,
          max_references: 10,
          max_citing: 10,
        },
      });

      setGraphData(response.data);
    } catch (error) {
      console.error("Error construyendo grafo:", error);
      alert("Error al construir el grafo.");
    } finally {
      setLoading(false);
    }
  };

  const changeView = (view) => {
    setShowFilters(false);
    setActiveView(view);
  };

  return (
    <div className={`app-shell ${theme === "light" ? "light-theme" : ""}`}>
      <Sidebar
        activeView={activeView}
        setActiveView={changeView}
        theme={theme}
        toggleTheme={toggleTheme}
        openSettings={openSettings}
        openAuth={openAuth}
        currentUser={currentUser}
      />

      <div className="app-main">
        <header className="topbar">
          <div>
            <h1>ResearchGraph</h1>
            <p>Citation Network Explorer</p>
          </div>

          {currentUser && (
            <div className="topbar-user">
              <span>{currentUser.fullName}</span>
            </div>
          )}
        </header>

        {activeView === "search" && (
  <main className="search-page">
    <div className="search-page-layout">
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="search-content-area">
        <section className="hero-section">
          <h2>Explore Scientific Research</h2>
          <p>Discover papers and visualize citation networks</p>

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={() => handleSearch()}
            loading={loading}
            // onToggleFilters={() => setShowFilters(true)}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
          />

          <div className="trending-section">
            <h3>Trending Topics</h3>

            <div className="topic-list">
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  className="topic-chip"
                  onClick={() => handleSearch(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </section>

        {papers.length > 0 && (
          <section className="results-area">
            <div className="section-title">
              <h3>{papers.length} results found</h3>
              <span>Click a paper to build its citation graph</span>
            </div>

            <div className="paper-list">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.paper_id}
                  paper={paper}
                  onSelect={handleSelectPaper}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </main>
)}

        {activeView === "graph" && (
          <main className="graph-page">
            {!graphData ? (
              <div className="empty-graph">
                <div className="empty-icon">↯</div>
                <h2>No Paper Selected</h2>
                <p>Search for a paper to visualize its citation network</p>
              </div>
            ) : (
              <>
                <section className="graph-main-full">
                  <div className="graph-header">
                    <div>
                      <h2>Citation Network</h2>
                      <p>
                        Selected paper:{" "}
                        <strong>{graphData.main_paper?.title}</strong>
                      </p>
                    </div>

                    <div className="graph-stats">
                      <span>{graphData.nodes?.length || 0} nodes</span>
                      <span>{graphData.edges?.length || 0} relations</span>
                    </div>
                  </div>

                  <CitationGraph
                    graphData={graphData}
                    onNodeClick={setSelectedNode}
                  />
                </section>

                <section className="details-bottom">
                  <PaperDetailsPanel
                    paper={graphData?.main_paper || selectedPaper}
                    selectedNode={selectedNode}
                  />
                </section>
              </>
            )}
          </main>
        )}

        {activeView === "analytics" && (
          <main className="analytics-page">
            <AnalyticsPanel
              papers={papers}
              graphData={graphData}
              selectedPaper={selectedPaper}
            />
          </main>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          theme={theme}
          toggleTheme={toggleTheme}
          settings={settings}
          updateSetting={updateSetting}
          currentUser={currentUser}
          onClose={closeModals}
          onExportData={handleExportData}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {showAuth && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={closeModals}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {showAccount && currentUser && (
        <AccountModal
          currentUser={currentUser}
          onClose={closeModals}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}

function SettingsModal({
  theme,
  toggleTheme,
  settings,
  updateSetting,
  currentUser,
  onClose,
  onExportData,
  onDeleteAccount,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Configuración</h2>

          <button className="popup-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="popup-body">
          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon blue-soft">
                <Palette size={18} />
              </span>
              <h3>Apariencia</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>Tema</strong>
                <p>
                  {theme === "dark"
                    ? "Modo oscuro activado"
                    : "Modo claro activado"}
                </p>
              </div>

              <label className="modern-switch">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <span></span>
              </label>
            </div>
          </section>

          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon green-soft">
                <Bell size={18} />
              </span>
              <h3>Notificaciones</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>Nuevas publicaciones</strong>
                <p>Notificar cuando haya nuevos papers relevantes</p>
              </div>

              <label className="modern-switch">
                <input
                  type="checkbox"
                  checked={settings.newPublications}
                  onChange={(e) =>
                    updateSetting("newPublications", e.target.checked)
                  }
                />
                <span></span>
              </label>
            </div>

            <div className="setting-card">
              <div>
                <strong>Actualizaciones de citas</strong>
                <p>Notificar cuando tus papers sean citados</p>
              </div>

              <label className="modern-switch">
                <input
                  type="checkbox"
                  checked={settings.citationUpdates}
                  onChange={(e) =>
                    updateSetting("citationUpdates", e.target.checked)
                  }
                />
                <span></span>
              </label>
            </div>
          </section>

          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon purple-soft">
                <Globe size={18} />
              </span>
              <h3>Idioma</h3>
            </div>

            <select
              className="popup-select"
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </section>

          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon orange-soft">
                <Shield size={18} />
              </span>
              <h3>Privacidad y Seguridad</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>Perfil público</strong>
                <p>Permitir que otros vean tu actividad</p>
              </div>

              <label className="modern-switch">
                <input
                  type="checkbox"
                  checked={settings.publicProfile}
                  onChange={(e) =>
                    updateSetting("publicProfile", e.target.checked)
                  }
                />
                <span></span>
              </label>
            </div>
          </section>

          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon red-soft">
                <Database size={18} />
              </span>
              <h3>Datos</h3>
            </div>

            <button className="data-action" onClick={onExportData}>
              <strong>Exportar datos</strong>
              <span>Descargar toda tu información en formato JSON</span>
            </button>

            {currentUser ? (
              <button className="danger-action" onClick={onDeleteAccount}>
                <strong>Eliminar cuenta</strong>
                <span>Eliminar permanentemente tu cuenta y datos</span>
              </button>
            ) : (
              <button className="data-action disabled-action" disabled>
                <strong>Cuenta no iniciada</strong>
                <span>Inicia sesión para administrar tus datos</span>
              </button>
            )}
          </section>
        </div>

        <div className="popup-footer">
          <button className="popup-secondary-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ authMode, setAuthMode, onClose, onLogin, onRegister }) {
  const isLogin = authMode === "login";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const submitAuth = () => {
    setAuthMessage("");

    const result = isLogin
      ? onLogin({ email, password })
      : onRegister({ fullName, email, password });

    if (!result.ok) {
      setAuthMessage(result.message);
    }
  };

  const changeMode = (mode) => {
    setAuthMode(mode);
    setAuthMessage("");
    setFullName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</h2>

          <button className="popup-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="auth-popup-form">
          {!isLogin && (
            <label>
              Nombre completo
              <div className="input-icon-box">
                <User size={17} />
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </label>
          )}

          <label>
            Correo electrónico
            <div className="input-icon-box">
              <Mail size={17} />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label>
            Contraseña
            <div className="input-icon-box">
              <Lock size={17} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="password-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {!isLogin && <p className="password-help">Mínimo 6 caracteres</p>}

          {authMessage && <p className="auth-error">{authMessage}</p>}

          <button type="button" className="auth-primary-btn" onClick={submitAuth}>
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <div className="auth-change">
          {isLogin ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button onClick={() => changeMode("register")}>
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => changeMode("login")}>
                Inicia sesión
              </button>
            </p>
          )}
        </div>

        <p className="auth-terms">
          Al continuar, aceptas nuestros Términos de Servicio y Política de
          Privacidad
        </p>
      </div>
    </div>
  );
}

function AccountModal({ currentUser, onClose, onLogout, onDeleteAccount }) {
  const createdDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString()
    : "No disponible";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="account-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Mi Cuenta</h2>

          <button className="popup-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="account-body">
          <div className="account-avatar">
            {currentUser.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <h3>{currentUser.fullName}</h3>
          <p>{currentUser.email}</p>

          <div className="account-info-card">
            <span>Fecha de registro</span>
            <strong>{createdDate}</strong>
          </div>

          <button className="account-action-btn" onClick={onLogout}>
            <LogOut size={17} />
            Cerrar sesión
          </button>

          <button className="account-danger-btn" onClick={onDeleteAccount}>
            <Trash2 size={17} />
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}