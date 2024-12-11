import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
//import ThreeScene from './MainPage'
//import App from './NewApp'
// import App from './NewApp123'
// import App from './new_newApp'
// import ThreeScene from './MainPage'
import Viewer from './new_new_newApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Viewer />
    {/* <ThreeScene/> */}
  </StrictMode>,
)
