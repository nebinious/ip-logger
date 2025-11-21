const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

const ADMIN_KEY = process.env.ADMIN_KEY;
const logPath = path.join(__dirname, "ip-log.txt");

app.use(express.static("public"));

// 방문자 접속 시 IP 기록
app.get("/log-ip", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${ip}\n`);
  res.send("IP logged!");
});

// 관리자 페이지
app.get("/", (req, res) => {
  if (req.query.admin === ADMIN_KEY) {
    let logs = "";
    if (fs.existsSync(logPath)) {
      logs = fs.readFileSync(logPath, "utf8");
    }
    res.send(`
      <h1>관리자 페이지</h1>
      <pre>${logs}</pre>
      <a href="/ips.csv?key=${ADMIN_KEY}">📥 CSV 다운로드</a>
    `);
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// CSV 다운로드
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

// 새로 추가된 /ips 라우트 (텍스트로 로그 확인)
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