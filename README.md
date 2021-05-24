# Talaria

[Online Demo Page](https://rtc.talaria.solutions/demo/)

[Documentation](https://github.com/seeyoulink/sylrtc-demo/wiki/Basic-concepts-explained)

[Website](https://talaria.solutions/)

<br>

Talaria enables you to easily add collaboration and real-time communication features into your website, web application, or mobile app with a few lines of code in no-time.

It consists of audio/video calling, ephemeral chat, screen sharing, and multipoint conferencing with up to four participants. Users outside of your workgroup or organization can be added with one-time access to the current meeting (no account creation or download).

Talaria works in any modern browser on any desktop or mobile device (iOS, Android, Windows, Mac, Linux). We provide a safe, secure, and private (peer-to-peer, end-to-end encrypted, HIPAA, and GDPR compliant) environment.  It can be easily branded and customized to match your product look and feel.

Talaria is based on open standard [WebRTC](https://webrtc.org) technology and [Open EasyRTC](https://github.com/open-easyrtc/open-easyrtc). Our goal is to enable startups and other businesses to add real-time collaboration features to existing web and mobile apps in one day.

To get started with Talaria, contact us via the form on [our website](https://talaria.solutions) or by sending an email to info@talaria.solutions so that we can provide you with credentials for your organization.

<br>

### Browser support

|              | Chrome | Edge (Chromium) | Firefox | Safari |
|--------------|:------:|:---------------:|:-------:|:------:|
| **Android**  | ✓      | -               | -       | -      |
| **iOS**      | -      | -               | -       | ✓      |
| **Linux**    | ✓      | -               | ✓       | -      |
| **macOS**    | ✓      | ✓               | ✓       | ✓      |
| **Windows**  | ✓      | ✓               | ✓       | -      |

Important notice: Only Chromium based Edge browsers are supported. Screen sharing only works in desktop browsers (Windows, Linux, macOS).

<br>

## Quick start guide
1. Load the client library (doesn’t have to be loaded in head).
```html
<script src="https://cdn.talaria.solutions/client/v1/sylrtc-client.js"></script>
```

<br>


2. When the document is ready, configure client, set presence listener and connect to SeeYouLink RTC signaling server.

```javascript
// configure sylrtc_client, only required options set
sylrtc.init({  
   user: {
     // required, user id in your application, or any other unique id
    id: '0001', // integer or string
    // required, full user name
    full_name: 'Jon Doe'
  },
  // please enter your given id and token
  credentials: {
    client_id: 'acme',
    client_token: '01234567890' // alternatively, auth_token can be use
  }
});

// connect to rtc server
sylrtc.connect();
```

<br>

3. Setting up click-to-call handlers
``` html
<div data-username="rs-1234-Jim Doe" class="contact">Call Jim Doe</div>
<div data-username="rs-5678-Jane Doe" class="contact">Call Jane Doe</div>
```
``` javascript
$('.contact).on('click', () => {
  const username = $(this).attr('data-username');
  sylrtc.performCall(username);
});
```

<br>

4. Handle user online status
``` html
<div data-username="rs-1234-Jim Doe" class="contact online">Call Jim Doe</div>
<div data-username="rs-5678-Jane Doe" class="contact">Call Jane Doe</div>
```

``` javascript
sylrtc.on('onlinepresencechanged', (onlineUsers) => {
  // onlineUsers is an array of users that are currently online, e.g.
  // [{
  //   username: 'rs-1234-John Doe', 
  //   id: '1234',
  //   full_name: 'John Doe',
  //   avatar: '/_UserUploads/ProfileImg/1234'
  // }]
  
  $('.contact').each((i, contact) => {
    const online = $.grep(onlineUsers, (user) => {
      return user.username == $(contact).attr('data-username');
    })[0];

    $(contact).toggleClass('online', online);
  });  
});
```



