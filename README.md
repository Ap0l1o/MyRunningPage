# 我的跑步数据可视化网站

这是一个基于Gatsby开发的个人跑步数据可视化网站，通过Strava API自动同步和展示跑步活动数据。
![](https://cdn.jsdelivr.net/gh/Ap0l1o/ImageHostingService@main/img/runng-web/my-running-page.png)

## 功能特点

- 自动从Strava同步跑步数据
- 展示每次跑步的详细信息（距离、时长、配速等）
- 可视化展示跑步数据统计和趋势
- 支持热力图展示跑步活动频率

## 技术栈

- **前端框架**：Gatsby.js + React
- **数据可视化**：
  - Victory：用于绘制统计图表
  - Nivo：用于创建活动热力图
- **数据源**：Strava API
- **数据同步**：Python脚本自动化

## 项目结构

```
my-running-site/
├── content/
│   └── runs/          # 跑步数据Markdown文件
├── scripts/
│   ├── fetch_strava_data.py    # Strava数据同步脚本
│   └── get_strava_token.py     # Strava认证工具
├── src/
│   ├── components/    # React组件
│   ├── images/        # 静态图片资源
│   ├── pages/         # 页面组件
│   └── styles/        # 样式文件
└── gatsby-config.js   # Gatsby配置文件
```

## 快速开始

1. 克隆项目并安装依赖：
```bash
npm install
```

2. 配置Strava API：
- 在Strava开发者平台创建应用
- 配置环境变量（参考.env.example）

3. 同步数据：
```bash
python3 scripts/fetch_strava_data.py
```

4. 启动开发服务器：
```bash
npm run develop
```

## 数据同步机制

项目使用Python脚本通过Strava API获取跑步数据，并将数据转换为Markdown格式存储。主要特点：

- 支持增量同步，只获取最新数据
- 自动处理API访问令牌的刷新
- 异常重试机制，提高同步可靠性

## 部署

项目可以部署到任何支持静态网站的平台，如GitHub Pages：

```bash
npm run build
```

构建后的文件位于`public`目录，可直接部署。

## 许可证

MIT License
