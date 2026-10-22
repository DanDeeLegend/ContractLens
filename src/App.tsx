import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import About from "./pages/About";
import LandingPage from "./pages/LandingPage";
import { useContractActivity } from "./hooks/useContractActivity";
import type { NavRoute } from "./types";

function App() {
  const [route, setRoute] = useState<NavRoute>("dashboard");
  // Empty until the visitor picks a contract on the landing page.
  const [contractAddress, setContractAddress] = useState("");
  const activity = useContractActivity(contractAddress);

  if (!contractAddress) {
    return <LandingPage onStart={setContractAddress} />;
  }

  return (
    <div className="flex h-full flex-col">
      <Header network="Sepolia" connectionState={activity.connection} />

      <div className="flex min-h-0 flex-1">
        <Sidebar active={route} onNavigate={setRoute} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          {route === "dashboard" && <Dashboard activity={activity} onMonitor={setContractAddress} />}
          {route === "transactions" && <Transactions activity={activity} />}
          {route === "settings" && <Settings activity={activity} />}
          {route === "about" && <About />}
        </main>
      </div>
    </div>
  );
}

export default App;
