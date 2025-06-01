import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import "../styles/SessionDetails.css";
import Papa from "papaparse";

const SessionDetails = ({ currentSession, toggleSessionDetails }) => {
  const [qr, setQR] = useState("");

  useEffect(() => {
    if (currentSession) {
      async function getQR() {
        try {
          const response = await axios.post("http://localhost:5000/sessions/getQR", {
            session_id: currentSession.session_id,
            token: localStorage.getItem("token"),
          });
          setQR(response.data.url);
        } catch (error) {
          console.log(error);
        }
      }
      getQR();
    }
  }, [currentSession]);

  if (!currentSession) return <p>Loading session details...</p>;

  const getDistance = (studentDistance, sessionRadius) => {
    const isWithinRange = studentDistance <= sessionRadius;
    return {
      distance: `${studentDistance}m`,
      color: isWithinRange ? "green" : "red",
    };
  };

  const showImage = (event) => {
    window.open(event.target.src, "_blank");
  };

  

  

  const downloadCSV = () => {
    if (!currentSession) return;
  
    // Convert session details into a single row format for better Excel formatting
    const sessionInfo = [
      [
        "Session Name",
        "Session Date",
        "Session Time",
        "Session Duration",
        "Session Location",
        "Session Radius (meters)",
      ],
      [
        currentSession.name,
        currentSession.date.split("T")[0],
        currentSession.time,
        currentSession.duration,
        currentSession.location,
        currentSession.radius,
      ],
      [], // Empty row for spacing
    ];
  
    // Attendance data headers
    const attendanceHeader = ["Reg No", "IP Address", "Date", "Email", "Distance (m)"];
    
    const attendanceData = [...currentSession.attendance]
    .sort((a, b) => a.regno.localeCompare(b.regno))
    .map((student) => [   student.regno,
      student.IP,
      student.date.split("T")[0],
      student.student_email,
      student.distance,
    ]);
  
    // Combine session info and attendance
    const csvData = [...sessionInfo, attendanceHeader, ...attendanceData];
  
    // Generate CSV content using PapaParse
    const csv = Papa.unparse(csvData, {
      delimiter: ",", // Ensure proper separation for Excel
      newline: "\r\n", // Windows-style new lines for better Excel compatibility
    });
  
    // Ensure UTF-8 BOM to make Excel read special characters correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  
    // Create a downloadable link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Session_Details_${currentSession.name}.csv`;
  
    // Force open in Excel if possible
    a.addEventListener("click", () => {
      setTimeout(() => {
        window.URL.revokeObjectURL(url); // Clean up memory
      }, 100);
    });
  
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  


  return (
    <div className="popup">
      <button onClick={toggleSessionDetails ? toggleSessionDetails : () => {}}>
        <strong>X</strong>
      </button>
      <div className="popup-inner">
        <div className="popup-content">
          <div className="session-details">
            <p><strong>Session Name</strong>: {currentSession.name}</p>
            <p><strong>Session Date</strong>: {currentSession.date.split("T")[0]}</p>
            <p><strong>Session Time</strong>: {currentSession.time}</p>
            <p><strong>Session Duration</strong>: {currentSession.duration}</p>
            <p><strong>Session Location</strong>: {currentSession.location}</p>
            <p><strong>Session Radius</strong>: {currentSession.radius} meters</p>
          </div>
          <div className="qr-code">
            {qr ? (
              <>
                <QRCodeSVG value={qr} size={200} />
                <button onClick={() => navigator.clipboard.writeText(qr)} className="copybtn">Copy</button>
              </>
            ) : (
              <p>Loading QR Code...</p>
            )}
          </div>
        </div>
        <div className="student-list scrollable-content">
          <p>Students Attended:</p>
          <button onClick={downloadCSV} className="csvbtn">Download CSV</button>
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>IP</th>
                <th>Date</th>
                <th>Email</th>
                <th>Distance</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
            {[...currentSession.attendance]
    .sort((a, b) => a.regno.localeCompare(b.regno)) // Sorting in ascending order
    .map((student, index) => (
                <tr key={index}>
                  <td>{student.regno}</td>
                  <td>{student.IP}</td>
                  <td>{student.date.split("T")[0]}</td>
                  <td>{student.student_email}</td>
                  <td
                    className="distance"
                    style={{ color: getDistance(student.distance, currentSession.radius).color }}
                  >
                    {getDistance(student.distance, currentSession.radius).distance}
                  </td>
                  <td>
                    {student.image ? (
                      <img
                        src={student.image}
                        alt="student"
                        className="student-image"
                        width={100}
                        onClick={showImage}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
