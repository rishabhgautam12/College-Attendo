import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [image, setImage] = useState(null); // ✅ Store File object, not an object
  const [photoData, setPhotoData] = useState(""); // To store the captured photo preview
  const videoRef = useRef(null);
  const constraints = {
    video: true,
  };
  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  };
  

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL("image/png");

    // Convert dataURL to Blob
    const blob = await fetch(photoDataUrl).then((res) => res.blob());

    // Convert Blob to File
    const file = new File([blob], "photo.png", { type: "image/png" });

    setImage(file); // ✅ Correctly storing File object
    setPhotoData(photoDataUrl);
    stopCamera();
  };

  const ResetCamera = () => {
    stopCamera();
    setPhotoData(""); // Clear captured photo preview
    setImage(null); // ✅ Reset File state
  };

  const AttendSession = async (e) => {
    e.preventDefault();
    let regno = e.target.regno.value;
      // ✅ Ensure teacher email exists
  const teacherEmail = localStorage.getItem("teacher_email");
  if (!teacherEmail) {
    alert("Error: Teacher email not found. Please retry.");
    return;
  }

    if (!regno || !image) {
      alert("Please fill all fields and capture a photo.");
      return;
    }

    try {
      // Get user IP address
      axios.defaults.withCredentials = false;
      const res = await axios.get("https://api64.ipify.org?format=json");
      axios.defaults.withCredentials = true;
      let IP = res.data.ip;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          let locationString = `${latitude},${longitude}`;

          const formData = new FormData();
          formData.append("token", token);
          formData.append("regno", regno);
          formData.append("session_id", localStorage.getItem("session_id"));
          formData.append("teacher_email", localStorage.getItem("teacher_email"));
          formData.append("IP", IP);
          formData.append("date", new Date().toISOString().split("T")[0]);
          formData.append("Location", locationString);
          formData.append("student_email", localStorage.getItem("email"));
          formData.append("image", image); // ✅ Ensure image is File

          try {
            console.log("Sending data to server...");
            const response = await axios.post(
              "http://localhost:5000/sessions/attend_session",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            document.querySelector(".form-popup-inner").innerHTML = `<h5>${response.data.message}</h5>`;
          } catch (err) {
            console.error("Upload Error:", err.response ? err.response.data : err.message);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching IP:", error);
    }
  };

  return (
    <div className="form-popup">
      <button onClick={togglePopup}>
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">
        <h5>Enter Your Details</h5>
        {!photoData && <video ref={videoRef} width={300} autoPlay={true} />}
        {photoData && <img src={photoData} width={300} alt="Captured" />}
        <div className="cam-btn">
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={capturePhoto}>Capture</button>
          <button onClick={ResetCamera}>Reset</button>
        </div>

        <form onSubmit={AttendSession}>
          <input
            type="text"
            name="regno"
            placeholder="RegNo"
            autoComplete="off"
            required
          />
          <button type="submit">Done</button>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;




