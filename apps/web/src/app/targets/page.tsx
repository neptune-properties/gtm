import { exportCSV } from "@/lib/csvExport"

export default function TargetsPage() {
  const targets = [
    { name: "John Doe", company: "ABC", property: "Building A", city: "NY", email: "john@abc.com", source: "LinkedIn" },
    { name: "Jane Smith", company: "XYZ", property: "Building B", city: "SF", email: "jane@xyz.com", source: "Email" },
    // Add more dummy data or fetch from API
  ]

  return (
    <div>
      <h1>Targets</h1>
      <button onClick={() => exportCSV(targets)}>Export CSV</button>
      {/* Display targets here */}
    </div>
  )
}
