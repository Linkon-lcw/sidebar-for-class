import React from 'react'
import ReactDOM from 'react-dom/client'
import Sidebar from './Sidebar'
import '../../style.css'

const rootElement = document.getElementById('app');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Sidebar />
        </React.StrictMode>,
    )
} else {
    console.error('Failed to find #app element');
}
