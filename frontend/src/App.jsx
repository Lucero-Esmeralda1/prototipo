import { useState } from "react";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import PaperCard from "./components/PaperCard";
import CitationGraph from "./components/CitationGraph";
import PaperDetailsPanel from "./components/PaperDetailsPanel";
import AnalyticsPanel from "./components/AnalyticsPanel";

import "./App.css";

export default function App() {
  const API_URL = "http://127.0.0.1:8000";

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
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

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
    </div>
  );
}



// import { useState } from "react";
// import axios from "axios";

// import Sidebar from "./components/Sidebar";
// import SearchBar from "./components/SearchBar";
// import PaperCard from "./components/PaperCard";
// import CitationGraph from "./components/CitationGraph";
// import PaperDetailsPanel from "./components/PaperDetailsPanel";
// import AnalyticsPanel from "./components/AnalyticsPanel";

// import "./App.css";

// export default function App() {
//   const API_URL = "http://127.0.0.1:8000";

//   const [activeView, setActiveView] = useState("search");
//   const [query, setQuery] = useState("");
//   const [papers, setPapers] = useState([]);
//   const [graphData, setGraphData] = useState(null);
//   const [selectedPaper, setSelectedPaper] = useState(null);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const trendingTopics = [
//     "Knowledge Graph",
//     "Machine Learning",
//     "Citation Network",
//     "Natural Language Processing",
//     "Computer Vision",
//   ];

//   const handleSearch = async (customQuery = query) => {
//     if (!customQuery.trim()) return;

//     try {
//       setLoading(true);
//       setQuery(customQuery);
//       setGraphData(null);
//       setSelectedPaper(null);
//       setSelectedNode(null);

//       const response = await axios.get(`${API_URL}/api/search`, {
//         params: {
//           query: customQuery,
//           max_results: 10,
//         },
//       });

//       setPapers(response.data.papers || []);
//       setActiveView("search");
//     } catch (error) {
//       console.error("Error buscando papers:", error);
//       alert("Error al buscar papers. Verifica que el backend esté activo.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectPaper = async (paper) => {
//     try {
//       setLoading(true);
//       setSelectedPaper(paper);
//       setSelectedNode(null);
//       setActiveView("graph");
      
//       // const response = await axios.get(`${API_URL}/api/graph`, {
//       //   params: {
//       //     paper_id: paper.paper_id,
//       //   },
//       // });
//       const response = await axios.get(`${API_URL}/api/graph`, {
//         params: {
//           paper_id: paper.paper_id,
//           max_references: 20,
//           max_citing: 20,
//         },
//       });

//       setGraphData(response.data);
//     } catch (error) {
//       console.error("Error construyendo grafo:", error);
//       alert("Error al construir el grafo.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="app-shell">
//       <Sidebar activeView={activeView} setActiveView={setActiveView} />

//       <div className="app-main">
//         <header className="topbar">
//           <div>
//             <h1>ResearchGraph</h1>
//             <p>Citation Network Explorer</p>
//           </div>
//         </header>




//         {activeView === "graph" && (
//           <main className="graph-page">
//             {!graphData ? (
//               <div className="empty-graph">
//                 <div className="empty-icon">↯</div>
//                 <h2>No Paper Selected</h2>
//                 <p>Search for a paper to visualize its citation network</p>
//               </div>
//             ) : (
//               <>
//                 <section className="graph-main-full">
//                   <div className="graph-header">
//                     <div>
//                       <h2>Citation Network</h2>
//                       <p>
//                         Selected paper:{" "}
//                         <strong>{graphData.main_paper?.title}</strong>
//                       </p>
//                     </div>

//                     <div className="graph-stats">
//                       <span>{graphData.nodes?.length || 0} nodes</span>
//                       <span>{graphData.edges?.length || 0} relations</span>
//                     </div>
//                   </div>

//                   <CitationGraph
//                     graphData={graphData}
//                     onNodeClick={setSelectedNode}
//                   />
//                 </section>

//                 <section className="details-bottom">
//                   <PaperDetailsPanel
//                     paper={graphData?.main_paper || selectedPaper}
//                     selectedNode={selectedNode}
//                   />
//                 </section>
//               </>
//             )}
//           </main>
//         )}



//         {/* {activeView === "search" && (
//           <main className="search-page">
//             <section className="hero-section">
//               <h2>Explore Scientific Research</h2>
//               <p>Discover papers and visualize citation networks</p>

//               <SearchBar
//                 query={query}
//                 setQuery={setQuery}
//                 onSearch={() => handleSearch()}
//                 loading={loading}
//               />

//               <div className="trending-section">
//                 <h3>Trending Topics</h3>

//                 <div className="topic-list">
//                   {trendingTopics.map((topic) => (
//                     <button
//                       key={topic}
//                       className="topic-chip"
//                       onClick={() => handleSearch(topic)}
//                     >
//                       {topic}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </section>

