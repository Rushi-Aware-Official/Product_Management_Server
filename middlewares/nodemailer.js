import nodemailer from "nodemailer";

export const authDetails = {
  admin: "",
  pass: "",
};

export const transporter = nodemailer.createTransport({
  // pool: true,
  host: "smtppro.zoho.in",
  port: 465,
  // secure: false,
  auth: {
    user: authDetails.admin,
    pass: authDetails.pass,
  },
});

export const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `${authDetails.admin}`,
    to,
    subject,
    html,
  });
};
