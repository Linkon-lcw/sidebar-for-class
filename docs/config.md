### 基础配置 (`transforms`)

控制侧边栏窗口的位置和外观：

```json
"transforms": {
    "display": 2,          // 显示在哪个显示器上 (索引从0开始，具体取决于 Electron 的显示器接口)
    "height": 64,          // 侧边栏的高度 (百分比或像素，具体视实现而定，通常用于折叠/展开逻辑)
    "posy": 350,           // 侧边栏在屏幕垂直方向的起始位置 (像素)
    "animation_speed": 1,   // 动画速度系数
    "size": 150            // 缩放百分比
}
```

### 组件配置 (`widgets`)

`widgets` 是一个数组，定义了侧边栏中包含的功能模块。

#### 1. 启动器 (Launcher)

```json
{
    "type": "launcher",
    "layout": "grid",      // 布局模式: "vertical" | "grid" | "grid_no_text"
    "targets": [
        {
            "name": "记事本",              // 显示名称
            "target": "notepad.exe",      // 可执行文件路径或 URI
            "args": []                    // 启动参数 (可选)
        }
    ]
}
```

#### 2. 音量滑块 (Volume Slider)

```json
{
    "type": "volume_slider",
    "range": [0, 100]      // 音量范围 (通常为 0-100)
}
```

#### 3. 文件列表 (Files)

```json
{
    "type": "files",
    "folder_path": "C:\\Users\\YourUsername\\Documents",  // 文件夹路径
    "layout": "vertical",                                  // 布局模式: "vertical" | "grid"
    "max_count": 5                                         // 最大显示文件数量
}
```

#### 4. 拖放拉起 (Drag To Launch)

```json
{
    "type": "drag_to_launch",
    "name": "LocalSend",                                  // 显示名称
    "targets": "C:\\Program Files\\LocalSend\\localsend_app.exe {{source}}",  // 可执行文件路径或 URI
    "show_all_time": false                                // 是否始终显示
}
```
