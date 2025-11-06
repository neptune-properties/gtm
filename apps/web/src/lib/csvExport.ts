export const exportCSV = (data: any[]) => {
  const headers = ["Name", "Company", "Property", "City", "Email", "Source"]
  const rows = data.map((row) => [
    row.name,
    row.company,
    row.property,
    row.city,
    row.email,
    row.source,
  ])

  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
  rows.forEach((row) => {
    csvContent += row.join(",") + "\n"
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "targets.csv")
  document.body.appendChild(link)
  link.click()
}
