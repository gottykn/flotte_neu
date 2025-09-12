import React, { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import { Tabs } from "./components/Tabs";
import Stammdaten from "./pages/Stammdaten";
import Geraete from "./pages/Geraete";
import Vermietungen from "./pages/Vermietungen";
import Einnahmen from "./pages/Einnahmen";
import Berichte from "./pages/Berichte";
import GeraetDetailPage from "./pages/GeraetDetail"; // Detailseite für /geraete/:id

function HomeTabs() {
  const [tab, setTab] = useState<string>("Geräte");
  const tabs = ["Geräte", "Vermietungen", "Einnahmen", "Berichte", "Stammdaten"];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Mietpark-Management</h1>
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
        {/* Startansicht mit Tabs */}
        <Route path="/" element={<HomeTabs />} />
        {/* Detail-Route für einzelne Geräte */}
        <Route path="/geraete/:id" element={<GeraetDetailPage />} />
      </Routes>
    </HashRouter>
  );
}

