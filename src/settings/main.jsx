/**
 * 设置窗口的主入口文件
 * 负责初始化 React 应用并挂载到 DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'

// 创建 React 根节点并渲染设置应用
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
