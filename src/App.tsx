import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import About from "./pages/About";
import LandingPage from "./pages/Landingpage";
import { mockConnectionStatus, mockContract } from "./data/mockTransactions";
import type { NavRoute } from "./types";

function App() {
  const [route, setRoute] = useState<NavRoute>("dashboard");
  const [started, setStarted] = useState(false);
  console.log("started =", started);
  const [contractAddress, setContractAddress] = useState("");

  if (!started) {
    return (
      <LandingPage
        onStart={(address) => {
          setContractAddress(address);
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        network={mockContract.network}
        connectionState={mockConnectionStatus.state}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar active={route} onNavigate={setRoute} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          {route === "dashboard" && (
            <Dashboard contractAddress={contractAddress} />
          )}

          {route === "transactions" && <Transactions />}

          {route === "settings" && <Settings />}

          {route === "about" && <About />}
        </main>
      </div>
    </div>
  );
}

export default App;