// src/App.tsx
import React, { useState } from "react";
import { HashRouter, Routes, Route, Link, Outlet } from "react-router-dom";

import { Tabs } from "./components/Tabs";
import Stammdaten from "./pages/Stammdaten";
import Geraete from "./pages/Geraete";
import Vermietungen from "./pages/Vermietungen";
import Einnahmen from "./pages/Einnahmen";
import Berichte from "./pages/Berichte";
import GeraetDetailPage from "./pages/GeraetDetail";

import logoSrc from "./assets/logo.svg";
// Optional: wenn du lieber aus src/assets importierst, ersetze `logoSrc` durch:
// import logoSrc from "./assets/logo.svg";


function Layout() {
  return (
    <>
      {/* Header mit Logo */}
      <header className="max-w-6xl mx-auto p-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <img
            src={logoSrc}
            alt="Firmenlogo"
            className="h-14 w-auto select-none"
            draggable={false}
          />
          <span className="sr-only">Mietpark-Management</span>
        </Link>
      </header>
      <Outlet />
    </>
  );
}

function HomeTabs() {
  const [tab, setTab] = useState<string>("Geräte");
  const tabs = ["Geräte", "Vermietungen", "Einnahmen", "Berichte", "Stammdaten"];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Überschrift entfällt, Logo ist im Header */}
      <Tabs tabs={tabs} current={tab} onChange={setTab} />
      {tab === "Geräte" && <Geraete />}
      {tab === "Vermietungen" && <Vermietungen />}
      {tab === "Einnahmen" && <Einnahmen />}
      {tab === "Berichte" && <Berichte />}
      {tab === "Stammdaten" && <Stammdaten />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeTabs />} />
          <Route path="/geraete/:id" element={<GeraetDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
