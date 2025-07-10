export const TemporaryPasswordEmail = (
  domain: string,
  email: string,
  password: string,
) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expenso Login Code</title>
  <style>
    body {
      background-color: #f4f4f7;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 480px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      text-align: left;
    }

    .logo {
      display: block;
      width: 64px;
      height: auto;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 24px;
      color: #333333;
    }

    .code {
      font-size: 22px;
      font-weight: bold;
      margin: 16px 0;
      color: #000000;
    }

    p {
      font-size: 16px;
      color: #555555;
      margin-bottom: 24px;
    }

    .button {
      display: inline-block;
      padding: 12px 20px;
      background-color: #363a4f;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    }
  </style>
</head>

<body>
  <div class="container">
    <img src="https://raw.githubusercontent.com/willianba/expenso/refs/heads/master/static/logo.png" alt="Expenso Logo"
      class="logo" />
    <h1>Here's your Expenso login code</h1>
    <div class="code">${password}</div>
    <p>This link and code will only be valid for the next 10 minutes. If the link doesn’t work, use the code below. If
      you need, you can resubmit the form to generate a new password</p>
    <a href="${domain}/password?email=${encodeURIComponent(email)}&password=${
    encodeURIComponent(password)
  }" class="button">Login to
      Expenso</a>
  </div>
</body>

</html>
`;
};
