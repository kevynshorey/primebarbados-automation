export default function Setup() {
  return (
    <main style={{fontFamily:'Arial', padding:24, maxWidth:900}}>
      <h1>Setup</h1>
      <ol>
        <li>Set env vars in Vercel.</li>
        <li>Open /api/health to confirm deployment.</li>
        <li>Import n8n workflows from /n8n/workflows.</li>
      </ol>
    </main>
  );
}
