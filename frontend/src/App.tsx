import RoomList from './RoomList.js';       // 仲介業者側
import StatusUpdater from './AdminPanel.js'; // 管理会社側

function App() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '40px',
      padding: '40px',
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* 左側：仲介業者 */}
      <section style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <RoomList />
      </section>

      {/* 右側：管理会社 */}
      <section style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <StatusUpdater />
      </section>
    </div>
  );
}

export default App;