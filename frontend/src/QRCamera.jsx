import React from "react";
import QrScanner from "react-qr-scanner";

const QRCamera = ({ onScan }) => {
  const handleScan = (data) => {
    if (data) {
      onScan(data.text || data);
    }
  };

  const handleError = (err) => {
    console.error("Camera Error:", err);
  };

  const previewStyle = {
    height: 240,
    width: 320,
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <QrScanner
        delay={500}
        style={previewStyle}
        onError={handleError}
        onScan={handleScan}
        constraints={{
          audio: false,
          video: { facingMode: "environment" },
        }}
      />
    </div>
  );
};

export default QRCamera;

