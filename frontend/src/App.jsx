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

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [graphError, setGraphError] = useState("");

  const [networkData, setNetworkData] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [referencePage, setReferencePage] = useState(1);
  const [citingPage, setCitingPage] = useState(1);
  const [networkPerPage] = useState(20);

  const [graphData, setGraphData] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    yearFrom: "",
    yearTo: "",
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
    setShowFilters(false);

    if (query.trim()) {
      handleSearch(query, 1, filters);
    }
  };

  const handleResetFilters = () => {
    const resetValues = {
      yearFrom: "",
      yearTo: "",
      author: "",
      area: "all",
      minCitations: "0",
    };

    setFilters(resetValues);

    if (query.trim()) {
      handleSearch(query, 1, resetValues);
    } else {
      setPapers([]);
      setAllPapers([]);
      setTotalResults(0);
      setTotalPages(0);
      setPage(1);
    }
  };

  const handleSearch = async (
    customQuery = query,
    requestedPage = 1,
    activeFilters = filters
  ) => {
    if (!customQuery.trim()) return;

    try {
      setLoading(true);
      setQuery(customQuery);
      setPage(requestedPage);
      setGraphData(null);
      setSelectedPaper(null);
      setSelectedNode(null);
      setGraphError("");
      setNetworkData(null);
      setNetworkError("");
      setReferencePage(1);
      setCitingPage(1);

      const response = await axios.get(`${API_URL}/api/search`, {
        params: {
          query: customQuery,
          page: requestedPage,
          per_page: perPage,
          year_from: activeFilters.yearFrom,
          year_to: activeFilters.yearTo,
          author: activeFilters.author,
          area: activeFilters.area,
          min_citations: activeFilters.minCitations,
        },
      });

      const fetchedPapers = response.data.papers || [];

      setAllPapers(fetchedPapers);
      setPapers(fetchedPapers);
      setTotalResults(response.data.total_results || fetchedPapers.length || 0);
      setTotalPages(response.data.total_pages || 1);
      setActiveView("search");
    } catch (error) {
      console.error("Error buscando papers:", error);
      alert("Error al buscar papers. Verifica que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const loadGraphByPaperId = async (paperId) => {
    if (!paperId) return;

    try {
      setLoading(true);
      setGraphData(null);
      setSelectedPaper(null);
      setSelectedNode(null);
      setShowFilters(false);
      setGraphError("");
      setNetworkData(null);
      setNetworkError("");
      setReferencePage(1);
      setCitingPage(1);
      setActiveView("graph");

      const response = await axios.get(`${API_URL}/api/graph`, {
        params: {
          paper_id: paperId,
          max_references: 10,
          max_citing: 10,
        },
      });

      setGraphData(response.data);
      setSelectedPaper(response.data?.main_paper || null);
    } catch (error) {
      console.error("Error construyendo grafo:", error);
      setGraphError("No se pudo cargar el grafo del paper seleccionado. Verifica que el backend esté activo.");
      setActiveView("graph");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPaperId = () => {
    return (
      graphData?.main_paper?.paper_id ||
      graphData?.main_paper?.id ||
      selectedPaper?.paper_id ||
      selectedPaper?.id ||
      null
    );
  };

  const loadNetworkPapersByPaperId = async (
    paperId,
    requestedReferencePage = 1,
    requestedCitingPage = 1
  ) => {
    if (!paperId) return;

    try {
      setNetworkLoading(true);
      setNetworkError("");
      setReferencePage(requestedReferencePage);
      setCitingPage(requestedCitingPage);

      const response = await axios.get(`${API_URL}/api/network-papers`, {
        params: {
          paper_id: paperId,
          references_page: requestedReferencePage,
          references_per_page: networkPerPage,
          citing_page: requestedCitingPage,
          citing_per_page: networkPerPage,
        },
      });

      setNetworkData(response.data);

      if (response.data?.main_paper) {
        setSelectedPaper(response.data.main_paper);
      }
    } catch (error) {
      console.error("Error cargando referencias y citantes:", error);
      setNetworkError(
        "No se pudo cargar la lista completa de referencias y papers citantes. Verifica que el backend tenga el endpoint /api/network-papers."
      );
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleSelectPaper = async (paper) => {
    setSelectedPaper(paper);
    await loadGraphByPaperId(paper.paper_id || paper.id);
  };

  const openPaperInNewTab = (paperId) => {
    if (!paperId) return;

    localStorage.setItem("researchgraph_pending_paper_id", paperId);

    const url = `${window.location.origin}${window.location.pathname}?paper_id=${encodeURIComponent(
      paperId
    )}&view=graph`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paperIdFromUrl = params.get("paper_id");
    const view = params.get("view");
    const pendingPaperId = localStorage.getItem("researchgraph_pending_paper_id");

    const paperId = paperIdFromUrl || pendingPaperId;

    if (paperId && view === "graph") {
      localStorage.removeItem("researchgraph_pending_paper_id");
      loadGraphByPaperId(paperId);
    }
  }, []);

  const changeView = (view) => {
    setShowFilters(false);
    setActiveView(view);

    if (view === "networkPapers") {
      const paperId = getCurrentPaperId();

      if (paperId) {
        loadNetworkPapersByPaperId(paperId, 1, 1);
      }
    }
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
              <h3>{totalResults.toLocaleString()} results found</h3>
              <span>Showing page {page} of {totalPages || 1}</span>
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

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => handleSearch(query, newPage, filters)}
            />
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
                <h2>{loading ? "Construyendo grafo..." : "No Paper Selected"}</h2>
                <p>
                  {graphError ||
                    (loading
                      ? "Estamos consultando OpenAlex y construyendo la red."
                      : "Search for a paper to visualize its citation network")}
                </p>
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

        {activeView === "networkPapers" && (
          <NetworkPapersView
            graphData={graphData}
            networkData={networkData}
            selectedPaper={selectedPaper}
            loading={networkLoading}
            routeError={networkError || graphError}
            referencePage={referencePage}
            citingPage={citingPage}
            onOpenPaper={openPaperInNewTab}
            onGoSearch={() => setActiveView("search")}
            onReferencePageChange={(newPage) =>
              loadNetworkPapersByPaperId(getCurrentPaperId(), newPage, citingPage)
            }
            onCitingPageChange={(newPage) =>
              loadNetworkPapersByPaperId(getCurrentPaperId(), referencePage, newPage)
            }
          />
        )}

        {activeView === "analytics" && (
          <main className="analytics-page">
            <AnalyticsPanel
              papers={papers}
              graphData={graphData}
              selectedPaper={selectedPaper}
              onOpenPaper={openPaperInNewTab}
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


function NetworkPapersView({
  graphData,
  networkData,
  selectedPaper,
  loading,
  routeError,
  referencePage,
  citingPage,
  onOpenPaper,
  onGoSearch,
  onReferencePageChange,
  onCitingPageChange,
}) {
  const mainPaper =
    networkData?.main_paper || graphData?.main_paper || selectedPaper || null;

  const referencesInfo = networkData?.references || {
    papers: [],
    total: 0,
    total_pages: 0,
    page: referencePage,
    per_page: 20,
  };

  const citingInfo = networkData?.citing_papers || {
    papers: [],
    total: 0,
    total_pages: 0,
    page: citingPage,
    per_page: 20,
  };

  const references = referencesInfo.papers || [];
  const citingPapers = citingInfo.papers || [];

  const getShowingText = (info, items) => {
    const total = Number(info?.total || 0);
    const currentPage = Number(info?.page || 1);
    const perPage = Number(info?.per_page || items.length || 20);

    if (!total) return "0 resultados";

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(start + items.length - 1, total);

    return `Mostrando ${start.toLocaleString()}-${end.toLocaleString()} de ${total.toLocaleString()}`;
  };

  const renderPaperList = (items, type, currentPage, perPage) => {
    if (!items.length) {
      return (
        <div className="network-empty-list">
          No hay papers disponibles para esta sección.
        </div>
      );
    }

    return (
      <div className="network-paper-list">
        {items.map((paper, index) => {
          const paperId = paper.paper_id || paper.id;
          const title = paper.title || paper.label || "Sin título";
          const displayIndex = (currentPage - 1) * perPage + index + 1;

          return (
            <article className="network-paper-item" key={paperId || index}>
              <div className={`network-paper-number ${type}`}>
                {displayIndex}
              </div>

              <div className="network-paper-info">
                <h4>{title}</h4>

                <p>
                  {paper.year || "Sin año"} ·{" "}
                  {Number(paper.citation_count || 0).toLocaleString()} citas
                </p>

                {paperId && <span>{paperId}</span>}
              </div>

              <button
                type="button"
                className="network-paper-open-btn"
                onClick={() => onOpenPaper?.(paperId)}
                disabled={!paperId}
                title="Abrir grafo de este paper en una nueva pestaña"
              >
                Abrir grafo
              </button>
            </article>
          );
        })}
      </div>
    );
  };

  if (loading && !networkData) {
    return (
      <main className="network-papers-page">
        <div className="empty-graph">
          <div className="empty-icon">⏳</div>
          <h2>Cargando lista completa...</h2>
          <p>
            Estamos consultando OpenAlex para obtener todas las referencias y
            todos los papers citantes disponibles.
          </p>
        </div>
      </main>
    );
  }

  if (routeError) {
    return (
      <main className="network-papers-page">
        <div className="empty-graph">
          <div className="empty-icon">!</div>
          <h2>No se pudo cargar la lista</h2>
          <p>{routeError}</p>
        </div>
      </main>
    );
  }

  if (!mainPaper) {
    return (
      <main className="network-papers-page">
        <div className="network-empty-state">
          <div className="empty-icon">☰</div>
          <h2>No hay paper seleccionado</h2>
          <p>
            Primero busca un paper y construye su grafo. Luego aquí verás todas
            sus referencias y todos los papers que lo citaron, distribuidos por páginas.
          </p>

          <button type="button" onClick={onGoSearch}>
            Ir a búsqueda
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="network-papers-page">
      <section className="network-papers-header">
        <div>
          <h2>References & Citing Papers</h2>
          <p>
            Lista completa disponible en OpenAlex para el paper seleccionado.
            El grafo puede seguir limitado para que no se vuelva lento.
          </p>
        </div>

        <div className="network-papers-stats">
          <span>{Number(referencesInfo.total || 0).toLocaleString()} referencias</span>
          <span>{Number(citingInfo.total || 0).toLocaleString()} papers citantes</span>
        </div>
      </section>

      <section className="network-main-paper-card">
        <span>Paper seleccionado</span>
        <h3>{mainPaper?.title || mainPaper?.label || "Sin título"}</h3>
        <p>
          {mainPaper?.year || "Sin año"} ·{" "}
          {Number(mainPaper?.citation_count || 0).toLocaleString()} citas
        </p>
      </section>

      <section className="network-paper-columns">
        <div className="network-paper-column">
          <div className="network-column-title">
            <h3>Referencias</h3>
            <span>Papers que el paper seleccionado usó como base.</span>
            <strong>{getShowingText(referencesInfo, references)}</strong>
          </div>

          {loading ? (
            <div className="network-empty-list">Cargando referencias...</div>
          ) : (
            renderPaperList(
              references,
              "reference",
              Number(referencesInfo.page || referencePage || 1),
              Number(referencesInfo.per_page || 20)
            )
          )}

          <Pagination
            page={Number(referencesInfo.page || referencePage || 1)}
            totalPages={Number(referencesInfo.total_pages || 0)}
            onPageChange={onReferencePageChange}
          />
        </div>

        <div className="network-paper-column">
          <div className="network-column-title">
            <h3>Papers que lo citaron</h3>
            <span>Papers posteriores que citaron al paper seleccionado.</span>
            <strong>{getShowingText(citingInfo, citingPapers)}</strong>
          </div>

          {loading ? (
            <div className="network-empty-list">Cargando papers citantes...</div>
          ) : (
            renderPaperList(
              citingPapers,
              "citing",
              Number(citingInfo.page || citingPage || 1),
              Number(citingInfo.per_page || 20)
            )
          )}

          <Pagination
            page={Number(citingInfo.page || citingPage || 1)}
            totalPages={Number(citingInfo.total_pages || 0)}
            onPageChange={onCitingPageChange}
          />
        </div>
      </section>
    </main>
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

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const maxVisible = 10;
  let start = Math.max(1, page - 4);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          className={
            pageNumber === page
              ? "pagination-btn active"
              : "pagination-btn"
          }
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        className="pagination-btn"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
}
