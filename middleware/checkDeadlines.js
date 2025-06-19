const cron = require('node-cron');
const RadiologyRecord = require('../models/RadiologyRecords.Model');
const Radiologist = require('../models/Radiologists.Model');
const Center = require('../models/Radiology_Centers.Model');
const nodemailer = require("nodemailer");
const { cancelRecordByCron } = require("../controllers/RadiologyRecored.controller");
const notificationManager = require("../middleware/notfi");

const sendNotification = async (
  userId,
  userType,
  title,
  message,
  image,
  centername,
  type
) => {
  try {
    const result = await notificationManager.sendNotification(
      userId,
      userType,
      title,
      message,
      image,
      centername,
      type
    );

    return result;
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};

const sendEmail = async (to, centerName, centerEmail, recordId, patient_name, RadiologistName, type = "warning") => {
  let subject, contentText, alertColor;

  if (type === "warning") {
    subject = "Warning: Less Than One Hour Left Before Study Ends";
    contentText = `
      <p style="font-size: 16px; color: #555;">
        This is a reminder that there is less than <strong>one hour</strong> remaining before the end of the study for patient <strong>${patient_name}</strong> at center <strong>${centerName}</strong>.
      </p>
    `;
    alertColor = "#f0ad4e"; // warning color
  } else {
    subject = "Alert: Study Deadline Passed";
    contentText = `
      <p style="font-size: 16px; color: #555;">
        The study deadline for patient <strong>${patient_name}</strong> at center <strong>${centerName}</strong> has <strong>expired</strong> and the record has been marked as <strong>Cancelled</strong>.
      </p>
    `;
    alertColor = "#d9534f"; // danger color
  }

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto; background-color: #fff;">
      <div style="text-align: center;">
         <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Radintal Banner" style="width: 100%; max-height: 240px; object-fit: cover;">
      </div>
      <h2 style="color: ${alertColor}; text-align: center;">${subject}</h2>
      <p style="font-size: 16px; color: #555;">Dear ${RadiologistName},</p>
      ${contentText}
      <p style="font-size: 16px; color: #555;">
        Center Details:<br>
        Email: <a href="mailto:${centerEmail}">${centerEmail}</a><br>
        Study Record ID: <strong>${recordId}</strong>
      </p>
      <p style="font-size: 16px; color: #555;">Thank you for your attention.<br><strong>The Monitoring Team</strong></p>
    </div>
  `;

  const transporter = require("nodemailer").createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn",
    },
  });

  const mailOptions = {
    from: "radintelio@gmail.com",
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};


function startDeadlineChecker() {
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      const records = await RadiologyRecord.find({
        status: { $in: ['Ready', 'Diagnose'] }
      });

      for (const record of records) {
        const deadlineTime = new Date(record.deadline);
        const timeDiff = deadlineTime - now; 
        const oneHour = 60 * 60 * 1000;

        const radiologist = await Radiologist.findById(record.radiologistId);
        const center = await Center.findById(record.centerId);

        if (!radiologist || !center) continue;

        
        if (timeDiff > 0 && timeDiff <= oneHour && !record.emailWarningSent) {
          await sendEmail(
            radiologist.email,
            center.centerName,
            center.email,
            record._id,
            record.patient_name,
            `${radiologist.firstName} ${radiologist.lastName}`,
            "warning"
          );
            const notificationResult = await sendNotification(
            radiologist._id,
            "Radiologist",
            center.centerName,
            "Less than one hour left for study \n\nPatient: " + record.patient_name + " \nStudy ID: " + record._id + " \nCenter: " + center.centerName,
            center.image,
            center.centerName,
            "study"
            );
          record.emailWarningSent = true;
          await record.save();
          console.log(`📧 Warning email sent for record: ${record._id}`);
        }

        
        if (timeDiff <= 0 && !record.emailDeadlinePassedSent) {
          await sendEmail(
            radiologist.email,
            center.centerName,
            center.email,
            record._id,
            record.patient_name,
            `${radiologist.firstName} ${radiologist.lastName}`,
            "expired"
            );
            const notificationResult = await sendNotification(
            radiologist._id,
            "Radiologist",
            center.centerName,
            "Study deadline passed \n\n Patient: " + record.patient_name + " \n Study ID: " + record._id + " \nCenter: " + center.centerName,
            center.image,
            center.centerName,
            "study"
            );
          await cancelRecordByCron(record._id);
          record.emailDeadlinePassedSent = true;
          await record.save();
          console.log(`❌ Deadline expired - record cancelled: ${record._id}`);
        }
      }
    } catch (err) {
      console.error('❌ Error checking deadlines:', err.message);
    }
  });

  console.log('✅ Deadline checker started...');
}

module.exports = startDeadlineChecker;
