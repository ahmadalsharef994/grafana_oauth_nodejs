const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const clients = {
  '12345': { secret: '12345', redirectUri: 'http://host.docker.internal:3001/login/generic_oauth' }
};

const codes = {};


const generateUniqueCode = () => {
  return crypto.randomBytes(20).toString('hex');
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/login', (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  // Validate the client_id and redirect_uri
  if (!clients[client_id] || clients[client_id].redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  // Render or send a login form
  res.send(`
    <form action="/login" method="post">
      <input type="hidden" name="client_id" value="${client_id}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="hidden" name="state" value="${state}" />
      Username: <input type="text" name="username"><br>
      Password: <input type="password" name="password"><br>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const { username, password, client_id, redirect_uri, state } = req.body;

  // Check credentials and client_id, redirect_uri validation
  if (username === 'user1' && password === 'password1' && 
      clients[client_id] && clients[client_id].redirectUri === redirect_uri) {
    // Generate authorization code
    const code = generateUniqueCode();
    codes[code] = { username, client_id };

    // Redirect with code and state and token in cookies

    res.redirect(`${'http:///host.docker.internal:3001/login/generic_oauth'}?code=${code}&state=${state}`);
   } else {
    // Invalid credentials or client details
    res.status(401).send('Unauthorized');
  }
});


app.post('/token', (req, res) => {
  console.log('post /token')

  const { code, client_id, client_secret } = req.body;

  if (codes[code] && clients[client_id] && clients[client_id].secret === client_secret) {
    const user = { username: 'user1', email: 'user1@mail.com' }; // This should be the authenticated user's data
    const secret = 'your_jwt_secret'; // Use a strong, secret value for JWT signing
    
    const token = jwt.sign(user, secret, { expiresIn: '3h' });    res.json({ access_token: token, token_type: 'bearer', expires_in: 3600 });
    delete codes[code];
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/user_info', (req, res) => {
  console.log('GET /user_info');
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden access if token is invalid
      }

      // User data to return. Modify according to your needs
      const userData = {
        username: crypto.randomBytes(20).toString('hex'),
        email: crypto.randomBytes(20).toString('hex')
        // Add more user fields as required
      };

      res.json(userData);
    });
  } else {
    res.status(401).send('Unauthorized');
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
