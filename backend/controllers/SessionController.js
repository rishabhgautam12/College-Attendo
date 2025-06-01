import dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import uploadImage from "../middleware/cloudinary.js";
// import QRCode from "qrcode";

function getQR(session_id, email) {
  let url = `${process.env.CLIENT_URL}/login?${querystring.stringify({
    session_id,
    email,
  })}`;
  console.log("Generated QR Code URL:", url); // Debugging output
  return url;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
}
function checkStudentDistance(Location1, Location2) {
  Location1 = Location1.split(",");
  Location2 = Location2.split(",");
  const locationLat1 = parseFloat(Location1[0]);
  const locationLon1 = parseFloat(Location1[1]);
  const locationLat2 = parseFloat(Location2[0]);
  const locationLon2 = parseFloat(Location2[1]);

  const distance = haversineDistance(
    locationLat1,
    locationLon1,
    locationLat2,
    locationLon2
  );
  return distance.toFixed(2);
}

//make controller functions

async function CreateNewSession(req, res) {
  let { session_id, name, duration, location, radius, date, time, token } =
    req.body;
  let tokenData = req.user;

  let newSession = {
    session_id,
    date,
    time,
    name,
    duration,
    location,
    radius,
  };

  try {
    let teacher = await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { sessions: newSession } }
    );

    res.status(200).json({
      url: getQR(session_id, teacher.email),
      message: "Session created successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get sessions
async function GetAllTeacherSessions(req, res) {
  try {
    let tokenData = req.user;
    const teacher = await Teacher.findOne({ email: tokenData.email });
    res.status(200).json({ sessions: teacher.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get QR
async function GetQR(req, res) {
  try {
    let tokenData = req.user;
    let url = getQR(req.body.session_id, tokenData.email);
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
// async function GetQR(req, res) {
//   try {
//     let tokenData = req.user;
//     let url = getQR(req.body.session_id, tokenData.email);

//     console.log("Generated QR Code URL:", url); // Debugging log

//     // Generate QR Code image
//     const qrCodeImage = await QRCode.toDataURL(url);

//     res.status(200).json({ url, qrCode: qrCodeImage }); // Send both URL and QR image
//   } catch (err) {
//     console.error("QR Code Generation Error:", err);
//     res.status(400).json({ message: err.message });
//   }
// }


//attend session
async function AttendSession(req, res) {
  try {
    let tokenData = req.user;
    let { session_id, teacher_email, regno, IP, student_email, Location, date } = req.body;

    //  Check if the file exists
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    let imageName = req.file.filename;
    let present = false;

    const teacher = await Teacher.findOne({ email: teacher_email });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    let session_details = {};

    for (let session of teacher.sessions) {
      if (session.session_id === session_id) {
        let distance = checkStudentDistance(Location, session.location);

        for (let student of session.attendance) {
          if (student.regno === regno || student.student_email === student_email) {
            present = true;
            break;
          }
        }

        if (!present) {
          const imageUrl = await uploadImage(imageName);

          session_details = {
            session_id: session.session_id,
            teacher_email: teacher.email,
            name: session.name,
            date: session.date,
            time: session.time,
            duration: session.duration,
            distance: distance,
            radius: session.radius,
            image: imageUrl,
          };

          session.attendance.push({
            regno,
            image: imageUrl,
            date,
            IP,
            student_email: tokenData.email,
            Location,
            distance,
          });

          await Teacher.findOneAndUpdate(
            { email: teacher_email },
            { sessions: teacher.sessions }
          );

          await Student.findOneAndUpdate(
            { email: student_email },
            { $push: { sessions: session_details } }
          );

          return res.status(200).json({ message: "Attendance marked successfully" });
        }
      }
    }

    return res.status(200).json({ message: "Attendance already marked" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

//get student sessions
async function GetStudentSessions(req, res) {
  let tokenData = req.user;
  try {
    const student = await Student.findOne({
      email: tokenData.email,
    });
    res.status(200).json({ sessions: student.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

const SessionController = {
  CreateNewSession,
  GetAllTeacherSessions,
  GetQR,
  AttendSession,
  GetStudentSessions,
};

export default SessionController;
