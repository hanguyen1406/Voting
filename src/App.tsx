import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import { AdminBoard } from './pages/AdminBoard';

function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminBoard />} />
          <Route path="/admin" element={<AdminBoard />} />
        </Routes>
      </BrowserRouter>
    </TournamentProvider>
  );
}

export default App;
