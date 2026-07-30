import { ExpressAuth } from "@auth/express";
import Credentials from "@auth/express/providers/credentials";
import Facebook from "@auth/express/providers/facebook";
import GitHub from "@auth/express/providers/github";
import Google from "@auth/express/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient, ObjectId } from "mongodb";
import passwordTools from "./password.js";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const mongoClient = new MongoClient(required("MONGO_URI"));
const oauthProvider = (factory, idName, secretName) => {
  const clientId = process.env[idName]?.trim();
  const clientSecret = process.env[secretName]?.trim();
  return clientId && clientSecret ? factory({ clientId, clientSecret }) : null;
};

const credentialsProvider = Credentials({
  name: "Username or email",
  credentials: {
    identifier: { label: "Username or email", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const identifier = String(credentials.identifier || "").trim().toLowerCase();
    const password = String(credentials.password || "");
    if (!identifier || !password) return null;

    const user = await mongoClient.db().collection("users").findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user?.emailVerified) return null;

    const valid = await passwordTools.verifyPassword(
      password,
      user.passwordSalt,
      user.passwordHash
    );
    if (!valid) return null;

    return {
      id: user._id.toHexString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "subscriber",
    };
  },
});

export const authConfig = {
  adapter: MongoDBAdapter(mongoClient),
  providers: [
    credentialsProvider,
    oauthProvider(Google, "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"),
    oauthProvider(Facebook, "AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET"),
    oauthProvider(GitHub, "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"),
  ].filter(Boolean),
  secret: required("AUTH_SECRET"),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const clientOrigin = new URL(required("CLIENT_URL")).origin;
      const destination = new URL(url, baseUrl);
      return destination.origin === clientOrigin ? destination.toString() : baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "subscriber";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id || token.sub;
      session.user.role = token.role || "subscriber";
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await mongoClient.db().collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { role: "subscriber", cart: [], wishlist: [] } }
      );
    },
  },
};

export const authHandler = ExpressAuth(authConfig);
