import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = (email: string, template: string, data: any) => {
    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: data.subject,
        templateId: template,
        dynamic_template_data: data
    };
// ES6
    sgMail
        .send(msg)
        // tslint:disable-next-line:no-empty
        .then((s) => {

        }, error => {
            throw new Error (error.message);
        });
};
