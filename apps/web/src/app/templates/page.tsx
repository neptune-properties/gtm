import RequireAuth from "@/app/components/require-auth";

export default function TemplatesPage() {
  return (
    <RequireAuth>
      <div>
        <h2>Email Templates</h2>
        <p>CRUD coming soon. For MVP, we will seed 1–2 placeholder templates.</p>
      </div>
    </RequireAuth>
  );
}
