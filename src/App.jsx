import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/chatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
