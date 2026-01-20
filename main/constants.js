/**
 * 常量定义模块
 * 存放全局常量
 */
const { app } = require('electron');

// 是否为开发环境
const isDev = !app.isPackaged;

module.exports = {
  isDev
};
