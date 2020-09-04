const sendGrid = require('@sendgrid/mail');

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

sendGrid.send({
    from: 'gamidikarthik@gmail.com',
    to: 'gamidikarthik@gmail.com',
    subject: "Test email",
    text: "This is the first email"
})