import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const navigate = useNavigate();

  // Fetch sessions from the backend
  const updateList = async () => {
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/sessions/getSessions",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSessionList(response.data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err.response?.data || err.message);
    }
  };

  // Toggle session details popup
  const toggleSessionDetails = (sessionId) => {
    const selectedSession = sessionList.find((session) => session.session_id === sessionId);
    setCurrentSession(selectedSession);
    setSessionDisplay(!isSessionDisplay);
  };

  // Toggle create session popup
  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  // Check authentication and fetch session list
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      updateList();
      document.querySelector(".logout").style.display = "block";
    }
  }, [token]);

  return (
    <div className="dashboard-main">
      <div className="row1">
        <div className="heading">
          <h2>Your Sessions</h2>
        </div>
        <div className="createbtncol">
          <button onClick={togglePopup} className="createbtn">
            Create Session
          </button>
        </div>
      </div>

      <div className="session-list">
        {sessionList.length > 0 ? (
          sessionList.map((session) => (
            <div
              key={session.session_id}
              className="flashcard"
              onClick={() => toggleSessionDetails(session.session_id)}
            >
              <div className="front">
                <h4>{session.name}</h4>
              </div>
            </div>
          ))
        ) : (
          <p>No sessions found</p>
        )}
      </div>

      {isSessionDisplay && currentSession && (
        <div className="popup-overlay">
          <SessionDetails currentSession={currentSession} toggleSessionDetails={toggleSessionDetails} />
        </div>
      )}

      {isOpen && (
        <div className="popup-overlay">
          <NewSession togglePopup={togglePopup} />
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;


