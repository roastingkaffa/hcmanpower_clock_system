
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCamera from "./QRCamera";
import './index.css'// include CSS

const App = () => {
  const [page, setPage] = useState(localStorage.getItem("loggedIn") ? "dashboard" : "login");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [password, setPassword] = useState("");
  const [gps, setGps] = useState(null);
  const [records, setRecords] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ date: "", duration: "Full Day", reason: "" });
  const [mode, setMode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false); // Show Failed status

  useEffect(() => {
    getLocation();
    const savedRecords = localStorage.getItem("records");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

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
    const res = await fetch("http://localhost:3001/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
	      account: userId, 
	      password: password 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "登入失敗");
      return;
    }

    // 儲存 user 資料
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("userName", data.user.name);

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
    setPage("login");
    setUserId("");
    setPassword("");
    setGps(null);
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
    if (!gps) {
      toast.error("尚未取得目前 GPS 位置");
      return;
    }
    const distance = getDistance(gps.lat, gps.lng, qrData.lat, qrData.lng);
    const now = new Date();
    if (distance <= 2000) {
      const newRecord = {
        type: mode === "in" ? "Clock In" : "Clock Out",
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString(),
        location: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
      };
      setRecords((prev) => [...prev, newRecord]);
      toast.success("打卡完成，5秒後返回首頁");
      setShowSuccess(true);
      setCountdown(5);
    } else {
      toast.error("你不在正確位置打卡");
      setShowFail(true);                    // show read x status
      setTimeout(() => {
        setShowFail(false);                // Auto clear
        setScanning(false);                // Return Previous pace
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
  const handleClock = async (type) => {
  if (!gps || !currentUser) {
    toast.error("尚未取得 GPS 或尚未登入");
    return;
  }

  const now = new Date();
  const record = {
    employeeId: currentUser.id,
    type,
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0],
    location: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
  };

  try {
    const res = await fetch("http://localhost:3001/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "打卡失敗");
    } else {
      toast.success(`${type} 成功`);
    }
  } catch (err) {
    toast.error("打卡時發生錯誤");
  }
};


  const submitLeave = () => {
    if (!leaveForm.date || !leaveForm.reason) {
      toast.error("請填寫完整請假資料");
      return;
    }
    const newLeave = {
      type: "Leave",
      date: leaveForm.date,
      duration: leaveForm.duration,
      reason: leaveForm.reason,
    };
    setRecords(prev => [...prev, newLeave]);
    setLeaveForm({ date: "", duration: "Full Day", reason: "" });
    toast.success("請假申請成功！");
    setPage("dashboard");
  };

  const groupedRecords = records.reduce((acc, record) => {
    acc[record.date] = acc[record.date] || [];
    acc[record.date].push(record);
    return acc;
  }, {});

  if (page === "login") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">宏全實業有限公司-打卡系統</h1>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-80">
          <input type="text" placeholder="Enter your employee ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="border p-2 mb-4 w-full rounded" />
          <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-6 w-full rounded" />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">登入</button>
          <div className="text-xs text-gray-400 mt-4">
            {gps ? (<p>Your Current Location<br />{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</p>) : (<p>Locating...</p>)}
          </div>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">掃描 GPS QR Code</h2>
        <QRCamera onScan={handleScan} />
        <button onClick={simulateScan} className="mt-4 bg-gray-300 text-black py-2 px-4 rounded">
          模擬 GPS QR Scan
        </button>

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

  if (page === "apply-leave") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">Leave Application</h1>
        <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} className="border p-2 mb-4 w-full rounded" />
        <select value={leaveForm.duration} onChange={(e) => setLeaveForm({ ...leaveForm, duration: e.target.value })} className="border p-2 mb-4 w-full rounded">
          <option>Full Day</option>
          <option>Morning</option>
          <option>Afternoon</option>
        </select>
        <textarea placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="border p-2 mb-4 w-full rounded"></textarea>
        <button onClick={submitLeave} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Submit Leave</button>
        <button onClick={() => setPage("dashboard")} className="text-blue-600 mt-4 block w-full">Back</button>
      </div>
    );
  }

  if (page === "view-records") {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">Attendance Records</h1>
        {Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a)).map(date => (
          <div key={date} className="mb-6">
            <h2 className="text-lg font-bold mb-2">{new Date(date).toDateString()}</h2>
            {groupedRecords[date].map((record, idx) => (
              <div key={idx} className={`p-3 rounded mb-2 ${record.type === 'Leave' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <div className="flex justify-between items-center">
                  <span>{record.type}</span>
                  <span className="text-gray-500 text-sm">{record.time || record.duration}</span>
                </div>
                <p className="text-sm text-gray-600">{record.reason || record.location}</p>
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => setPage("dashboard")} className="text-blue-600 mt-4 block w-full">Back</button>
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
        <p className="text-gray-500 mb-4">{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="flex space-x-4 mb-6">
          <button onClick={() => startScan("in")} className="bg-green-500 text-white px-4 py-2 rounded">上班打卡</button>
          <button onClick={() => startScan("out")} className="bg-red-500 text-white px-4 py-2 rounded">下班打卡</button>
        </div>

        <div className="flex space-x-4">
          <button onClick={() => setPage("apply-leave")} className="flex-1 bg-gray-200 py-2 rounded">申請休假</button>
          <button onClick={() => setPage("view-records")} className="flex-1 bg-gray-200 py-2 rounded">出勤紀錄查詢</button>
        </div>
      </div>
    </div>
  );
};

export default App;

