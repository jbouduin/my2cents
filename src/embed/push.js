const $ = sel => document.querySelector(sel);

export default class Push {
  constructor() {
    var script = $('script[data-m2c-target]');
    const url = new URL(document.URL);
    this.my2cents_host = `${url.protocol}//${url.host}/${script.dataset.m2cRoot}`;
    this.serviceWorkerName = `${url.protocol}//${url.host}/sw.js`;
    this.target = script.dataset.m2cTarget;
    this.appSrvPK = '';
    this.swRegistration = null;
    this.muteBtn = $(this.target + ' .m2c-mute');
    this.unmuteBtn = $(this.target + ' .m2c-unmute');
  }

  initialize() {

    if (this.muteBtn) {
      this.initializeServiceWorker();

      const caller = this;

      this.unmuteBtn.addEventListener('click', () => {
        if (Notification.permission !== "granted") {
          // this is the first time
          Notification.requestPermission().then(function(status) {
            if (status === 'granted') {
              caller.subscribe();
            }
          });
        } else {
          this.subscribe();
        }
      });

      this.muteBtn.addEventListener('click', () => {
        caller.unsubscribe();
      });
    }
  }

  // hide and unhide the buttons depending on the subscription status
  setSubscription (subscribed) {
    this.muteBtn.style.display = subscribed ? 'block' : 'none';
    this.unmuteBtn.style.display = subscribed ? 'none' : 'block';
  }

  initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      // get the VAPID key from the server
      fetch(
        this.my2cents_host + '/vapidData',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      .then(res => { return res.json(); })
      .then((data) => {
        this.appSrvPK = data.key;
        navigator.serviceWorker
          .register(this.serviceWorkerName)
          .then(reg => this.handleSWRegistration(this, reg))
          .catch(err => console.error(err));
      });
    } else {
      console.error("Service workers aren't supported in this browser.");
    }
  }

  handleSWRegistration(caller, reg) {
    caller.swRegistration = reg;
    caller.initialiseState(reg);
  }

  // Once the service worker is registered set the initial state
  initialiseState(reg) {
    // Are Notifications supported in the service worker?
    if (!reg.showNotification) {
      console.error("Notifications aren't supported on service workers.");
      return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.error("Push messaging isn't supported.");
      return;
    }

    const caller = this;
    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function(reg) {
      // Do we already have a push message subscription?
      reg.pushManager
        .getSubscription()
        .then(subscription => {
          if (!subscription) {
            caller.setSubscription(false);
          } else {
            // initialize status, which includes setting UI elements for subscribed status
            // and updating Subscribers list via push
            caller.setSubscription(true);
          }
        })
        .catch(err => {
          console.error('Error during getSubscription()', err);
        });
    });
  }

  subscribe() {
    const caller = this;
    navigator.serviceWorker.ready.then(function(reg) {
      const subscribeParams = { userVisibleOnly: true };
      // Setting the public key of our VAPID key pair.
      const applicationServerKey = caller.urlB64ToUint8Array(caller.appSrvPK);
      subscribeParams.applicationServerKey = applicationServerKey;
      reg.pushManager
        .subscribe(subscribeParams)
        .then(subscription => {
          // Update status to subscribe current user on server, and to let
          // other users know this user has subscribed
          const endpoint = subscription.endpoint;
          const key = subscription.getKey('p256dh');
          const auth = subscription.getKey('auth');
          caller.sendSubscriptionToServer(endpoint, key, auth);
          caller.setSubscription(true);
        })
        .catch(err => {
          // A problem occurred with the subscription.
          console.error('Unable to subscribe to push.', err);
        });
    });
  }

  unsubscribe() {
    let endpoint = null;
    const caller = this;
    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager
        .getSubscription()
        .then(subscription => {
          if (subscription) {
            endpoint = subscription.endpoint;
            return subscription.unsubscribe();
          } else {
            throw('no subscription found');
          }
        })
        .catch(error => {
          console.error('Error unsubscribing', error);
        })
        .then(() => {
          caller.removeSubscriptionFromServer(endpoint);
          caller.setSubscription(false);
        });
      });
  }

  sendSubscriptionToServer(endpoint, key, auth) {
    const encodedAuth = btoa(String.fromCharCode.apply(null, new Uint8Array(auth)));
    const encodedKey = btoa(String.fromCharCode.apply(null, new Uint8Array(key)));

    fetch(this.my2cents_host + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: encodedKey, auth: encodedAuth, endpoint })
    })
    .then(res => {
      console.info('Subscribed successfully! ' + JSON.stringify(res));
    });
  }

  removeSubscriptionFromServer(endpoint) {
    fetch(this.my2cents_host + '/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    })
    .then(res => {
      console.info('Unsubscribed successfully! ' + JSON.stringify(res));
    });
  }

  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
