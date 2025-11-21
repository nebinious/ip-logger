require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const logFile = path.join(__dirname, "ip-log.txt");

// IP 기록
app.post("/log-ip", (req, res) => {
  const ip = req.body.ip || req.ip;
  const time = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false
  });
  const log = `${time} - ${ip}\n`;

  fs.appendFile(logFile, log, (err) => {
    if (err) return res.status(500).send("서버 오류");
    res.send("✅ IP 기록 완료");
  });
});

// 텍스트 형식 IP 목록
app.get("/ips", (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send("🚫 인증 실패");
  }

  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) return res.status(500).send("기록을 불러올 수 없습니다");
    res.type("text/plain").send(data);
  });
});

// CSV 형식 IP 목록
app.get("/ips.csv", (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send("🚫 인증 실패");
  }

  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) return res.status(500).send("기록을 불러올 수 없습니다");

    const lines = data.trim().split("\n");
    const csv = "날짜,IP\n" + lines.map(line => line.replace(" - ", ",")).join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("ip-log.csv");
    res.send(csv);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});