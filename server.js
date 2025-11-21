const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cors = require("cors"); // ✅ CORS 추가

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS 설정: 특정 출처(origin) 허용
app.use(cors({
  origin: "https://ip-logger-1-vthi.onrender.com", // 담인님의 HTML이 있는 주소
  methods: ["GET", "POST"],
  credentials: false
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const logFile = path.join(__dirname, "ip-log.txt");

// ✅ IP 기록 엔드포인트
app.post("/log-ip", (req, res) => {
  const ip = req.body.ip || req.ip;
  const time = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false
  });
  const log = `${time} - ${ip}\n`;

  fs.appendFile(logFile, log, (err) => {
    if (err) {
      console.error("로그 저장 실패:", err);
      return res.status(500).send("서버 오류");
    }
    res.send("✅ IP가 기록되었습니다");
  });
});

// ✅ IP 목록 보기 (비밀번호 인증 필요)
app.get("/ips", (req, res) => {
  const secret = req.query.key;
  if (secret !== "damin-secret") {
    return res.status(403).send("🚫 접근 거부: 인증 실패");
  }

  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("기록을 불러올 수 없습니다");
    }
    res.type("text/plain").send(data);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});