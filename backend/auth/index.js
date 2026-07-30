let authModulePromise;
let expressAuthPromise;

const loadAuth = () => {
  authModulePromise ||= import("./config.mjs");
  return authModulePromise;
};

const loadExpressAuth = () => {
  expressAuthPromise ||= import("@auth/express");
  return expressAuthPromise;
};

exports.getAuthHandler = async () => {
  const { authHandler } = await loadAuth();
  return authHandler;
};

exports.getAuthSession = async (req) => {
  const [{ authConfig }, { getSession }] = await Promise.all([
    loadAuth(),
    loadExpressAuth(),
  ]);
  return getSession(req, authConfig);
};
