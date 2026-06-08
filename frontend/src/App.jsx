import { useState } from "react";
import axios from "axios";

import {
  X,
  Mail,
  Lock,
  Eye,
  User,
  Palette,
  Bell,
  Globe,
  Shield,
  Database,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import PaperCard from "./components/PaperCard";
import CitationGraph from "./components/CitationGraph";
import PaperDetailsPanel from "./components/PaperDetailsPanel";
import AnalyticsPanel from "./components/AnalyticsPanel";

import "./App.css";

export default function App() {
  const API_URL = "http://127.0.0.1:8000";

  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [activeView, setActiveView] = useState("search");
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);

  const trendingTopics = [
    "Knowledge Graph",
    "Machine Learning",
    "Citation Network",
    "Natural Language Processing",
    "Computer Vision",
  ];

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const openSettings = () => {
    setShowAuth(false);
    setShowSettings(true);
  };

  const openAuth = () => {
    setShowSettings(false);
    setAuthMode("login");
    setShowAuth(true);
  };

  const closeModals = () => {
    setShowSettings(false);
    setShowAuth(false);
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

      setPapers(response.data.papers || []);
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

  return (
    <div className={`app-shell ${theme === "light" ? "light-theme" : ""}`}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={toggleTheme}
        openSettings={openSettings}
        openAuth={openAuth}
      />

      <div className="app-main">
        <header className="topbar">
          <div>
            <h1>ResearchGraph</h1>
            <p>Citation Network Explorer</p>
          </div>
        </header>

        {activeView === "search" && (
          <main className="search-page">
            <section className="hero-section">
              <h2>Explore Scientific Research</h2>
              <p>Discover papers and visualize citation networks</p>

              <SearchBar
                query={query}
                setQuery={setQuery}
                onSearch={() => handleSearch()}
                loading={loading}
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
          onClose={closeModals}
        />
      )}

      {showAuth && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={closeModals}
        />
      )}
    </div>
  );
}

function SettingsModal({ theme, toggleTheme, onClose }) {
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
                <p>Cambiar entre modo claro y oscuro</p>
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
                <input type="checkbox" defaultChecked />
                <span></span>
              </label>
            </div>

            <div className="setting-card">
              <div>
                <strong>Actualizaciones de citas</strong>
                <p>Notificar cuando tus papers sean citados</p>
              </div>

              <label className="modern-switch">
                <input type="checkbox" />
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

            <select className="popup-select" defaultValue="es">
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
                <input type="checkbox" defaultChecked />
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

            <button className="data-action">
              <strong>Exportar datos</strong>
              <span>Descargar toda tu información</span>
            </button>

            <button className="danger-action">
              <strong>Eliminar cuenta</strong>
              <span>Eliminar permanentemente tu cuenta y datos</span>
            </button>
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

function AuthModal({ authMode, setAuthMode, onClose }) {
  const isLogin = authMode === "login";

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
                <input type="text" placeholder="Juan Pérez" />
              </div>
            </label>
          )}

          <label>
            Correo electrónico
            <div className="input-icon-box">
              <Mail size={17} />
              <input type="email" placeholder="correo@ejemplo.com" />
            </div>
          </label>

          <label>
            Contraseña
            <div className="input-icon-box">
              <Lock size={17} />
              <input type="password" placeholder="••••••••" />
              <Eye size={17} />
            </div>
          </label>

          {!isLogin && <p className="password-help">Mínimo 6 caracteres</p>}

          <button type="button" className="auth-primary-btn">
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
              <button onClick={() => setAuthMode("register")}>
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => setAuthMode("login")}>
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