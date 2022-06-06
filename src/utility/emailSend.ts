import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (email: string, template: string, data: any) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: data.subject,
    templateId: template,
    dynamic_template_data: data,
  };
  await sgMail.send(msg).then(
    (s) => {},
    (error) => {
      throw new Error(error.message);
    }
  );
};
