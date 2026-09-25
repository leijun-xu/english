# english
全栈+AI项目

# 架构设计
整体架构采用，Monorepo + 微服务 + workspace

# 前端技术
分布Vue3全家桶(Vue3 + Router + Pinia + ElementPlus + Axios + Vite + TailwindCss)
通讯(WebSocket + SSE + fetch + navigator.sendBeacon)全覆盖了
3D(Three.js + gsap)

# 后端
Nestjs + ORM框架(Prisma7) + 文件服务(Minio) + 邮件服务(nodemailer) + 消息队列(bullmq) + 支付(支付宝SDK)

# 数据库
业务库:PostgreSQL
缓存：Redis
埋点/分析：ClickHouse（OLAP、事件明细与聚合，偏数据仓库用法）

# AI
langchain.js + langgraph.js + RAG(向量数据库) + Tools(工具) + 文档loader

# 游戏
godot游戏开发，实现一个Roguelike游戏跟我们的项目结合

# 埋点SDK
事件统计
性能统计(Web Vitals)
错误统计
路由统计
PV/UV统计最后会把这些统计上报到clickHouse,然后会做一个BI报表

# 移动端
基于React Native实现移动端App

# 其他杂项
双Token的实现
大文件上传实现RAG向量数据库结合
虚拟列表BI报表
