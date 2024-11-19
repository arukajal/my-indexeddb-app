import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
//import ThreeScene from './MainPage'
//import App from './NewApp'
import App from './NewApp123'
// import ThreeScene from './MainPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <ThreeScene/> */}
  </StrictMode>,
)
