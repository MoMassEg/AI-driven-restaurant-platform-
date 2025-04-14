const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    secure:true,
    host:'smtp.gmail.com',
    port:465,
    auth: {
      user: "email", 
      pass: "password", 
    },
  });
  const mailOptions = {
    to: `m7md.ndgamer@gmail.com`,
    subject: "Verify email",
    text: `your code for Verify is 1123`,
  };

  function sendMail(){
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
  console.log("email sent"); 
  }

  sendMail()