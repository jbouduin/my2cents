### Configuring the My2Cents Server

The configuration of a *My2Cents* server instance is stored in a set of json files. You can have multiple sets of them.

At runtime the server will load the files from the directory with the same name as the **NODE_ENV** variable and overwrite any default value. If **NODE_ENV** is not set, or no corresponding directory is found, the server will try to load from the development directory. If that one is not available neither, the server will shut down.

When installing, a configuration directory named *development* and one named *production* are available.

#### Using environment variables in the configuration files
If you do not want to save sensitive information in the configuration files, or if you want to be able to change settings without having to redeploy, there is the possibility to use environment variables in the configuration files:

``` json
{
  "hostname": "${process.env.HOST_NAME || 'localhost'}"
}  
````
At runtime, when reading this setting, *My2Cents* will first evaluate the environment variable **HOST_NAME**. If that one is not set, it will use **localhost** as value. The Production configuration files do come with environment variables out of the box. But you can change them as desired.

**Remarks:**
- The default values described below, are the default values set in the code, before the configuration files are loaded and -eventually- override them.
- If the parameter is marked as *mandatory*, it means that the value **must** be set in the configuration files.

### application.json
this file is cross-environment.

| Key        | Mandatory | Default Value | Description |
| ---------- | :-------: | ------------- | ----------- |
| dateFormat |           | *undefined*   | Dates are formatted using [*moment*](https://momentjs.com/). If this value is empty or undefined, dates are formatted using the .fromNow() method, otherwise the setting is used as input parameter for .format().  |
| secret     |    [x]    | *undefined*   | The application secret, which is used for [*express-session*](https://github.com/expressjs/session), You can enter whatever you want here |

**Sample application.json**

``` json
{
  "dateFormat": "",
  "secret": "ld!np%Y1&H,CXFs#vVrTF/5MKZXzq-<W"
}
```

### authentication.json
The authentication configuration file contains the settings for [*passport*](http://www.passportjs.org/) and the authentication providers implemented in *My2Cents*.

| Key            | Mandatory | Default Value | Description |
| -------------- | :-------: | ------------- | ----------- |
| allowAnonymous |           | *false*       | allows writing comments anonymously. |
| allowLocal     |           | *false*       | use [*passport-local*](https://github.com/jaredhanson/passport-local#readme), allowing for a simple user/password authentication. |
| providers      |           | *empty array* | an array of authentication providers configurations|

About the [*passport-local*](https://github.com/jaredhanson/passport-local#readme) implementation in *My2Cents*:
 **The implementation is not suitable for production environments!** *passport-local* is **NOT** to blame. It is because the implementation in *My2Cents* is unsafe and unsecure, as it was implemented for testing purposes only. For that reason, this form of authorization is only activated when **NODE_ENV** is set to "Development".

#### Authentication configuration
| Key    | Mandatory | Default Value | Description |
| ------ | :-------: | ------------- | ----------- |
| name   |    [x]    | *undefined*   | One of the implemented OAuth Providers |
| id     |    [x]    | *undefined*   | See provider specific details below |
| secret |    [x]    | *undefined*   | See provider specific details below |

All fields of any authentication provider are mandatory. If the *id* or *secret* property are not set, the provider is skipped during server initialization. If the *name* (case sensitive!) is an not implemented provider, the entry will not be processed at all.

#### Authentication Provider Twitter (OAuth 1.0a)
Library used: [*passport-twitter*](https://github.com/jaredhanson/passport-twitter#readme).

| Key    | Description        |
| ------ | ------------------ |
| name   | Value: *'Twitter'* |
| id     |                    |
| secret |                    |

#### Authentication Provider GitHub (OAuth 2.0)
Library used: [*passport-github*](https://github.com/jaredhanson/passport-github#readme).

| Key    | Description |
| ------ | ------------------ |
| name   | Value: *'GitHub'*  |
| id     |                    |
| secret |                    |

#### Authentication Provider Google (OpenID 2.0)
Library used: [*passport-google*](https://github.com/jaredhanson/passport-google#readme).

| Key    | Description        |
| ------ | ------------------ |
| name   | Value: *'Google'*  |
| id     |                    |
| secret |                    |

#### Authentication Provider Facebook (OAuth 2.0)
Library used: [*passport-facebook*](https://github.com/jaredhanson/passport-facebook#readme).

| Key    | Description          |
| ------ | -------------------- |
| name   | Value: *'Facebook'*  |
| id     |                      |
| secret |                      |

#### Authentication Provider LinkedIn (OAuth 1.0a)
Library used: [*passport-linkedin*](https://github.com/jaredhanson/passport-linkedin#readme).

| Key    | Description         |
| ------ | ------------------- |
| name   | Value: *'LinkedIn'* |
| id     |                     |
| secret |                     |

#### Authentication Provider Instagram (OAuth 2.0)
Library used: [*passport-instagram*](https://github.com/jaredhanson/passport-instagram#readme).

| Key    | Description          |
| ------ | -------------------- |
| name   | Value: *'Instagram'* |
| id     |                      |
| secret |                      |

**Sample authentication.json with all providers**
``` json
{
  "allowAnonymous": true,
  "allowLocal": true,
  "providers": [
    {
      "name": "Twitter",
      "id": "xxx",
      "secret": "xxx"
    },
    {
      "name": "GitHub",
      "id": "xxx",
      "secret": "xxx"
    },
    {
      "name": "Google",
      "id": "xxx",
      "secret": "xxx"
    },
    {
      "name": "Facebook",
      "id": "xxx",
      "secret": "xxx"
    },
    {
      "name": "LinkedIn",
      "id": "xxx",
      "secret": "xxx"
    },
    {
      "name": "Instagram",
      "id": "xxx",
      "secret": "xxx"
    }
  ]
}
```

### database.json

To work with databases, *My2Cents* uses the [*typeorm*](http://typeorm.io/) library.
For specific connection types, different libraries are used:
- sqlite: [*sqlite3*](https://github.com/mapbox/node-sqlite3)
- MySql:
- Postgres:


| Key         | Mandatory | Default Value | Description |
| ----------- | :-------: | ------------- | ----------- |
| targets     |    [x]    | *undefined*   | An array of target configurations. |
| connections |    [x]    | *undefined*   | An array of database physical database connections.|

 *My2Cents* is capable of using two different physical databases. You need to define two targets: on for *comments* and one for *sessions*. Consider them as virtual database definitions, that map to a physical connection. The *comments* target contains the real application data. The *sessions* target contains only the session data. You can save all in one single database also by targetting the same connection twice.

#### Target
| Key            | Mandatory | Default Value | Description |
| -------------- | :-------: | ------------- | ----------- |
| connectionName |    [x]    | *undefined*   | The name of the connection to be used for this target. |
| target         |    [x]    | *undefined*   | Value: [*'sessions'* \| *'comments'*] |

#### Connection

| Key            | Mandatory |  Description |
| -------------- | :-------: |  ----------- |
| connectionName |    [x]    | The name used to map the connection to a target. |
| databaseName   |    [x]    |              |
| connectionType |    [x]    | Value: [*'mysql'* \| *'postgres'* \| *'sqlite'* |
| hostName       |           |              |
| port           |           |              |
| user           |           |              |
| password       |           |              |

**Sample database.json**
``` json
{
  "targets": [
    {
      "connectionName": "comments",
      "targetType": "comments"
    }, {
      "connectionName": "sessions",
      "targetType": "sessions"
    }
  ],
  "connections": [
    {
      "connectionName": "sessions",
      "databaseName": "sessions.sqlite",
      "connectionType": "sqlite",
    }, {
      "connectionName": "comments",
      "databaseName": "${process.env._COMMENTSDB_NAME || 'comments' }",
      "connectionType": "${process.env.COMMENTSDB_TYPE || 'mysql' }",
      "hostName": "${process.env.COMMENTSDB_HOST || 'localhost' }",
      "port": "${process.env.COMMENTSDB_PORT || 3306 }",
      "user": "${process.env.COMMENTSDB_USR || '' }",
      "password": "${process.env.COMMENTSDB_PWD || '' }"
    }
  ]
}
```
### mail.json

| Key          | Mandatory | Default Value | Description |
| ------------ | :-------: | ------------- | ----------- |
| from         |    [x]    | *undefined*   |             |
| to           |    [x]    | *undefined*   |             |
| mailProtocol |    [x]    | *'nomail'*    | Value: [ *'nomail'* \| *'smpt'* \| *'sendMail'* ] |
| sendmail     |           |               | a sendmail configuration |
| smtp         |           |               | an SMTP configuration |

#### SMTP configuration

*My2Cents* uses [*nodemailer*](https://nodemailer.com/about/) when sending mails over SMTP.

| Key      | Mandatory | Default Value | Description |
| -------- | :-------: | ------------- | ----------- |
| host     |    [x]    |               |             |
| password |    [x]    |               |             |
| port     |           | 465           |             |
| secure   |           | true          |             |
| user     |    [x]    |               |             |

#### Sendmail configuration

| Key    | Mandatory | Default Value |Description |
| ------ | :-------: | ------------- | ----------- |
| path   |           | *'/usr/sbin/sendmail'* | The path to the sendmail executable. |

**Sample mail.json when no mail is send**
``` json
{
  "mailProtocol": "nomail"
}
```

**Sample mail.json using SMTP to send mail**
``` json
{
  "from": "system@my2cents.com",
  "to": "admin@my2cents.com",
  "mailProtocol": "smtp",
  "smtp": {
    "host":  "smtp.example.com",
    "password": "password",    
    "user": "user"
  }
}
```

**Sample mail.json using sendMail to send mail**
``` json
{
  "from": "system@my2cents.com",
  "to": "admin@my2cents.com",
  "mailProtocol": "sendMail",
  "sendMail": {
    "path": "/usr/sbin/sendmail"
  }
}
```
### notification.jason

| Key      | Mandatory | Default Value |Description |
| -------- | :-------: | ------------- | ----------- |
| interval |           | 60000         | The interval in milliseconds between sending out notifications |
| pushover |           | *undefined*   | a pushover configuration |
| webpush  |           | *undefined*   | a webpush configuration |
| slack    |           | *undefined*   | a slack configuration |

#### *pushover* configuration
| Key      | Mandatory | Default Value |Description |
| -------- | :-------: | ------------- | ----------- |
| appToken |    [x]    | | |
| userKey  |    [x]    | | |

#### *webPush* configuration

to use webpush: generate keys by running npx web-push generate-vapid-keys and enter them in the configuration file or pass them as environment variable to your server

| Key        | Mandatory | Default Value |Description |
| ---------- | :-------: |----------- | ----------- |
| publicKey  |    [x]    | | |
| privateKey |    [x]    | | |

#### *slack* configuration
| Key        | Mandatory | Default Value |Description |
| ---------- | :-------: |----------- | ----------- |
| webHookUrl |    [x]    | | |

### server.json

*My2Cents* is serving content using [*expressjs*](http://expressjs.com/)

| Key            | Mandatory | Default Value | Description |
| -------------- | :-------: |-------------- | ----------- |
| hostname       |    [x]    | *undefined*   | The hostname of your website. Used when building the URL of the embedding page and callback URL's for the authentication providers.. |
| pageSuffix     |           | *undefined*   | Suffix to be appended to the SLUG when building the URL of the embedding page. |
| pathToMy2Cents |           | *'/my2cents'* | Used when building callback URL's for the authentication providers and callback URL's for the authentication providers. |
| my2CentsPort   |           | 3000          | The port number the express-server will listen to. |
| pathToPage     |           | *'/'*         | The path to the pages on your webserver. Used when building the URL of the embedding page. |
| port           |           | *undefined*   | The port your website server is listening to. Used when building the URL of the embedding page and callback URL's for the authentication providers.|
| protocol       |           | *'https'*     | The protocol your website is using.  Used when building the URL of the embedding page and callback URL's for the authentication providers..|
| serveStatic    |    [x]    | *undefined*   | an array of directory names that will be used to serve static *My2Cents* content. |

**sample server.json**
``` json
{
  "hostname": "www.somehost.com",
  "my2CentsPort": "3000",
  "pageSuffix": "html",
  "pathToMy2Cents": "/my2cents",
  "pathToPage": "/blog",  
  "protocol": "https",
  "serveStatic": ["build"]
}
```
These settings are valid, if you embedded *My2Cents* on pages with following URL:

https://www.somehost.com/blog/%slug%.html

**Notify Providers:**

* pushover
* webpush
* slack
* rss
* sendmail


**caveat:** in order to get the correct URL in webpush messages, the SLUG of the page must be the page name
---
[Table of Contents](/docs/documentation.md)
