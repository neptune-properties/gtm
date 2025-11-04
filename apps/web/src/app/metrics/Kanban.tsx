import { useState, useEffect } from "react"
import styled from "styled-components"
import { supabaseBrowser } from "@/lib/supabaseClient"  // Use the correct browser-side Supabase client

const KanbanContainer = styled.div`
  display: flex;
  gap: 1.5rem;
`

const KanbanColumn = styled.div`
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  width: 30%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const KanbanItem = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export default function Kanban() {
  const [leads, setLeads] = useState<any[]>([])  // Store leads fetched from Supabase

  // Fetch leads data from Supabase using supabaseBrowser
  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabaseBrowser()
        .from("targets")
        .select("*")  // Fetch all columns
        .order("created_at", { ascending: false })  // Optional: Order by creation date

      if (error) {
        console.error("Error fetching leads:", error)
      } else {
        setLeads(data || [])
      }
    }

    fetchLeads()
  }, [])  // Empty dependency array means this effect runs once when the component mounts

  // Update lead status (moving it between columns)
  const updateStatus = (id: string, newStatus: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === id ? { ...lead, status: newStatus } : lead
      )
    )

    // Optionally, update the status in Supabase as well
    supabaseBrowser()
      .from("targets")
      .update({ status: newStatus })
      .eq("id", id)
  }

  // Define the possible statuses
  const statuses = [
    { name: "new", label: "New" },
    { name: "qualified", label: "Qualified" },
    { name: "contacted", label: "Contacted" },
  ]

  // Filter leads based on their status
  const getFilteredLeads = (status: string) => {
    if (status === "contacted") {
      return leads.filter((lead) =>
        ["emailed", "replied", "called", "converted"].includes(lead.status)
      )
    }
    return leads.filter((lead) => lead.status === status)
  }

  return (
    <KanbanContainer>
      {statuses.map((status) => (
        <KanbanColumn key={status.name}>
          <h3>{status.label}</h3>
          <div className="mt-4">
            {getFilteredLeads(status.name).map((lead) => (
              <KanbanItem key={lead.id}>
                <p>{lead.name}</p>
                <p>{lead.company}</p>
                <p>{lead.property}</p>
                <p>{lead.city}</p>
                <p>{lead.email}</p>
                <div className="flex gap-2 mt-2">
                  {/* Update status to 'qualified' or 'contacted' as needed */}
                  <button
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                    onClick={() => updateStatus(lead.id, "qualified")}
                  >
                    Qualified
                  </button>
                  <button
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    onClick={() => updateStatus(lead.id, "contacted")}
                  >
                    Contacted
                  </button>
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => updateStatus(lead.id, "replied")}
                  >
                    Replied
                  </button>
                </div>
              </KanbanItem>
            ))}
          </div>
        </KanbanColumn>
      ))}
    </KanbanContainer>
  )
}
