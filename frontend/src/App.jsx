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

const TRANSLATIONS = {
  es: {
    appSubtitle: "Explorador de Redes de Citaciones",
    navSearch: "Buscar",
    navGraph: "Grafo",
    navNetworkPapers: "Referencias y citantes",
    navAnalytics: "Analíticas",
    navChangeTheme: "Cambiar tema",
    navSettings: "Configuración",
    navAccount: "Mi cuenta",
    navLogin: "Iniciar sesión",
    searchTitle: "Explora investigación científica",
    searchSubtitle: "Descubre papers y visualiza redes de citaciones",
    searchPlaceholder: "Buscar por título, DOI, autor, palabras clave o año...",
    searchButton: "Buscar",
    searchingButton: "Buscando...",
    filtersButton: "Abrir filtros",
    trendingTopics: "Temas en tendencia",
    resultsFound: "resultados encontrados",
    showingPage: "Mostrando página",
    of: "de",
    noPaperSelected: "No hay paper seleccionado",
    graphLoadingTitle: "Construyendo grafo...",
    graphLoadingText: "Estamos consultando OpenAlex y construyendo la red.",
    graphEmptyText: "Busca un paper para visualizar su red de citaciones",
    citationNetwork: "Red de citaciones",
    selectedPaper: "Paper seleccionado",
    nodes: "nodos",
    relations: "relaciones",
    networkTitle: "Referencias y papers citantes",
    networkDescription:
      "Lista completa disponible en OpenAlex para el paper seleccionado. El grafo puede seguir limitado para que no se vuelva lento.",
    references: "Referencias",
    referencesDescription: "Papers que el paper seleccionado usó como base.",
    citingPapers: "Papers que lo citaron",
    citingPapersDescription: "Papers posteriores que citaron al paper seleccionado.",
    referencesCount: "referencias",
    citingPapersCount: "papers citantes",
    noNetworkSelectedTitle: "No hay paper seleccionado",
    noNetworkSelectedText:
      "Primero busca un paper y construye su grafo. Luego aquí verás todas sus referencias y todos los papers que lo citaron, distribuidos por páginas.",
    goToSearch: "Ir a búsqueda",
    loadingFullList: "Cargando lista completa...",
    loadingFullListText:
      "Estamos consultando OpenAlex para obtener todas las referencias y todos los papers citantes disponibles.",
    cannotLoadList: "No se pudo cargar la lista",
    noPapersAvailable: "No hay papers disponibles para esta sección.",
    loadingReferences: "Cargando referencias...",
    loadingCitingPapers: "Cargando papers citantes...",
    showing: "Mostrando",
    results: "resultados",
    noYear: "Sin año",
    noTitle: "Sin título",
    citations: "citas",
    openGraph: "Abrir grafo",
    openGraphTitle: "Abrir grafo de este paper en una nueva pestaña",
    settings: "Configuración",
    appearance: "Apariencia",
    theme: "Tema",
    darkModeActive: "Modo oscuro activado",
    lightModeActive: "Modo claro activado",
    notifications: "Notificaciones",
    newPublications: "Nuevas publicaciones",
    newPublicationsText: "Notificar cuando haya nuevos papers relevantes",
    citationUpdates: "Actualizaciones de citas",
    citationUpdatesText: "Notificar cuando tus papers sean citados",
    language: "Idioma",
    spanish: "Español",
    english: "Inglés",
    portuguese: "Portugués",
    privacySecurity: "Privacidad y Seguridad",
    publicProfile: "Perfil público",
    publicProfileText: "Permitir que otros vean tu actividad",
    data: "Datos",
    exportData: "Exportar datos",
    exportDataText: "Descargar toda tu información en formato JSON",
    deleteAccount: "Eliminar cuenta",
    deleteAccountText: "Eliminar permanentemente tu cuenta y datos",
    accountNotStarted: "Cuenta no iniciada",
    accountNotStartedText: "Inicia sesión para administrar tus datos",
    close: "Cerrar",
    loginTitle: "Iniciar sesión",
    registerTitle: "Crear cuenta",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    password: "Contraseña",
    minPassword: "Mínimo 6 caracteres",
    loginButton: "Iniciar sesión",
    registerButton: "Crear cuenta",
    or: "o",
    noAccount: "¿No tienes cuenta?",
    alreadyAccount: "¿Ya tienes cuenta?",
    registerHere: "Regístrate aquí",
    loginHere: "Inicia sesión",
    authTerms:
      "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad",
    myAccount: "Mi cuenta",
    registrationDate: "Fecha de registro",
    notAvailable: "No disponible",
    logout: "Cerrar sesión",
    confirmDeleteAccount:
      "¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.",
    completeAllFields: "Completa todos los campos.",
    validEmail: "Ingresa un correo válido.",
    passwordMinError: "La contraseña debe tener mínimo 6 caracteres.",
    emailExists: "Ya existe una cuenta con este correo.",
    accountCreated: "Cuenta creada correctamente.",
    enterEmailPassword: "Ingresa tu correo y contraseña.",
    wrongCredentials: "Correo o contraseña incorrectos.",
    loginSuccess: "Sesión iniciada correctamente.",
    searchError: "Error al buscar papers. Verifica que el backend esté activo.",
    graphLoadError:
      "No se pudo cargar el grafo del paper seleccionado. Verifica que el backend esté activo.",
    networkLoadError:
      "No se pudo cargar la lista completa de referencias y papers citantes. Verifica que el backend tenga el endpoint /api/network-papers.",
    topicKnowledgeGraph: "Grafo de conocimiento",
    topicMachineLearning: "Aprendizaje automático",
    topicCitationNetwork: "Red de citaciones",
    topicNLP: "Procesamiento de lenguaje natural",
    topicComputerVision: "Visión por computadora",
    filterYearRange: "Año de publicación",
    filterAuthor: "Autor",
    filterArea: "Área",
    filterAllAreas: "Todas las áreas",
    filterMinCitations: "Citas mínimas",
    filterApply: "Aplicar filtros",
    filterReset: "Restablecer",
    highlyInfluential: "Altamente influyente",
    unknownAuthors: "Autores desconocidos",
    noAbstract: "Resumen no disponible.",
    noTopics: "Sin temas",
    analyticsTitle: "Línea de tiempo y analíticas",
    analyticsDescription: "Indicadores calculados a partir del paper seleccionado y su red de citaciones.",
    totalPapers: "Total de papers",
    totalCitations: "Total de citas",
    influentialPapers: "Papers influyentes",
    publicationsByYear: "Publicaciones por año",
    publicationsByYearDescription: "Muestra la distribución temporal del paper principal, sus referencias y los papers que lo citan.",
    searchResults: "Resultados de búsqueda",
    networkComposition: "Composición de la red",
    mainPaperCitations: "Citas del paper principal",
    mostInfluentialPapers: "Papers más influyentes de la red",
    paperWithoutId: "Este paper no tiene ID disponible",
    graphLegend: "Leyenda",
    graphTools: "Arrastra para mover · Scroll para zoom · Clic en un nodo para ver detalles",
    paperDetails: "Detalles del paper",
    selectNodeDetails: "Selecciona un nodo para ver sus detalles.",
    year: "Año",
    type: "Tipo",
    topics: "Temas",
    openInOpenAlex: "Abrir en OpenAlex",
  },
  en: {
    appSubtitle: "Citation Network Explorer",
    navSearch: "Search",
    navGraph: "Graph",
    navNetworkPapers: "References and citing papers",
    navAnalytics: "Analytics",
    navChangeTheme: "Change theme",
    navSettings: "Settings",
    navAccount: "My account",
    navLogin: "Log in",
    searchTitle: "Explore scientific research",
    searchSubtitle: "Discover papers and visualize citation networks",
    searchPlaceholder: "Search by title, DOI, author, keywords, or year...",
    searchButton: "Search",
    searchingButton: "Searching...",
    filtersButton: "Open filters",
    trendingTopics: "Trending topics",
    resultsFound: "results found",
    showingPage: "Showing page",
    of: "of",
    noPaperSelected: "No paper selected",
    graphLoadingTitle: "Building graph...",
    graphLoadingText: "We are querying OpenAlex and building the network.",
    graphEmptyText: "Search for a paper to visualize its citation network",
    citationNetwork: "Citation network",
    selectedPaper: "Selected paper",
    nodes: "nodes",
    relations: "relations",
    networkTitle: "References and citing papers",
    networkDescription:
      "Complete list available in OpenAlex for the selected paper. The graph can remain limited so it does not become slow.",
    references: "References",
    referencesDescription: "Papers used as a basis by the selected paper.",
    citingPapers: "Citing papers",
    citingPapersDescription: "Later papers that cited the selected paper.",
    referencesCount: "references",
    citingPapersCount: "citing papers",
    noNetworkSelectedTitle: "No paper selected",
    noNetworkSelectedText:
      "First search for a paper and build its graph. Then you will see all its references and all papers that cited it, distributed by pages.",
    goToSearch: "Go to search",
    loadingFullList: "Loading full list...",
    loadingFullListText:
      "We are querying OpenAlex to get all available references and all citing papers.",
    cannotLoadList: "Could not load the list",
    noPapersAvailable: "No papers available for this section.",
    loadingReferences: "Loading references...",
    loadingCitingPapers: "Loading citing papers...",
    showing: "Showing",
    results: "results",
    noYear: "No year",
    noTitle: "Untitled",
    citations: "citations",
    openGraph: "Open graph",
    openGraphTitle: "Open this paper graph in a new tab",
    settings: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    darkModeActive: "Dark mode enabled",
    lightModeActive: "Light mode enabled",
    notifications: "Notifications",
    newPublications: "New publications",
    newPublicationsText: "Notify when there are new relevant papers",
    citationUpdates: "Citation updates",
    citationUpdatesText: "Notify when your papers are cited",
    language: "Language",
    spanish: "Spanish",
    english: "English",
    portuguese: "Portuguese",
    privacySecurity: "Privacy and Security",
    publicProfile: "Public profile",
    publicProfileText: "Allow others to see your activity",
    data: "Data",
    exportData: "Export data",
    exportDataText: "Download all your information in JSON format",
    deleteAccount: "Delete account",
    deleteAccountText: "Permanently delete your account and data",
    accountNotStarted: "No active account",
    accountNotStartedText: "Log in to manage your data",
    close: "Close",
    loginTitle: "Log in",
    registerTitle: "Create account",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    minPassword: "Minimum 6 characters",
    loginButton: "Log in",
    registerButton: "Create account",
    or: "or",
    noAccount: "Don’t have an account?",
    alreadyAccount: "Already have an account?",
    registerHere: "Register here",
    loginHere: "Log in",
    authTerms:
      "By continuing, you accept our Terms of Service and Privacy Policy",
    myAccount: "My account",
    registrationDate: "Registration date",
    notAvailable: "Not available",
    logout: "Log out",
    confirmDeleteAccount:
      "Are you sure you want to delete your account? This action cannot be undone.",
    completeAllFields: "Complete all fields.",
    validEmail: "Enter a valid email.",
    passwordMinError: "Password must have at least 6 characters.",
    emailExists: "An account with this email already exists.",
    accountCreated: "Account created successfully.",
    enterEmailPassword: "Enter your email and password.",
    wrongCredentials: "Incorrect email or password.",
    loginSuccess: "Session started successfully.",
    searchError: "Error searching papers. Check that the backend is running.",
    graphLoadError:
      "Could not load the selected paper graph. Check that the backend is running.",
    networkLoadError:
      "Could not load the complete list of references and citing papers. Check that the backend has the /api/network-papers endpoint.",
    topicKnowledgeGraph: "Knowledge graph",
    topicMachineLearning: "Machine learning",
    topicCitationNetwork: "Citation network",
    topicNLP: "Natural language processing",
    topicComputerVision: "Computer vision",
    filterYearRange: "Publication year",
    filterAuthor: "Author",
    filterArea: "Area",
    filterAllAreas: "All areas",
    filterMinCitations: "Minimum citations",
    filterApply: "Apply filters",
    filterReset: "Reset",
    highlyInfluential: "Highly Influential",
    unknownAuthors: "Unknown authors",
    noAbstract: "No abstract available.",
    noTopics: "No topics",
    analyticsTitle: "Timeline & Analytics",
    analyticsDescription: "Indicators calculated from the selected paper and its citation network.",
    totalPapers: "Total papers",
    totalCitations: "Total citations",
    influentialPapers: "Influential papers",
    publicationsByYear: "Publications by year",
    publicationsByYearDescription: "Shows the temporal distribution of the main paper, its references and citing papers.",
    searchResults: "Search results",
    networkComposition: "Network composition",
    mainPaperCitations: "Main paper citations",
    mostInfluentialPapers: "Most influential papers in network",
    paperWithoutId: "This paper has no available ID",
    graphLegend: "Legend",
    graphTools: "Drag to move · Scroll to zoom · Click a node to see details",
    paperDetails: "Paper details",
    selectNodeDetails: "Select a node to see details.",
    year: "Year",
    type: "Type",
    topics: "Topics",
    openInOpenAlex: "Open in OpenAlex",
  },
  pt: {
    appSubtitle: "Explorador de Redes de Citações",
    navSearch: "Pesquisar",
    navGraph: "Grafo",
    navNetworkPapers: "Referências e citantes",
    navAnalytics: "Análises",
    navChangeTheme: "Alterar tema",
    navSettings: "Configurações",
    navAccount: "Minha conta",
    navLogin: "Entrar",
    searchTitle: "Explore pesquisas científicas",
    searchSubtitle: "Descubra papers e visualize redes de citações",
    searchPlaceholder: "Pesquisar por título, DOI, autor, palavras-chave ou ano...",
    searchButton: "Pesquisar",
    searchingButton: "Pesquisando...",
    filtersButton: "Abrir filtros",
    trendingTopics: "Temas em tendência",
    resultsFound: "resultados encontrados",
    showingPage: "Mostrando página",
    of: "de",
    noPaperSelected: "Nenhum paper selecionado",
    graphLoadingTitle: "Construindo grafo...",
    graphLoadingText: "Estamos consultando o OpenAlex e construindo a rede.",
    graphEmptyText: "Pesquise um paper para visualizar sua rede de citações",
    citationNetwork: "Rede de citações",
    selectedPaper: "Paper selecionado",
    nodes: "nós",
    relations: "relações",
    networkTitle: "Referências e papers citantes",
    networkDescription:
      "Lista completa disponível no OpenAlex para o paper selecionado. O grafo pode continuar limitado para não ficar lento.",
    references: "Referências",
    referencesDescription: "Papers usados como base pelo paper selecionado.",
    citingPapers: "Papers que o citaram",
    citingPapersDescription: "Papers posteriores que citaram o paper selecionado.",
    referencesCount: "referências",
    citingPapersCount: "papers citantes",
    noNetworkSelectedTitle: "Nenhum paper selecionado",
    noNetworkSelectedText:
      "Primeiro pesquise um paper e construa seu grafo. Depois você verá todas as referências e todos os papers que o citaram, distribuídos por páginas.",
    goToSearch: "Ir para pesquisa",
    loadingFullList: "Carregando lista completa...",
    loadingFullListText:
      "Estamos consultando o OpenAlex para obter todas as referências e todos os papers citantes disponíveis.",
    cannotLoadList: "Não foi possível carregar a lista",
    noPapersAvailable: "Não há papers disponíveis para esta seção.",
    loadingReferences: "Carregando referências...",
    loadingCitingPapers: "Carregando papers citantes...",
    showing: "Mostrando",
    results: "resultados",
    noYear: "Sem ano",
    noTitle: "Sem título",
    citations: "citações",
    openGraph: "Abrir grafo",
    openGraphTitle: "Abrir o grafo deste paper em uma nova aba",
    settings: "Configurações",
    appearance: "Aparência",
    theme: "Tema",
    darkModeActive: "Modo escuro ativado",
    lightModeActive: "Modo claro ativado",
    notifications: "Notificações",
    newPublications: "Novas publicações",
    newPublicationsText: "Notificar quando houver novos papers relevantes",
    citationUpdates: "Atualizações de citações",
    citationUpdatesText: "Notificar quando seus papers forem citados",
    language: "Idioma",
    spanish: "Espanhol",
    english: "Inglês",
    portuguese: "Português",
    privacySecurity: "Privacidade e Segurança",
    publicProfile: "Perfil público",
    publicProfileText: "Permitir que outros vejam sua atividade",
    data: "Dados",
    exportData: "Exportar dados",
    exportDataText: "Baixar todas as suas informações em formato JSON",
    deleteAccount: "Excluir conta",
    deleteAccountText: "Excluir permanentemente sua conta e dados",
    accountNotStarted: "Conta não iniciada",
    accountNotStartedText: "Entre para gerenciar seus dados",
    close: "Fechar",
    loginTitle: "Entrar",
    registerTitle: "Criar conta",
    fullName: "Nome completo",
    email: "E-mail",
    password: "Senha",
    minPassword: "Mínimo de 6 caracteres",
    loginButton: "Entrar",
    registerButton: "Criar conta",
    or: "ou",
    noAccount: "Não tem conta?",
    alreadyAccount: "Já tem conta?",
    registerHere: "Cadastre-se aqui",
    loginHere: "Entrar",
    authTerms:
      "Ao continuar, você aceita nossos Termos de Serviço e Política de Privacidade",
    myAccount: "Minha conta",
    registrationDate: "Data de cadastro",
    notAvailable: "Não disponível",
    logout: "Sair",
    confirmDeleteAccount:
      "Tem certeza de que deseja excluir sua conta? Esta ação não pode ser desfeita.",
    completeAllFields: "Preencha todos os campos.",
    validEmail: "Digite um e-mail válido.",
    passwordMinError: "A senha deve ter pelo menos 6 caracteres.",
    emailExists: "Já existe uma conta com este e-mail.",
    accountCreated: "Conta criada corretamente.",
    enterEmailPassword: "Digite seu e-mail e senha.",
    wrongCredentials: "E-mail ou senha incorretos.",
    loginSuccess: "Sessão iniciada corretamente.",
    searchError: "Erro ao pesquisar papers. Verifique se o backend está ativo.",
    graphLoadError:
      "Não foi possível carregar o grafo do paper selecionado. Verifique se o backend está ativo.",
    networkLoadError:
      "Não foi possível carregar a lista completa de referências e papers citantes. Verifique se o backend tem o endpoint /api/network-papers.",
    topicKnowledgeGraph: "Grafo de conhecimento",
    topicMachineLearning: "Aprendizado de máquina",
    topicCitationNetwork: "Rede de citações",
    topicNLP: "Processamento de linguagem natural",
    topicComputerVision: "Visão computacional",
    filterYearRange: "Ano de publicação",
    filterAuthor: "Autor",
    filterArea: "Área",
    filterAllAreas: "Todas as áreas",
    filterMinCitations: "Citações mínimas",
    filterApply: "Aplicar filtros",
    filterReset: "Redefinir",
    highlyInfluential: "Altamente influente",
    unknownAuthors: "Autores desconhecidos",
    noAbstract: "Resumo não disponível.",
    noTopics: "Sem temas",
    analyticsTitle: "Linha do tempo e análises",
    analyticsDescription: "Indicadores calculados a partir do paper selecionado e sua rede de citações.",
    totalPapers: "Total de papers",
    totalCitations: "Total de citações",
    influentialPapers: "Papers influentes",
    publicationsByYear: "Publicações por ano",
    publicationsByYearDescription: "Mostra a distribuição temporal do paper principal, suas referências e os papers que o citaram.",
    searchResults: "Resultados de pesquisa",
    networkComposition: "Composição da rede",
    mainPaperCitations: "Citações do paper principal",
    mostInfluentialPapers: "Papers mais influentes da rede",
    paperWithoutId: "Este paper não tem ID disponível",
    graphLegend: "Legenda",
    graphTools: "Arraste para mover · Role para dar zoom · Clique em um nó para ver detalhes",
    paperDetails: "Detalhes do paper",
    selectNodeDetails: "Selecione um nó para ver detalhes.",
    year: "Ano",
    type: "Tipo",
    topics: "Temas",
    openInOpenAlex: "Abrir no OpenAlex",
  },
};

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

  const language = settings.language || "es";
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

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
    { query: "Knowledge Graph", label: t.topicKnowledgeGraph },
    { query: "Machine Learning", label: t.topicMachineLearning },
    { query: "Citation Network", label: t.topicCitationNetwork },
    { query: "Natural Language Processing", label: t.topicNLP },
    { query: "Computer Vision", label: t.topicComputerVision },
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
      setSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
        message: t.completeAllFields,
      };
    }

    if (!cleanEmail.includes("@")) {
      return {
        ok: false,
        message: t.validEmail,
      };
    }

    if (password.length < 6) {
      return {
        ok: false,
        message: t.passwordMinError,
      };
    }

    const users = getStoredUsers();

    const exists = users.some((user) => user.email === cleanEmail);

    if (exists) {
      return {
        ok: false,
        message: t.emailExists,
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
      message: t.accountCreated,
    };
  };

  const handleLogin = ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return {
        ok: false,
        message: t.enterEmailPassword,
      };
    }

    const users = getStoredUsers();

    const user = users.find(
      (item) => item.email === cleanEmail && item.password === password
    );

    if (!user) {
      return {
        ok: false,
        message: t.wrongCredentials,
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
      message: t.loginSuccess,
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

    const confirmDelete = window.confirm(t.confirmDeleteAccount);

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
      alert(t.searchError);
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
      setGraphError(t.graphLoadError);
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
      setNetworkError(t.networkLoadError);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        t={t}
      />

      <div className="app-main">
        <header className="topbar">
          <div>
            <h1>ResearchGraph</h1>
            <p>{t.appSubtitle}</p>
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
                  t={t}
                />
              )}

              <div className="search-content-area">
                <section className="hero-section">
                  <h2>{t.searchTitle}</h2>
                  <p>{t.searchSubtitle}</p>

                  <SearchBar
                    query={query}
                    setQuery={setQuery}
                    onSearch={() => handleSearch()}
                    loading={loading}
                    onToggleFilters={() => setShowFilters((prev) => !prev)}
                    t={t}
                  />

                  <div className="trending-section">
                    <h3>{t.trendingTopics}</h3>

                    <div className="topic-list">
                      {trendingTopics.map((topic) => (
                        <button
                          key={topic.query}
                          className="topic-chip"
                          onClick={() => handleSearch(topic.query)}
                        >
                          {topic.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {papers.length > 0 && (
                  <section className="results-area">
                    <div className="section-title">
                      <h3>
                        {totalResults.toLocaleString()} {t.resultsFound}
                      </h3>
                      <span>
                        {t.showingPage} {page} {t.of} {totalPages || 1}
                      </span>
                    </div>

                    <div className="paper-list">
                      {papers.map((paper) => (
                        <PaperCard
                          key={paper.paper_id}
                          paper={paper}
                          onSelect={handleSelectPaper}
                          t={t}
                        />
                      ))}
                    </div>

                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={(newPage) =>
                        handleSearch(query, newPage, filters)
                      }
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
                <h2>{loading ? t.graphLoadingTitle : t.noPaperSelected}</h2>
                <p>
                  {graphError ||
                    (loading ? t.graphLoadingText : t.graphEmptyText)}
                </p>
              </div>
            ) : (
              <>
                <section className="graph-main-full">
                  <div className="graph-header">
                    <div>
                      <h2>{t.citationNetwork}</h2>
                      <p>
                        {t.selectedPaper}: <strong>{graphData.main_paper?.title}</strong>
                      </p>
                    </div>

                    <div className="graph-stats">
                      <span>
                        {graphData.nodes?.length || 0} {t.nodes}
                      </span>
                      <span>
                        {graphData.edges?.length || 0} {t.relations}
                      </span>
                    </div>
                  </div>

                  <CitationGraph
                    graphData={graphData}
                    onNodeClick={setSelectedNode}
                    t={t}
                  />
                </section>

                <section className="details-bottom">
                  <PaperDetailsPanel
                    paper={graphData?.main_paper || selectedPaper}
                    selectedNode={selectedNode}
                    t={t}
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
            t={t}
          />
        )}

        {activeView === "analytics" && (
          <main className="analytics-page">
            <AnalyticsPanel
              papers={papers}
              graphData={graphData}
              selectedPaper={selectedPaper}
              onOpenPaper={openPaperInNewTab}
              t={t}
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
          t={t}
        />
      )}

      {showAuth && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={closeModals}
          onLogin={handleLogin}
          onRegister={handleRegister}
          t={t}
        />
      )}

      {showAccount && currentUser && (
        <AccountModal
          currentUser={currentUser}
          onClose={closeModals}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          t={t}
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
  t,
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

    if (!total) return `0 ${t.results}`;

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(start + items.length - 1, total);

    return `${t.showing} ${start.toLocaleString()}-${end.toLocaleString()} ${t.of} ${total.toLocaleString()}`;
  };

  const renderPaperList = (items, type, currentPage, perPage) => {
    if (!items.length) {
      return <div className="network-empty-list">{t.noPapersAvailable}</div>;
    }

    return (
      <div className="network-paper-list">
        {items.map((paper, index) => {
          const paperId = paper.paper_id || paper.id;
          const title = paper.title || paper.label || t.noTitle;
          const displayIndex = (currentPage - 1) * perPage + index + 1;

          return (
            <article className="network-paper-item" key={paperId || index}>
              <div className={`network-paper-number ${type}`}>{displayIndex}</div>

              <div className="network-paper-info">
                <h4>{title}</h4>

                <p>
                  {paper.year || t.noYear} · {Number(
                    paper.citation_count || 0
                  ).toLocaleString()} {t.citations}
                </p>

                {paperId && <span>{paperId}</span>}
              </div>

              <button
                type="button"
                className="network-paper-open-btn"
                onClick={() => onOpenPaper?.(paperId)}
                disabled={!paperId}
                title={t.openGraphTitle}
              >
                {t.openGraph}
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
          <h2>{t.loadingFullList}</h2>
          <p>{t.loadingFullListText}</p>
        </div>
      </main>
    );
  }

  if (routeError) {
    return (
      <main className="network-papers-page">
        <div className="empty-graph">
          <div className="empty-icon">!</div>
          <h2>{t.cannotLoadList}</h2>
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
          <h2>{t.noNetworkSelectedTitle}</h2>
          <p>{t.noNetworkSelectedText}</p>

          <button type="button" onClick={onGoSearch}>
            {t.goToSearch}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="network-papers-page">
      <section className="network-papers-header">
        <div>
          <h2>{t.networkTitle}</h2>
          <p>{t.networkDescription}</p>
        </div>

        <div className="network-papers-stats">
          <span>
            {Number(referencesInfo.total || 0).toLocaleString()} {t.referencesCount}
          </span>
          <span>
            {Number(citingInfo.total || 0).toLocaleString()} {t.citingPapersCount}
          </span>
        </div>
      </section>

      <section className="network-main-paper-card">
        <span>{t.selectedPaper}</span>
        <h3>{mainPaper?.title || mainPaper?.label || t.noTitle}</h3>
        <p>
          {mainPaper?.year || t.noYear} · {Number(
            mainPaper?.citation_count || 0
          ).toLocaleString()} {t.citations}
        </p>
      </section>

      <section className="network-paper-columns">
        <div className="network-paper-column">
          <div className="network-column-title">
            <h3>{t.references}</h3>
            <span>{t.referencesDescription}</span>
            <strong>{getShowingText(referencesInfo, references)}</strong>
          </div>

          {loading ? (
            <div className="network-empty-list">{t.loadingReferences}</div>
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
            <h3>{t.citingPapers}</h3>
            <span>{t.citingPapersDescription}</span>
            <strong>{getShowingText(citingInfo, citingPapers)}</strong>
          </div>

          {loading ? (
            <div className="network-empty-list">{t.loadingCitingPapers}</div>
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
  t,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{t.settings}</h2>

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
              <h3>{t.appearance}</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>{t.theme}</strong>
                <p>{theme === "dark" ? t.darkModeActive : t.lightModeActive}</p>
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
              <h3>{t.notifications}</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>{t.newPublications}</strong>
                <p>{t.newPublicationsText}</p>
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
                <strong>{t.citationUpdates}</strong>
                <p>{t.citationUpdatesText}</p>
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
              <h3>{t.language}</h3>
            </div>

            <select
              className="popup-select"
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
            >
              <option value="es">{t.spanish}</option>
              <option value="en">{t.english}</option>
              <option value="pt">{t.portuguese}</option>
            </select>
          </section>

          <section className="popup-section">
            <div className="popup-section-title">
              <span className="section-icon orange-soft">
                <Shield size={18} />
              </span>
              <h3>{t.privacySecurity}</h3>
            </div>

            <div className="setting-card">
              <div>
                <strong>{t.publicProfile}</strong>
                <p>{t.publicProfileText}</p>
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
              <h3>{t.data}</h3>
            </div>

            <button className="data-action" onClick={onExportData}>
              <strong>{t.exportData}</strong>
              <span>{t.exportDataText}</span>
            </button>

            {currentUser ? (
              <button className="danger-action" onClick={onDeleteAccount}>
                <strong>{t.deleteAccount}</strong>
                <span>{t.deleteAccountText}</span>
              </button>
            ) : (
              <button className="data-action disabled-action" disabled>
                <strong>{t.accountNotStarted}</strong>
                <span>{t.accountNotStartedText}</span>
              </button>
            )}
          </section>
        </div>

        <div className="popup-footer">
          <button className="popup-secondary-btn" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ authMode, setAuthMode, onClose, onLogin, onRegister, t }) {
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
          <h2>{isLogin ? t.loginTitle : t.registerTitle}</h2>

          <button className="popup-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="auth-popup-form">
          {!isLogin && (
            <label>
              {t.fullName}
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
            {t.email}
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
            {t.password}
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

          {!isLogin && <p className="password-help">{t.minPassword}</p>}

          {authMessage && <p className="auth-error">{authMessage}</p>}

          <button type="button" className="auth-primary-btn" onClick={submitAuth}>
            {isLogin ? t.loginButton : t.registerButton}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t.or}</span>
        </div>

        <div className="auth-change">
          {isLogin ? (
            <p>
              {t.noAccount} <button onClick={() => changeMode("register")}>{t.registerHere}</button>
            </p>
          ) : (
            <p>
              {t.alreadyAccount} <button onClick={() => changeMode("login")}>{t.loginHere}</button>
            </p>
          )}
        </div>

        <p className="auth-terms">{t.authTerms}</p>
      </div>
    </div>
  );
}

function AccountModal({ currentUser, onClose, onLogout, onDeleteAccount, t }) {
  const createdDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString()
    : t.notAvailable;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="account-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{t.myAccount}</h2>

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
            <span>{t.registrationDate}</span>
            <strong>{createdDate}</strong>
          </div>

          <button className="account-action-btn" onClick={onLogout}>
            <LogOut size={17} />
            {t.logout}
          </button>

          <button className="account-danger-btn" onClick={onDeleteAccount}>
            <Trash2 size={17} />
            {t.deleteAccount}
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
          className={pageNumber === page ? "pagination-btn active" : "pagination-btn"}
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
