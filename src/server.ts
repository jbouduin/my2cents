import app from './app';

app.initialize()
  .then(initialized => initialized.start())
  .catch(err => {
    console.error(err);
    process.exit(1);
  } );
