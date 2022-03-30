const i18n = require("i18n");
const path = require("path");

i18n.configure({
  locales: ["en"],
  directory: path.join(__dirname, ""),
  defaultLocale: "en",
  cookie: "lang",
});

// module.exports = i18n;

module.exports = async (ctx, next) => {
  i18n.init(ctx.request, ctx.response);
  ctx.__ = i18n.__;
  return next();
};
