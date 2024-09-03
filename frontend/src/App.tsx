import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css'
import Landing from "./components/Landing";
import CodingPage from "./components/CodingPage";

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/coding" element={<CodingPage/>} />
      <Route path="/" element={<Landing/>} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
