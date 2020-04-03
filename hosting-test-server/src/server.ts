import app from './app';

app.initialize()
  .then(initialized => initialized.start())
  .catch(err => {
    console.log(err);
    process.exit(1);
  } );
