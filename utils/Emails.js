export const getInvitationEmailHtml = (
  projectName,
  invitedBy,
  acceptLink,
  rejectLink
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Invitation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #007bff;
        color: #ffffff;
        padding: 10px;
        border-radius: 8px 8px 0 0;
        text-align: center;
      }
      .header h1 {
        margin: 0;
      }
      .content {
        padding: 20px;
        text-align: center;
      }
      .content h2 {
        margin: 0;
        font-size: 24px;
        color: #007bff;
      }
      .content p {
        margin: 10px 0;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        margin: 10px;
        background-color: #007bff;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
      }
      .button:hover {
        background-color: #0056b3;
      }
      .button.reject {
        background-color: #dc3545;
      }
      .button.reject:hover {
        background-color: #c82333;
      }
      .footer {
        text-align: center;
        padding: 10px;
        color: #777;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Project Invitation</h1>
      </div>
      <div class="content">
        <h2>You're Invited!</h2>
        <p>You have been invited to join the project <strong>${projectName}</strong> by <strong>${invitedBy}</strong>.</p>
        <p>Please choose one of the options below:</p>
        <a href="${acceptLink}" class="button">Accept Invitation</a>
        <a href="${rejectLink}" class="button reject">Reject Invitation</a>
      </div>
      <div class="footer">
        <p>If you have any questions, please contact us at support@example.com.</p>
      </div>
    </div>
  </body>
  </html>
    `;
};

export const getResetPasswordEmailHtml = (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset_password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #007bff;
          color: #ffffff;
          padding: 10px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
        }
        .content {
          padding: 20px;
          text-align: center;
        }
        .content h2 {
          margin: 0;
          font-size: 24px;
          color: #007bff;
        }
        .content p {
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 20px 0;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
          font-size: 16px;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          padding: 10px;
          color: #777;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
          <p>If you did not request a password reset, please ignore this email. Otherwise, click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact us at support@example.com.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};
