# Base64 Decoder Chrome Extension

一个自动检测和解码网页中Base64字符串的Chrome浏览器扩展。

## 功能特性

- 🔍 自动扫描网页中的所有文本内容
- 🔓 智能识别和解码Base64编码字符串
- 🎨 完全自定义解码文本的CSS样式
- 🌐 支持通配符域名模式匹配
- ⚙️ 灵活的域名白名单配置
- 🚀 实时监控动态内容变化
- 📝 正则表达式模式匹配Base64字符串

## 安装方法

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入扩展程序管理页面 (`chrome://extensions/`)
3. 在右上角开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 扩展程序安装完成

## 使用方法

### 自动模式
- 安装后扩展会自动在所有网站上运行
- 检测到的Base64字符串会自动解码并高亮显示

### 域名模式设置
1. 点击浏览器工具栏中的扩展图标
2. 在弹出的设置界面中配置域名模式：

**支持的域名模式：**
- `example.com` - 精确匹配域名
- `*.example.com` - 匹配所有子域名（如 www.example.com, api.example.com）
- `.example.com` - 匹配域名及其所有子域名
- `test*.com` - 前缀通配符匹配
- `*.*.com` - 多级通配符匹配
- `?` - 单字符通配符

3. 如果不添加任何域名模式，扩展将在所有网站上运行
4. 添加模式后，扩展仅在匹配的域名上运行

### 自定义样式
在设置界面的"解码文本样式设置"区域：
1. 直接输入CSS代码来自定义解码文本的外观
2. 实时预览样式效果
3. 支持所有CSS属性，包括 `!important` 声明
4. 点击"恢复默认样式"可重置为默认外观

**CSS示例：**
```css
background-color: #ff6b6b !important;
color: white !important;
border: 2px solid #ee5a52 !important;
padding: 4px 8px !important;
border-radius: 8px !important;
font-weight: bold !important;
```

## 技术实现

- **Manifest V3** 标准
- **Content Scripts** 处理页面内容
- **Chrome Storage API** 保存设置
- **MutationObserver** 监控动态内容
- **正则表达式** 验证Base64格式和通配符匹配
- **CSS解析器** 处理自定义样式
- **DocumentFragment** 精确替换Base64文本

## 文件结构

```
convert-base64-extension/
├── manifest.json      # 扩展配置文件
├── content.js        # 内容脚本
├── popup.html       # 设置界面HTML
├── popup.js         # 设置界面逻辑
├── background.js    # 后台服务脚本
├── styles.css       # 样式文件
└── README.md        # 说明文档
```

## 注意事项

- 扩展会自动过滤掉 `<script>` 和 `<style>` 标签中的内容
- 只解码长度大于4且符合Base64格式的字符串
- 解码后会验证是否为可显示的文本内容
- 修改域名模式或样式设置后会自动刷新相关标签页
- 通配符模式不区分大小写
- 自定义CSS支持所有标准CSS属性和 `!important` 声明