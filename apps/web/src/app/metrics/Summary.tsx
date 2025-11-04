import { useState } from "react"


export default function Summary() {
  const [metrics, setMetrics] = useState({
    targetsAdded: 100,
    emailsSent: 50,
    opens: 40,  // mocked data
    replies: 30, // manual data
    conversions: 20, // manual data
  })

  return (
    <div className="metrics-summary space-y-4">
      <div className="metric-item">
        <p>Targets Added (Last 30 Days)</p>
        <h3>{metrics.targetsAdded}</h3>
      </div>
      <div className="metric-item">
        <p>Emails Sent (Last 30 Days)</p>
        <h3>{metrics.emailsSent}</h3>
      </div>
      <div className="metric-item">
        <p>Opens (Mocked)</p>
        <h3>{metrics.opens}</h3>
      </div>
      <div className="metric-item">
        <p>Replies (Manual)</p>
        <h3>{metrics.replies}</h3>
      </div>
      <div className="metric-item">
        <p>Conversions (Manual)</p>
        <h3>{metrics.conversions}</h3>
      </div>
    </div>
  )
}