//             {papers.length > 0 && (
//               <section className="results-area">
//                 <div className="section-title">
//                   <h3>{papers.length} results found</h3>
//                   <span>Click a paper to build its citation graph</span>
//                 </div>

//                 <div className="paper-list">
//                   {papers.map((paper) => (
//                     <PaperCard
//                       key={paper.paper_id}
//                       paper={paper}
//                       onSelect={handleSelectPaper}
//                     />
//                   ))}
//                 </div>
//               </section>
//             )}
//           </main>
//         )}

//         {activeView === "graph" && (
//           <main className="graph-page">
//             {!graphData ? (
//               <div className="empty-graph">
//                 <div className="empty-icon">↯</div>
//                 <h2>No Paper Selected</h2>
//                 <p>Search for a paper to visualize its citation network</p>
//               </div>
//             ) : (
//               <>
//                 <section className="graph-main">
//                   <div className="graph-header">
//                     <div>
//                       <h2>Citation Network</h2>
//                       <p>
//                         Selected paper:{" "}
//                         <strong>{graphData.main_paper?.title}</strong>
//                       </p>
//                     </div>

//                     <div className="graph-stats">
//                       <span>{graphData.nodes?.length || 0} nodes</span>
//                       <span>{graphData.edges?.length || 0} relations</span>
//                     </div>
//                   </div>

//                   <CitationGraph
//                     graphData={graphData}
//                     onNodeClick={setSelectedNode}
//                   />
//                 </section>

//                 <PaperDetailsPanel
//                   paper={graphData?.main_paper || selectedPaper}
//                   selectedNode={selectedNode}
//                 />
//               </>
//             )}
//           </main>
//         )} */}

//         {activeView === "analytics" && (
//           <main className="analytics-page">
//             <AnalyticsPanel
//               papers={papers}
//               graphData={graphData}
//               selectedPaper={selectedPaper}
//             />

//             {/* <AnalyticsPanel papers={papers} graphData={graphData} /> */}

//           </main>
//         )}
//       </div>
//     </div>
//   );
// }







// import { useState } from "react";
// import axios from "axios";

// import SearchBar from "./components/SearchBar";
// import PaperCard from "./components/PaperCard";
// import CitationGraph from "./components/CitationGraph";
// import PaperDetailsPanel from "./components/PaperDetailsPanel";

// import "./App.css";

// function App() {
//   const [query, setQuery] = useState("");
//   const [papers, setPapers] = useState([]);
//   const [graphData, setGraphData] = useState(null);
//   const [selectedPaper, setSelectedPaper] = useState(null);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const API_URL = "http://127.0.0.1:8000";

//   const handleSearch = async () => {
//     if (!query.trim()) return;

//     try {
//       setLoading(true);
//       setGraphData(null);
//       setSelectedPaper(null);
//       setSelectedNode(null);

//       const response = await axios.get(`${API_URL}/api/search`, {
//         params: {
//           query: query,
//           max_results: 5,
//         },
//       });

//       setPapers(response.data.papers);
//     } catch (error) {
//       console.error("Error buscando papers:", error);
//       alert("Error al buscar papers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectPaper = async (paper) => {
//     try {
//       setLoading(true);
//       setSelectedPaper(paper);
//       setSelectedNode(null);

//       const response = await axios.get(`${API_URL}/api/graph`, {
//         params: {
//           paper_id: paper.paper_id,
//           max_references: 10,
//           max_citing: 10,
//         },
//       });

//       setGraphData(response.data);
//     } catch (error) {
//       console.error("Error construyendo grafo:", error);
//       alert("Error al construir el grafo");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNodeClick = (node) => {
//     setSelectedNode(node);
//   };

//   return (
//     <div className="app">
//       <header className="header">
//         <h1>Academic Citation Explorer</h1>
//         <p>
//           Busca papers académicos y explora sus relaciones de citación mediante
//           un grafo interactivo.
//         </p>

//         <SearchBar
//           query={query}
//           setQuery={setQuery}
//           onSearch={handleSearch}
//           loading={loading}
//         />
//       </header>

//       <main className="main-layout">
//         <section className="results-section">
//           <h2>Resultados</h2>

//           {papers.length === 0 && (
//             <p className="empty-text">Realiza una búsqueda para ver papers.</p>
//           )}

//           {papers.map((paper) => (
//             <PaperCard
//               key={paper.paper_id}
//               paper={paper}
//               onSelect={handleSelectPaper}
//             />
//           ))}
//         </section>

//         <section className="graph-section">
//           <h2>Grafo de citaciones</h2>

//           {graphData ? (
//             <CitationGraph
//               graphData={graphData}
//               onNodeClick={handleNodeClick}
//             />
//           ) : (
//             <div className="graph-placeholder">
//               Selecciona un paper para construir el grafo.
//             </div>
//           )}
//         </section>

//         <aside className="details-section">
//           <PaperDetailsPanel
//             paper={graphData?.main_paper || selectedPaper}
//             selectedNode={selectedNode}
//           />
//         </aside>
//       </main>
//     </div>
//   );
// }

// export default App;



// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App
