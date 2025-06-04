// NewSession.js
import React, { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import "../styles/NewSession.css";

const NewSession = ({ togglePopup }) => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [qrtoggle, setQrtoggle] = useState(false);
  const [qrData, setQrData] = useState("");

  const generateTimeSlots = () => {
    const slots = [];
    let start = new Date();
    start.setHours(9, 0, 0);

    const end = new Date();
    end.setHours(12, 20, 0);

    while (start < end) {
      const slotStart = new Date(start);
      start.setMinutes(start.getMinutes() + 50);
      const slotEnd = new Date(start);

      const formatTime = (time) =>
        time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const label = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
      const value = `${slotStart.getHours().toString().padStart(2, "0")}:${slotStart
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      slots.push({ label, value });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const createQR = async (e) => {
    e.preventDefault();

    const uuid = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const session_id = uuid();
    const name = e.target.name.value;
    const time = e.target.time.value;
    const radius = e.target.radius.value;
    const date = new Date().toISOString().split("T")[0];
    const duration = 50;
    let location = "";

    if (!name || !time || !radius) {
      alert("Please fill all the fields");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        location = `${latitude},${longitude}`;

        const formData = {
          session_id,
          date,
          time,
          name,
          duration,
          location,
          radius,
        };

        try {
          const response = await axios.post(
            "https://college-attendo.onrender.com/sessions/create",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setQrData(response.data.url);
          setQrtoggle(true);
        } catch (err) {
          console.error("Error creating session:", err);
          alert("Session creation failed: " + (err.response?.data || "Unknown error"));
        }
      },
      (error) => {
        console.error("Error getting geolocation:", error);
        alert("Location permission denied or error occurred.");
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qrData);
    alert("QR link copied to clipboard");
  };

  return (
    <div className="new-popup">
      <button onClick={togglePopup}>
        <strong>X</strong>
      </button>

      {!qrtoggle && (
        <div className="popup-inner">
          <h5>Create a New Session</h5>
          <form onSubmit={createQR}>
            <input
              type="text"
              name="name"
              placeholder="Session Name"
              autoComplete="off"
              required
            />

            <select name="time" required>
              <option value="">Select Time Slot</option>
              {timeSlots.map((slot, index) => (
                <option key={index} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>

            <select name="radius" required>
              <option value="">Select Radius</option>
              <option value="50">50 meters</option>
              <option value="75">75 meters</option>
              <option value="100">100 meters</option>
              <option value="150">150 meters</option>
            </select>

            <button type="submit">Create Session</button>
          </form>
        </div>
      )}

      {qrtoggle && (
        <div className="qr-code">
          <QRCodeSVG value={qrData} onClick={copyQR} size={200} />
          <button onClick={copyQR}>Copy</button>
        </div>
      )}
    </div>
  );
};

export default NewSession;
