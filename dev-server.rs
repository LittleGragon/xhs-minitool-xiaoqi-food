use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::thread;

const PORT: u16 = 8080;
const ROOT_DIR: &str = ".";

fn main() {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", PORT)).unwrap();
    println!("========================================");
    println!("  🍲 小齐食单 - 本地开发服务器");
    println!("  📍 http://127.0.0.1:{}", PORT);
    println!("  📂 根目录: {}", ROOT_DIR);
    println!("========================================");
    println!("按 Ctrl+C 停止\n");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(move || handle_client(stream));
            }
            Err(e) => eprintln!("连接错误: {}", e),
        }
    }
}

fn handle_client(mut stream: TcpStream) {
    let mut reader = BufReader::new(&mut stream);
    let mut request_line = String::new();

    if reader.read_line(&mut request_line).is_err() {
        return;
    }

    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return;
    }

    let method = parts[0];
    let mut path = parts[1].to_string();

    // 只处理 GET 请求
    if method != "GET" {
        send_response(&mut stream, 405, "Method Not Allowed", "text/plain", b"Method Not Allowed");
        return;
    }

    // 去掉查询参数
    if let Some(idx) = path.find('?') {
        path.truncate(idx);
    }

    // URL 解码
    path = url_decode(&path);

    // 默认 index.html
    if path == "/" {
        path = "/index.html".to_string();
    }

    // 安全检查：防止路径遍历
    if path.contains("..") {
        send_response(&mut stream, 403, "Forbidden", "text/plain", b"Forbidden");
        return;
    }

    let file_path = format!("{}{}", ROOT_DIR, path);

    if Path::new(&file_path).is_file() {
        match fs::read(&file_path) {
            Ok(content) => {
                let content_type = get_content_type(&file_path);
                println!("  ✅ 200 {}", path);
                send_response(&mut stream, 200, "OK", &content_type, &content);
            }
            Err(_) => {
                println!("  ❌ 500 {}", path);
                send_response(&mut stream, 500, "Internal Server Error", "text/plain", b"Internal Server Error");
            }
        }
    } else {
        println!("  ❌ 404 {}", path);
        send_404(&mut stream, &path);
    }
}

fn send_response(stream: &mut TcpStream, status_code: u16, status_text: &str, content_type: &str, body: &[u8]) {
    let response = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\nCache-Control: no-cache\r\n\r\n",
        status_code, status_text, content_type, body.len()
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.write_all(body);
    let _ = stream.flush();
}

fn send_404(stream: &mut TcpStream, path: &str) {
    let body = format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>404 - 小齐食单</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:-apple-system,sans-serif;background:#fbf9f6;">
<div style="text-align:center;">
<div style="font-size:64px;">🍽️</div>
<h1 style="color:#ab3500;">404</h1>
<p style="color:#666;">找不到页面: {}</p>
<p><a href="/" style="color:#ff6b35;">返回首页</a></p>
</div>
</body></html>"#,
        path
    );
    send_response(stream, 404, "Not Found", "text/html; charset=utf-8", body.as_bytes());
}

fn get_content_type(path: &str) -> &'static str {
    let ext = Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let mut map = HashMap::new();
    map.insert("html", "text/html; charset=utf-8");
    map.insert("htm", "text/html; charset=utf-8");
    map.insert("css", "text/css; charset=utf-8");
    map.insert("js", "application/javascript; charset=utf-8");
    map.insert("json", "application/json; charset=utf-8");
    map.insert("png", "image/png");
    map.insert("jpg", "image/jpeg");
    map.insert("jpeg", "image/jpeg");
    map.insert("gif", "image/gif");
    map.insert("svg", "image/svg+xml");
    map.insert("ico", "image/x-icon");
    map.insert("webp", "image/webp");
    map.insert("woff", "font/woff");
    map.insert("woff2", "font/woff2");
    map.insert("txt", "text/plain; charset=utf-8");
    map.insert("md", "text/markdown; charset=utf-8");

    map.get(ext.as_str()).copied().unwrap_or("application/octet-stream")
}

fn url_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut result = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                result.push(byte);
                i += 3;
                continue;
            }
        }
        result.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&result).to_string()
}
