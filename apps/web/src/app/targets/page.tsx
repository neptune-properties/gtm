"use client";

import { useState } from "react";
import TargetsTable from "@/components/TargetsTable";
import ApolloSearchModal from "@/app/components/apollo-search"; // or "@/components/apollo-search" if you moved it

export default function TargetsPage() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Targets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search Apollo
        </button>
      </div>

      <ApolloSearchModal
        open={showModal}
        onClose={setShowModal}
        onAdded={() => setRefreshKey((k) => k + 1)} // 👈 forces table re-fetch
      />
      <TargetsTable key={refreshKey} refreshKey={refreshKey} />


    </div>
  );
}
