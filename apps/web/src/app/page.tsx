import TargetsTable from '@/components/TargetsTable';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 32 }}>Neptune — GTM MVP</h1>
          <TargetsTable />
        </div>
      </div>
    </div>
  );
}
