import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCamera from "./QRCamera";
import './index.css'; // include CSS

const App = () => {
  const [page, setPage] = useState(localStorage.getItem("loggedIn") ? "dashboard" : "login");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [password, setPassword] = useState("");
  const [gps, setGps] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ date: "", duration: "Full Day", reason: "" });
  const [mode, setMode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);  // 新增用來打卡

  useEffect(() => {
    getLocation();
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");
    if (id && name) setCurrentUser({ id, name });
  }, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setScanning(false);
      setPage("dashboard");
      setCountdown(null);
      setShowSuccess(false);
    }
  }, [countdown]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setGps({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => toast.error("無法取得 GPS 位置，請確認定位權限已開啟")
      );
    } else {
      toast.error("您的瀏覽器不支援定位功能");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "登入失敗");
        return;
      }
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.name);
      setCurrentUser(data.user);
      toast.success("登入成功！");
      setPage("dashboard");
    } catch (err) {
      toast.error("無法連線到伺服器");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setPage("login");
    setUserId("");
    setPassword("");
    setCurrentUser(null);
    toast.success("已登出");
  };

  const startScan = (selectedMode) => {
    setMode(selectedMode);
    setScanning(true);
  };

  const handleScan = (data) => {
    try {
      const qrData = JSON.parse(data);
      verifyLocation(qrData);
    } catch {
      toast.error("掃到無效的 QR Code");
      setScanning(false);
    }
  };

  const verifyLocation = (qrData) => {
    if (!gps || !currentUser) {
      toast.error("尚未取得 GPS 或尚未登入");
      return;
    }
    const distance = getDistance(gps.lat, gps.lng, qrData.lat, qrData.lng);
    const now = new Date();
    if (distance <= 2000) {
      const record = {
        employeeId: currentUser.id,
        type: mode === "in" ? "Clock In" : "Clock Out",
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString(),
        location: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
      };
      fetch("http://localhost:3001/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            toast.error(data.error || "打卡失敗");
            setShowFail(true);
            setTimeout(() => {
              setShowFail(false);
              setScanning(false);
            }, 2000);
          } else {
            toast.success("打卡成功，5秒後返回首頁");
            setShowSuccess(true);
            setCountdown(5);
          }
        })
        .catch(() => {
          toast.error("連線錯誤，打卡失敗");
        });
    } else {
      toast.error("你不在正確位置打卡");
      setShowFail(true);
      setTimeout(() => {
        setShowFail(false);
        setScanning(false);
      }, 2000);
    }
    setMode("");
  };

  const simulateScan = () => {
    const simulatedData = { lat: 25.1688, lng: 121.4587 };
    handleScan(JSON.stringify(simulatedData));
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (page === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">宏全實業有限公司-打卡系統</h1>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-80">
          <input type="text" placeholder="Enter your employee ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="border p-2 mb-4 w-full rounded" />
          <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-6 w-full rounded" />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">登入</button>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">掃描 GPS QR Code</h2>
        <QRCamera onScan={handleScan} />
        <button onClick={simulateScan} className="mt-4 bg-gray-300 text-black py-2 px-4 rounded">模擬 GPS QR Scan</button>
        {showSuccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-100 bg-opacity-80">
            <div className="text-green-600 text-6xl mb-4 animate-bounce">✔️</div>
            <div className="text-green-700 text-xl font-bold">打卡成功！</div>
          </div>
        )}
        {showFail && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 bg-opacity-80">
            <div className="text-red-600 text-6xl mb-4 animate-bounce">❌</div>
            <div className="text-red-700 text-xl font-bold">打卡失敗！</div>
          </div>
        )}
        {countdown !== null && (
          <div className="text-red-500 mt-4 text-lg font-semibold">
            將在 {countdown} 秒後返回首頁...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">宏銓實業有限公司-打卡系統</h1>
        <button onClick={handleLogout} className="text-blue-600">登出</button>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">考勤系統</h2>
        <p className="text-gray-500 mb-4">{new Date().toLocaleDateString("zh-TW", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="flex space-x-4 mb-6">
          <button onClick={() => startScan("in")} className="bg-green-500 text-white px-4 py-2 rounded">上班打卡</button>
          <button onClick={() => startScan("out")} className="bg-red-500 text-white px-4 py-2 rounded">下班打卡</button>
        </div>
      </div>
    </div>
  );
};

export default App;

