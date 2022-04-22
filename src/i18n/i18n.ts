import I18n from "i18n";
import path from "path";

const i18nTs = async (ctx, next) => {
  I18n.configure({
    locales: ["en"],
    defaultLocale: "en",
    queryParameter: "lang",
    directory: path.join(__dirname, "/"),
  });
  I18n.init(ctx.request, ctx.response);
  ctx.__ = I18n.__;
  return next();
};

export default i18nTs;
