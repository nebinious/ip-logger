const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();
const app = express();

const ADMIN_KEY = process.env.ADMIN_KEY;
const logPath = path.join(__dirname, "ip-log.txt");

// ✅ PostgreSQL 연결 풀
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static("public"));
app.use(express.json()); // ✅ POST 요청에서 JSON 파싱

// 방문자 접속 시 IP 기록 (POST 방식)
app.post("/log-ip", async (req, res) => {
  const ip = req.body.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const logLine = `${new Date().toISOString()} - ${ip}\n`;

  // ✅ 파일에 기록
  fs.appendFileSync(logPath, logLine);

  // ✅ DB에 기록
  try {
    await pool.query("INSERT INTO ip_logs (ip_address) VALUES ($1)", [ip]);
  } catch (err) {
    console.error("DB 저장 오류:", err);
  }

  res.send("IP logged via POST!");
});

// 관리자 페이지
app.get("/", async (req, res) => {
  if (req.query.admin === ADMIN_KEY) {
    let logs = "";
    if (fs.existsSync(logPath)) {
      logs = fs.readFileSync(logPath, "utf8");
    }

    // ✅ DB 로그도 불러오기
    let dbLogs = "";
    try {
      const result = await pool.query("SELECT * FROM ip_logs ORDER BY timestamp DESC");
      dbLogs = result.rows.map(r => `${r.timestamp} - ${r.ip_address}`).join("\n");
    } catch (err) {
      dbLogs = "DB 조회 오류";
    }

    res.send(`
      <h1>관리자 페이지</h1>
      <h2>📂 파일 로그</h2>
      <pre>${logs}</pre>
      <h2>🗄️ DB 로그</h2>
      <pre>${dbLogs}</pre>
      <a href="/ips.csv?key=${ADMIN_KEY}">📥 CSV 다운로드</a>
    `);
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// CSV 다운로드 (파일 로그 기준)
app.get("/ips.csv", (req, res) => {
  if (req.query.key === ADMIN_KEY) {
    if (fs.existsSync(logPath)) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ip-log.csv");
      res.send(fs.readFileSync(logPath, "utf8"));
    } else {
      res.send("No logs yet.");
    }
  } else {
    res.status(403).send("인증 실패");
  }
});

// /ips 라우트 (텍스트 로그 확인)
app.get("/ips", (req, res) => {
  if (req.query.key === ADMIN_KEY) {
    if (fs.existsSync(logPath)) {
      res.setHeader("Content-Type", "text/plain");
      res.send(fs.readFileSync(logPath, "utf8"));
    } else {
      res.send("No logs yet.");
    }
  } else {
    res.status(403).send("인증 실패");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});