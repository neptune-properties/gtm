'use client';
import { useEffect, useState } from "react";

type Target = {
  id: string;
  owner_name?: string | null;
  company?: string | null;
  property?: string | null;
  city?: string | null;
  email?: string | null;
  source?: string | null;
  status: 'new'|'emailed'|'replied'|'called'|'converted';
};

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/targets');
      const data = await res.json();
      setTargets(data.targets || []);
    })();
  }, []);

  return (
    <div>
      <h2>Targets</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Owner</th>
            <th align="left">Company</th>
            <th align="left">Property</th>
            <th align="left">City</th>
            <th align="left">Email</th>
            <th align="left">Source</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          {targets.map(t => (
            <tr key={t.id}>
              <td>{t.owner_name}</td>
              <td>{t.company}</td>
              <td>{t.property}</td>
              <td>{t.city}</td>
              <td>{t.email}</td>
              <td>{t.source}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
