export default {
  get PORT() {
    return process.env.PORT;
  },
  get STRIPE_PUBLISHABLE_KEY() {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  },
  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get DB_PATH() {
    return process.env.DB_PATH;
  },
  get SENDGRID_API_KEY() {
    return process.env.SENDGRID_API_KEY;
  },
  get SENDGRID_FROM_EMAIL() {
    return process.env.SENDGRID_FROM_EMAIL;
  },
};
