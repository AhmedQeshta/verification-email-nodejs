# Verification Email Useing Nodejs + Express + Postgress


![Verfication Email Useing Nodejs + Express + Postgress](https://cdn2.hubspot.net/hubfs/529456/Email_Verification_Header.png)

## How to verify user email address in node.js ?

##### `node.js`, `Express.js`, `Postgress`

Every website should include an email verification feature. It will protect us against spammers. Because this is my first blog, I shall do my best. Let's get started coding.


### Create Node.js Folders App

firstly strat create express server, use this command For that: 

Create Node.js App
```shell
    $ mkdir verification-email
    $ cd verification-email
```

Next, we initialize the Node.js App with a package.json file:
```shell
  $ npm init -y
```

We need to install necessary modules.

```shell
  $ npm install express pg pg-hstore sequelize nodemailer joi env2 compression bcryptjs cors jsonwebtoken
```
```shell
  $ npm install nodemon -d
```

**Express** : Express is minimal and flexible Node.js web applicaton framework.
**postgress** : postgress is an database.
**sequelize** : sequelize is an database ORM.
**Nodemailer** : Nodemailer allow us to send email.
**Joi** : Joi is an object schema description language and validator for javascript objects.
**env2** : It loads environment variables from a .env file.

### package json

The package.json file should look like this :

```json
{
  "name": "verification-email",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon server"
  },
  "keywords": [
    "nodejs",
    "express",
    "email",
    "verification",
    "email-verification"
  ],
  "author": "Ahmed Qeshta",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "env2": "^2.2.2",
    "express": "^4.18.1",
    "joi": "^17.6.0",
    "jsonwebtoken": "^8.5.1",
    "nodemailer": "^6.7.5",
    "pg": "^8.7.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.20.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.16"
  }
}

```
### Project Structure

![Project Structure - part 1](https://i.imgur.com/qdpjtl7.png)
![Project Structure - part 2](https://i.imgur.com/RdIpT7y.png)



### Setup Express Web Server

#### In root Folder

> server\index.js
```javascript=1
const app = require('./app');

const port = app.get('port');

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});

```
> server\app.js

```javascript=1
require('env2')('.env');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { notFundError, serverError } = require('./error');

const routes = require('./routes');

const app = express();

app.disable('x-powered-by');

app.use([
  compression(),
  cors(),
  cookieParser(),
  express.json({ limit: '50mb' }),
  express.urlencoded({ extended: false }),
]);

app.set('port', process.env.PORT || 8080);

app.use('/api/v1/', routes);

app.use(notFundError);
app.use(serverError);

module.exports = app;

```

#### In Routes Folder

> server\routes\index.js
```javascript=1
const { Router } = require('express');
const auth = require('./auth');

const routes = Router();

// {domain-name}/api/v1/user
routes.use('/user', auth);

module.exports = routes;
```

> server\routes\auth.js
```javascript=1
const { Router } = require('express');
const { addUser, verifyUser, getUsers } = require('../controllers');

const user = Router();

// {domain-name}/api/v1/user
user.post('/', addUser);
user.get('/', getUsers);

// {domain-name}/api/v1/user/verify/:id/:token
user.get('/verify/:id/:token', verifyUser);

module.exports = user;

```

#### In Error Folder

> server\error\index.js

```javascript=1
const notFundError = require('./notFoundError');
const serverError = require('./serverError');

module.exports = { notFundError, serverError };
```

> server\error\notFoundError.js

```javascript=1
const notFoundError = (_, res) => {
  res.status(404).json({ status: 404, message: 'Not Found Page' });
};

module.exports = notFoundError;

```

> server\error\serverError.js

```javascript=1
const serverError = (error, _, res, next) => {
  if (error.status) {
    res.status(error.status).json({ status: error.status, message: error.message });
  } else {
    res.status(500).json({ status: 500, message: 'Server Error' });
  }
};

module.exports = serverError;
```


#### In Controllers Folder

>server\controllers\index.js
```javascript=1
const { addUser, verifyUser, getUsers } = require('./auth');

module.exports = { addUser, verifyUser, getUsers };

```

>server\controllers\auth\index.js
```javascript=1
const addUser = require('./addUser');
const getUsers = require('./getUsers');
const verifyUser = require('./verifyUser');

module.exports = { addUser, verifyUser, getUsers };

```

>server\controllers\auth\addUser.js
```javascript=1
const { CustomError, addUserSchema, generateToken } = require('../../utils');
const { User } = require('../../database');
const { hash } = require('bcryptjs');

const { verifyEmail } = require('../../utils/email/templates/verifyEmail');
const sendEmail = require('../../utils/email');

const addUser = async (req, res, next) => {
  try {
    const { email, password } = await addUserSchema.validateAsync(req.body, { abortEarly: false });

    // Check if the gym already exists
    const isExist = await User.findOne({
      where: { email },
    });
    // if is exist throw an error
    if (isExist) {
      throw CustomError('Sorry, This Email is already exist', 409);
    }

    const hashedPassword = await hash(password, 12);

    const { id } = await User.create({ email, password: hashedPassword });

    const payload = {
      id,
      email,
    };

    // Generate the token

    const token = await generateToken(payload, {
      expiresIn: '0.5h',
      algorithm: 'HS256',
    });

    const html = verifyEmail(`${process.env.BASE_URL}api/v1/user/verify/${id}/${token}`);
    sendEmail(email, 'Verify Your Email', html);

    res.status(201).json({
      message: 'An Email sent to your account please verify',
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return next(CustomError(error.message, 400));
    }
    return next(error);
  }
};

module.exports = addUser;
```


>server\controllers\auth\verifyUser.js
```javascript=1
const { User } = require('../../database');
const { checkToken, CustomError, paramsValidation } = require('../../utils');

const verifyUser = async ({ params }, res, next) => {
  try {
    const { id, token } = await paramsValidation.validateAsync(params);

    // Check if the gym already exists
    const user = await User.findByPk(id);
    // if is exist throw an error
    if (!user) throw CustomError('Sorry, Invalid link', 409);

    const tokenChecked = await checkToken(token);

    if (!tokenChecked) throw CustomError('Sorry, Invalid link', 409);

    await user.update({ verified: true });

    res.json({
      message: 'email verified successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(CustomError(error.message, 400));
    }
    return next(error);
  }
};

module.exports = verifyUser;

```

>server\controllers\auth\getUsers.js

```javascript=1
const { User } = require('../../database');

const getUsers = async (_, res, next) => {
  try {
    const user = await User.findAll();
    res.json({
      message: 'Get All User',
      user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = getUsers;
```

### Routes

|  Methods  |   Route Urls    |  Actions  |
| --------- | --------------- | --------- |
|    GET    | /api/v1/user    | Get All User In DataBase      |
|    POST    | /api/v1/user    | Create new User In DataBase      |
|    GET    | /api/v1/user/verify/:id/:token    | verify Email link, was sent by email      |



### Setup Database

First thing Create DataBase as `verify_email_db`, open your terminal or open sql shell
```shell=1
$ Psql -h localhost -p 5432 -U postgres
```
Enter Yor Password for user postgres:


```sql=1
CREATE DATABASE verify_email_db;
```

>.env File

```
BASE_URL = http://localhost:{your port}/
NODE_ENV = development
DB_URL = postgres://postgres:yourpassword@localhost:5432/db_name
TEST_DB_URL = postgres://postgres:yourpassword@localhost:5432/db_name_test
DATABASE_URL = your-prodction-DATABASE_URL
JWT_SECRET = your-jwt_SECRET

MAIL_HOST = smtp.mailtrap.io
MAIL_USER = user_mail
MAIL_PASS = passwor_mail
```

#### In DataBase Folder
>server\database\config\connection.js

```javascript=1
const { Sequelize } = require('sequelize');

require('env2')('.env');

const { NODE_ENV, DB_URL, TEST_DB_URL, DATABASE_URL, DB_BUILD } = process.env;

let dbUrl = '';
let ssl = false;

switch (NODE_ENV) {
  case 'development':
    dbUrl = DB_URL;
    ssl = false;
    break;
  case 'test':
    dbUrl = TEST_DB_URL;
    ssl = false;
    break;
  case 'production':
    dbUrl = DATABASE_URL;
    ssl = { rejectUnauthorized: false };
    break;
  default:
    throw new Error('NODE_ENV is not set');
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl, charset: 'utf8' },
  logging: false,
});

if (!DB_BUILD) {
  // sync sequelize when DB_BUILD equals false
  sequelize.sync();
}

module.exports = sequelize;

```

>server\database\models\index.js

```javascript=1
const User = require('./users');

module.exports = { User };
```

>server\database\models\user.js

```javascript=1
const { DataTypes } = require('sequelize');

const sequelize = require('../config/connection');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = User;

```

>server\database\index.js

```javascript=1
const sequelize = require('./config/connection');
const { User } = require('./models');

module.exports = {
  User,
  sequelize,
};
```

### Setup The Email Transporter
In the utils folder, create email folder then create configration and create templete email.

>server\utils\email\index.js

```javascript=1
const nodemailer = require('nodemailer');

const { EMAIL_SENDER, MAIL_HOST, MAIL_USER, MAIL_PASS } = process.env;

const sendEmail = async (to, subject, html) => {
  try {
    const transport = nodemailer.createTransport({
      host: MAIL_HOST,
      port: 2525,
      // secure: true,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    await transport.sendMail({
      from: EMAIL_SENDER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
```


>server\utils\email\templates\verifyEmail.js
```javascript=1
const styles = `  <style type="text/css">
@media only screen and (min-width: 520px) {
.u-row {
width: 500px !important;
}
.u-row .u-col {
vertical-align: top;
}

.u-row .u-col-100 {
width: 500px !important;
}

}

@media (max-width: 520px) {
.u-row-container {
max-width: 100% !important;
padding-left: 0px !important;
padding-right: 0px !important;
}
.u-row .u-col {
min-width: 320px !important;
max-width: 100% !important;
display: block !important;
}
.u-row {
width: calc(100% - 40px) !important;
}
.u-col {
width: 100% !important;
}
.u-col > div {
margin: 0 auto;
}
}
body {
margin: 0;
padding: 0;
}

table,
tr,
td {
vertical-align: top;
border-collapse: collapse;
}

p {
margin: 0;
}

.ie-container table,
.mso-container table {
table-layout: fixed;
}

* {
line-height: inherit;
}

a[x-apple-data-detectors='true'] {
color: inherit !important;
text-decoration: none !important;
}

table, td { color: #000000; } a { color: #0000ee; text-decoration: underline; }
</style>
`;
const verifyEmail = (link) => {
  return `
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
    <title></title>
    
    ${styles}
    
  
  </head>
  
  <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #e7e7e7;color: #000000">
    <!--[if IE]><div class="ie-container"><![endif]-->
    <!--[if mso]><div class="mso-container"><![endif]-->
    <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #e7e7e7;width:100%" cellpadding="0" cellspacing="0">
    <tbody>
    <tr style="vertical-align: top">
      <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #e7e7e7;"><![endif]-->
      
  
  <div class="u-row-container" style="padding: 0px;background-color: transparent">
    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
      <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
        
  <!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
  <div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
    <div style="width: 100% !important;">
    <!--[if (!mso)&(!IE)]><!--><div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;"><!--<![endif]-->
    
  <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
    <tbody>
      <tr>
        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
          
    <h1 style="margin: 0px; line-height: 140%; text-align: center; word-wrap: break-word; font-weight: normal; font-family: comic sans ms,sans-serif; font-size: 23px;">
      😀 We are Happy to see you 😀
    </h1>
  
        </td>
      </tr>
    </tbody>
  </table>
  
  <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
    <tbody>
      <tr>
        <td style="overflow-wrap:break-word;word-break:break-word;padding:2px;font-family:arial,helvetica,sans-serif;" align="left">
          
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding-right: 0px;padding-left: 0px;" align="center">
        
        <img align="center" border="0" src="https://user-images.githubusercontent.com/38624002/167153626-c10c301a-fd95-4aee-b7ed-993d44f2004f.jpeg" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 266px;" width="266"/>
        
      </td>
    </tr>
  </table>
  
        </td>
      </tr>
    </tbody>
  </table>
  
  <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
    <tbody>
      <tr>
        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
          
    <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
      <tbody>
        <tr style="vertical-align: top">
          <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
            <span>&#160;</span>
          </td>
        </tr>
      </tbody>
    </table>
  
        </td>
      </tr>
    </tbody>
  </table>
  
  <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
    <tbody>
      <tr>
        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
          
  <div align="center">
    <div style="display: table;">
      <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 5px">
        <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
          <a href="https://www.facebook.com/A7medQeshta/" title="Facebook" target="_blank">
            <img src="https://user-images.githubusercontent.com/38624002/167153619-24dd5572-276b-4ea5-a9ba-ab004372bf56.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
          </a>
        </td></tr>
      </tbody></table>
    
    
      <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 5px">
        <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
          <a href="https://twitter.com/ahmedqeshta0" title="Twitter" target="_blank">
            <img src="https://user-images.githubusercontent.com/38624002/167153615-a17c1671-b9e0-4efa-8f25-d2b35e2729c4.png" alt="Twitter" title="Twitter" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
          </a>
        </td></tr>
      </tbody></table>

      <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 5px">
        <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
          <a href="https://github.com/AhmedQeshta" title="Twitter" target="_blank">
            <img src="https://user-images.githubusercontent.com/38624002/167153630-cae46bcd-7db2-434f-a625-e345e6b3df58.png" alt="GitHub" title="GitHub" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
          </a>
        </td></tr>
      </tbody></table>
    </div>
    
      
  
  <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
    <tbody>
      <tr>
        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
          
    <div style="line-height: 140%; text-align: center; word-wrap: break-word;">
      <a href="${link}">
           <button type="button" style="background: #34bbbc;
                    color: #ffffff;
                    padding: 1rem;
                    font-size: 14px;
                    line-height: 140%;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;">Verify Your Email</button>
                  </a>
                </div>
  
                </td>
              </tr>
            </tbody>
          </table>
          
        </div>
        </div>

      </div>
    </div>
  </div>
      </td>
    </tr>
    </tbody>
    </table>
  </body>
  
  </html>
  `;
};

module.exports = {
  verifyEmail,
};

```

### In Folder utils


>server\utils\jwt.js

```javascript=1
const { sign, verify } = require('jsonwebtoken');

const { JWT_SECRET } = process.env;

const OPTIONS = {
  expiresIn: '30d',
  algorithm: 'HS256',
};

module.exports = {
  generateToken: (object, options = OPTIONS) =>
    new Promise((resolve, reject) => {
      sign(object, JWT_SECRET, options, (error, payload) => {
        if (error) return reject(error);
        return resolve(payload);
      });
    }),
  checkToken: (token) =>
    new Promise((resolve, reject) => {
      verify(token, JWT_SECRET, (error, payload) => {
        if (error) return reject(error);
        return resolve(payload);
      });
    }),
};

```

>server\utils\CustomError.js

```javascript=1
module.exports = {
  CustomError: (message, status, massages) => {
    const error = new Error(message);
    error.status = status;
    error.massages = massages;
    return error;
  },
};

```


>server\utils\validation\index.js

```javascript=1
const addUserSchema = require('./addUserSchema');
const paramsValidation = require('./paramsValidation');

module.exports = {
  addUserSchema,
  paramsValidation,
};

```


>server\utils\validation\paramsValidation.js

```javascript=1
const Joi = require('joi');

const paramsValidation = Joi.object({
  id: Joi.number().integer().positive().required(),
  token: Joi.string().required(),
});

module.exports = paramsValidation;
```


>server\utils\validation\addUserSchema.js

```javascript=1
const Joi = require('joi');

const addUserSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] },
    })
    .required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,})/)
    .min(6)
    .required(),
});

module.exports = addUserSchema;

```


>server\utils\index.js

```javascript=1
const { CustomError } = require('./CustomError');
const { addUserSchema, paramsValidation } = require('./validation');
const { generateToken, checkToken } = require('./jwt');

module.exports = {
  CustomError,
  addUserSchema,
  generateToken,
  checkToken,
  paramsValidation,
};
```

## Result 

After Create new user then will sent email, `Go to Mailtrap` to test it,

![](https://i.imgur.com/zvHXKgv.png)



## Conclusion

in conclusion, as a user when registering in any way, must by default set Column 'verified' false, then after creating it in the database, the app will send an email with has verification link, this link contains the id of this user and token to check if he or not.

when clicked above this link will change the status of the user from false to true, to be verified 


#### [Source Code Github](https://github.com/AhmedQeshta/verification-email-nodejs)



###### Powered By : [ Ahmed Qeshta ](https://github.com/AhmedQeshta)
