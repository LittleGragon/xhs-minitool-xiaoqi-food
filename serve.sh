#!/bin/bash
# 小齐食单 - 本地开发服务器启动脚本
# 基于 Rust 编译的静态文件服务器

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SRC="dev-server.rs"
BIN="dev-server"
PORT=8080

# 如果二进制不存在或源文件更新了，就重新编译
if [ ! -f "$BIN" ] || [ "$SRC" -nt "$BIN" ]; then
  echo "🔧 正在编译 Rust 服务器..."
  rustc "$SRC" -o "$BIN" -O
  echo "✅ 编译完成"
  echo ""
fi

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  端口 $PORT 已被占用，正在关闭旧进程..."
  lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

echo "🚀 启动开发服务器..."
echo ""

# 打开浏览器
sleep 0.5
open "http://127.0.0.1:$PORT"

# 启动服务器
./"$BIN"
