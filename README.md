"Implemented OAuth integration for Grafana; fixed network issues in Docker setup by adjusting domain settings and updated Grafana config (domain, root_url) for seamless OAuth flow. Resolved cookie handling and state management issues in server-side OAuth logic."



**1.** start from configuring Grafana.ini file:


#################################### Server ####################################
**[server]**

http_port = 3001

domain = host.docker.internal


#################################### Generic OAuth ##########################

**[auth.generic\_oauth]**

enabled **=** true

name **=** OAuth

allow\_sign\_up **=** true

;auto\_login = false

client\_id **=** 12345

client\_secret **=** 12345

scopes **=** user:email,read:org

;empty\_scopes = false

auth\_url **=** http://host.docker.internal:3000/login

token\_url **=** http://host.docker.internal:3000/token

api\_url **=** http://host.docker.internal:3000/user\_info

redirect\_uri **=** http://host.docker.internal:3001/login/generic\_oauth

###########################################################################

Note:

- Port is set to 3001 instead of default 3000 because Node runs on port 3000
- Urls start with host.docker.internal because Grafana runs inside docker. Outside docker environment, only change urls to localhost
- Domain: When configuring Grafana, it's crucial to set the `domain` in Grafana's configuration to match your host address. If Grafana is hosted on Docker, setting the domain to `host.docker.internal` can resolve issues related to redirect_uri and exchange tokens. This setting ensures that Grafana correctly interprets and routes requests within the network.

**2.** restart Grafana and navigate to the Grafana main page :

When setting enabled = true

Grafana interface will have an option to sign in with OAuth

![Image 1](https://i2.paste.pics/f3100935c5b86a38d40b546b096a7868.png?rand=g1hHt0OVDZ "Image 1")


Note 2:

- In docker environment make sure you are accessing Grafana through host.docker.internal:3001 because using localhost:3001 will cause "missing saved state" error in Grafana as browser will have different domain than redirect\_uri = [http://host.docker.internal:3001/login/generic\_oauth](http://host.docker.internal:3001/login/generic_oauth)

**3.** Select Sign in with Oauth option to get redirected to Login page defined with auth\_url (Login page is different according to your application).

![Image 2](https://i2.paste.pics/60a8549e50d08bb6eeed7b5d25cbace8.png?rand=7CYK0adDHn "Image 2")


Notice the parameters in url

[client\_id=12345
 &redirect\_uri=http%3A%2F%2Flocalhost%3A3001%2Flogin%2Fgeneric\_oauth
 &response\_type=code
 &scope=user%3Aemail+read%3Aorg&state=Bqmh-iuNXnJd8ps6567KjB9IM4R9qqSKCnTx-TiRjzc%3D](http://host.docker.internal:3000/login?client_id=12345&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Flogin%2Fgeneric_oauth&response_type=code&scope=user%3Aemail+read%3Aorg&state=Bqmh-iuNXnJd8ps6567KjB9IM4R9qqSKCnTx-TiRjzc%3D)

**4.** After entering the correct credentials of your app (user1/password1 in our example). You will get redirected internally to redirect\_uri (http:///host.docker.internal:3001/login/generic\_oauth) where login/generic\_oauth is the default of Grafana and then Grafana will internally (without our notice) will request /token endpoint in our server to extract token. In this step, 3 endpoints will be hit from the api: /login (specified in LoginButton), /token and /user\_info (specified in token\_url and api\_url).

    app.post('/login', (req, res) =\> {

      const { username, password, client\_id, redirect\_uri, state } =req.body;

      // Check credentials and client\_id, redirect\_uri validation

      if (username==='user1'&&password==='password1'&&
          clients[client\_id] &&clients[client\_id].redirectUri===redirect\_uri) {

        // Generate authorization code
        constcode=generateUniqueCode();

        codes[code] = { username, client\_id };

        // Redirect with code and state and token in cookies
        res.redirect(`${'http:///host.docker.internal:3001/login/generic\_oauth'}?code=${code}&state=${state}`);

      } else {
        res.status(401).send('Unauthorized');

      }

    });

    app.post('/token', (req, res) =\> {

    const { code, client\_id, client\_secret } =req.body;

    if (codes[code] &&clients[client\_id] &&clients[client\_id].secret===client\_secret) {

    constuser= { username:'user1', email:'user1@mail.com' }; // This should be the user's data

    constsecret='your\_jwt\_secret'; // Use a strong, secret value for JWT signing

    consttoken=jwt.sign(user, secret, { expiresIn:'3h' });    res.json({ access\_token:token, token\_type:'bearer', expires\_in:3600 });

    deletecodes[code];

    } else {
    res.status(401).send('Unauthorized');
    }

    });

    app.get('/user\_info', (req, res) =\> {
  
    constauthHeader=req.headers.authorization;
  
    if (authHeader) {
      consttoken=authHeader.split(' ')[1];

    jwt.verify(token, 'your\_jwt\_secret', (err, user) =\> {


      // User data to return. Modify according to your needs

      constuserData= {
        // here i am generating random username and email as user info
        username:crypto.randomBytes(10).toString('hex'),
        email:crypto.randomBytes(10).toString('hex')
        // Add more user fields as required
      };
      res.json(userData);
    });

    } else {
    res.status(401).send('Unauthorized');
    }
    });

Note:

- Notice that /login here is POST handling login and generating code logic and is different than GET /login which is the interface of login.

**5.** And here we go

![Image 3](https://i2.paste.pics/32b7bbedac27e58ab6be7f9853d12411.png?rand=J4SgkhLfMj "Image 3")

**6.** Issues that arise and solution:

Throughout the process of setting up OAuth for Grafana, several key issues were addressed:

0. Grafana (as per my understanding), registers a new user every time we sign in using OAuth and we can't duplicate username and email so I am using different username and email and generating them randomly (for now).

1. OAuth and OpenID Connect Implementation: Initially, the focus was on understanding and implementing the OAuth and OpenID Connect protocols within a React, NodeJS, and CouchDB stack.

2. Endpoints Setup: Defining the necessary endpoints (/auth, /token, /user\_info) in the Node.js server for the OAuth flow, including handling the login process and token generation.

3. Frontend-Backend Communication: Configuring the frontend (React) to interact correctly with the backend (Node.js) for authentication, including handling redirects and token exchange.

4. Grafana Configuration: Adjusting Grafana's `grafana.ini` for OAuth, particularly setting the correct URLs for `auth_url` and `token_url`, and ensuring the redirect URI matches the OAuth server.

5. Cookie Handling: Addressing issues related to setting and transmitting cookies, especially concerning the `SameSite` attribute and ensuring cookies are sent in cross-origin requests.

6. Network Issues in Docker: Solving network connectivity problems when running Grafana in Docker, requiring the use of `host.docker.internal` or appropriate network addresses instead of `localhost`.

7. OAuth State Management: Ensuring the correct generation and validation of the `oauth_state` parameter to prevent CSRF attacks and maintain the integrity of the authentication flow.

8. "failed to look up session from cookie" error: Indicating issues with session management or cookie handling.

9. "login.OAuthLogin(NewTransportWithCode) user token not found": A problem in the token exchange process in the OAuth flow.

10. "login.OAuthLogin(missing saved state)": Issues with managing the `state` parameter in the OAuth process, crucial for CSRF protection.

11. "login.OAuthLogin(get info from generic\_oauth)": Challenges related to fetching user information from the OAuth provider.

12. "oauth2: token expired and refresh token is not set": Indicating problems with token validity or refresh token mechanisms.

13. "login.OAuthLogin(missing user token)": Problems with the user token either not being generated, stored, or transmitted correctly.
