"use client";

import { useState } from "react";
import ApolloSearchModal from "@/app/components/apollo-search";
import TargetsTable from "@/components/TargetsTable";

export default function TargetsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6">
      {/* Button at top-right */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search Apollo
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Targets</h1>

      <ApolloSearchModal open={showModal} onClose={setShowModal} />
      <TargetsTable />
    </div>
  );
}
