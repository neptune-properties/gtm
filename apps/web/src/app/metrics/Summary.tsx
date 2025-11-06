import { useState, useEffect } from "react"
import { supabaseBrowser } from "@/lib/supabaseClient"  // Correct Supabase client for the browser

export default function Summary() {
  const [metrics, setMetrics] = useState({
    targetsAdded: 0,
    emailsSent: 0,
    opens: 0,  // Mocked data or could be updated with actual data
    replies: 0, // Manual data
    conversions: 0, // Manual data
  })

  // Fetch metrics data from Supabase
  useEffect(() => {
    const fetchMetrics = async () => {
      // Get the total number of targets added in the last 30 days
      const { data: targetsData, error: targetsError } = await supabaseBrowser()
        .from("targets")
        .select("id")
        .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())  // Filter by last 30 days
      if (targetsError) {
        console.error("Error fetching targets data:", targetsError)
      }

      // Get the total number of emails sent (status = 'emailed')
      const { data: emailsData, error: emailsError } = await supabaseBrowser()
        .from("targets")
        .select("id")
        .eq("status", "emailed")  // Filter by 'emailed' status
        .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
      if (emailsError) {
        console.error("Error fetching emails data:", emailsError)
      }

      // Count "replies" (status = 'replied')
      const { data: repliesData, error: repliesError } = await supabaseBrowser()
        .from("targets")
        .select("id")
        .eq("status", "replied")  // Filter by 'replied' status
      if (repliesError) {
        console.error("Error fetching replies data:", repliesError)
      }

      // Count "conversions" (status = 'converted')
      const { data: conversionsData, error: conversionsError } = await supabaseBrowser()
        .from("targets")
        .select("id")
        .eq("status", "converted")  // Filter by 'converted' status
      if (conversionsError) {
        console.error("Error fetching conversions data:", conversionsError)
      }

      // Set the metrics state with the fetched data
      setMetrics({
        targetsAdded: targetsData?.length || 0,
        emailsSent: emailsData?.length || 0,
        opens: emailsData?.length || 0,  // Assuming opens are tracked similarly to emails
        replies: repliesData?.length || 0,
        conversions: conversionsData?.length || 0,
      })
    }

    fetchMetrics()
  }, [])  // Run this once when the component mounts

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
