const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

// Node 16 환경일 경우 fetch 지원을 위해 필요
// npm install node-fetch
// const fetch = require("node-fetch");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const ADMIN_KEY = process.env.ADMIN_KEY;

// PostgreSQL 연결 풀
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

// 방문자 IP 기록 (위치까지 저장)
app.post("/log-ip", async (req, res) => {
  const ip = req.body.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  try {
    // 위치 조회
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,isp`;
    const r = await fetch(url);
    const geo = await r.json();

    // DB 저장 (IP + 위치)
    await pool.query(
      "INSERT INTO ip_logs (ip_address, country, city, isp) VALUES ($1, $2, $3, $4)",
      [ip, geo.country || null, geo.city || null, geo.isp || null]
    );

    res.send("IP + 위치 logged to DB!");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// ✅ 일반/관리자 페이지 분리
app.get("/", (req, res) => {
  if (req.query.admin === ADMIN_KEY) {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// ✅ 관리자용 로그 조회 (JSON)
app.get("/ips", async (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).send("인증 실패");
  }
  try {
    const result = await pool.query("SELECT * FROM ip_logs ORDER BY timestamp DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// CSV 다운로드
app.get("/ips.csv", async (req, res) => {
  if (req.query.key === ADMIN_KEY) {
    try {
      const result = await pool.query("SELECT * FROM ip_logs ORDER BY timestamp DESC");
      const csv = result.rows.map(r => `${r.timestamp},${r.ip_address},${r.country || ""},${r.city || ""},${r.isp || ""}`).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ip-log.csv");
      res.send(csv);
    } catch (err) {
      res.status(500).send("DB error");
    }
  } else {
    res.status(403).send("인증 실패");
  }
});

// ✅ 위치 조회 (관리자 전용)
// 특정 IP 조회
app.get("/geo", async (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).json({ error: "관리자 인증 필요" });
  }

  const ip = req.query.ip;
  if (!ip) return res.status(400).json({ error: "ip 파라미터 필요" });

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon,isp,org,timezone,query`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== "success") {
      return res.status(400).json({ error: data.message || "조회 실패" });
    }

    res.json({
      ip: data.query,
      country: data.country,
      region: data.regionName,
      city: data.city,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      lat: data.lat,
      lon: data.lon,
      note: "IP 기반 위치는 도시/구 수준 추정치이며 오차가 큽니다."
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류", detail: String(err) });
  }
});

// 접속자 본인 IP 조회
app.get("/geo/me", async (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).json({ error: "관리자 인증 필요" });
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (forwarded?.split(",")[0]?.trim()) || req.socket.remoteAddress;

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon,isp,org,timezone,query`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.status !== "success") {
      return res.status(400).json({ error: data.message || "조회 실패" });
    }

    res.json({
      ip: data.query,
      country: data.country,
      region: data.regionName,
      city: data.city,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      lat: data.lat,
      lon: data.lon,
      note: "IP 기반 위치는 도시/구 수준 추정치이며 오차가 큽니다."
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});