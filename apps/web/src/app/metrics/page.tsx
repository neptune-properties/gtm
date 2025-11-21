"use client"
import { useState } from "react"
import Kanban from "./Kanban"
import Summary from "./Summary"

export default function MetricsPage() {
  const [activeTab, setActiveTab] = useState<"kanban" | "summary">("kanban")

  const switchTab = (tab: "kanban" | "summary") => {
    setActiveTab(tab)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Metrics Dashboard</h1>
      
      <div className="flex gap-6 mb-4">
        {/* Tabs */}
        <button
          onClick={() => switchTab("kanban")}
          className={`px-4 py-2 ${activeTab === "kanban" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Kanban Board
        </button>
        <button
          onClick={() => switchTab("summary")}
          className={`px-4 py-2 ${activeTab === "summary" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Summary Metrics
        </button>
      </div>

      {/* Conditionally render based on active tab */}
      <div className="mt-4">
        {activeTab === "kanban" ? <Kanban /> : <Summary />}
      </div>
    </div>
  )
}


