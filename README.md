# 美国进口数据分析系统

本文档旨在介绍课程作业：美国进口数据分析系统 的使用方式以及代码组成结构

Enjoy It

## 后端服务端

### 环境与运行

```
flask
flask_cor
```

对应路径下命令行键入`python app.py`

### 文件结构

/back_end 为后端服务端文件夹 \
/back_end/data 为后端服务端静态数据文件夹，其下各子文件以及子文件夹分别存储数据，于 app.py 中分别有对应 api 实现 \
/back_end/data/FoodImports.csv 为原始数据 \
/back_end/data/LineChart 存储 折线图 LineChart 数据，vega_line.json 为 Line Chart Vega 语法式 json \
/back_end/data/PieChart 存储 饼图 PieChart 数据，文件命名为 `vega_pie_${year}.json` \
/back_end/data/TreemapChart 存储 树图 TreemapChart 数据，文件命名为 `vega_treemap_${year}.json` \
/back_end/data/WorldChart 存储 地球图 EarthChart 数据，文件命名为`vega_world_${year}_${category}.json` \
/back_end/app.py **后端服务端主要文件**，需要运行

## 前端

### 环境与运行

安装环境：根目录下命令行键入`npm install`

运行：根目录下命令行键入`npm run dev`

### 文件结构

/public 存储静态数据（图数据以转移至后端） \
/src 核心目录，存储核心文件 \
/src/components 存储核心组件 \
/src/components/LineChart.vue 为折线图 LineChart 组件 \
/src/components/PieChart.vue 为饼图 PieChart 组件 \
/src/components/TreemapChart.vue 为树图 TreemapChart 组件 \
/src/components/EarthChart.vue 为地球图 EarthChart 组件 \
/src/components/InsightsPanel.vue 为统计数据组件 \
/utils 工具文件夹 \
/utils/analytics.js 为辅助折线图 LineChart 中预测线、趋势线、平均值线计算的工具函数 \
/utils/serve.js 为通用的请求封装函数 \
/api 为为各组件请求数据设计的个性化请求函数