<<<<<<< HEAD
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 정적 파일 제공 (public 폴더 안의 HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname, "public")));

// ips.txt 없으면 생성
if (!fs.existsSync("ips.txt")) {
  fs.writeFileSync("ips.txt", "");
}

// IP 기록 API
app.post("/log-ip", (req, res) => {
  const ip = req.body.ip;
  if (ip) {
    fs.appendFileSync("ips.txt", ip + "\n");
    res.send("IP logged: " + ip);
  } else {
    res.status(400).send("No IP provided");
  }
});

// IP 목록 보기
app.get("/ips", (req, res) => {
  const data = fs.readFileSync("ips.txt", "utf-8");
  res.send("<pre>" + data + "</pre>");
});

// Render 호환 포트 설정
const PORT = process.env.PORT || 4000;
=======
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 정적 파일 제공 (public 폴더 안의 HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname, "public")));

// ips.txt 없으면 생성
if (!fs.existsSync("ips.txt")) {
  fs.writeFileSync("ips.txt", "");
}

// IP 기록 API
app.post("/log-ip", (req, res) => {
  const ip = req.body.ip;
  if (ip) {
    fs.appendFileSync("ips.txt", ip + "\n");
    res.send("IP logged: " + ip);
  } else {
    res.status(400).send("No IP provided");
  }
});

// IP 목록 보기
app.get("/ips", (req, res) => {
  const data = fs.readFileSync("ips.txt", "utf-8");
  res.send("<pre>" + data + "</pre>");
});

// Render 호환 포트 설정
const PORT = process.env.PORT || 4000;
>>>>>>> f9f3d46 (feat: complete ip logger server with HTML)
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));