const { MongoClient } = require("mongodb");
require("dotenv").config();

const run = async () => {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    const duplicateEmails = await users.aggregate([
      { $match: { email: { $type: "string" } } },
      { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 1 },
    ]).hasNext();

    if (duplicateEmails) {
      throw new Error("Duplicate user emails found. Resolve duplicates before running the auth migration.");
    }

    await users.updateMany(
      { role: { $exists: false } },
      { $set: { role: "subscriber" } }
    );
    await users.updateMany(
      { cart: { $exists: false } },
      { $set: { cart: [] } }
    );
    await users.updateMany(
      { wishlist: { $exists: false } },
      { $set: { wishlist: [] } }
    );

    const emailIndex = (await users.indexes()).find(
      (index) => index.key?.email === 1
    );
    if (emailIndex && !emailIndex.unique) {
      await users.dropIndex(emailIndex.name);
    }
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ username: 1 }, { unique: true, sparse: true });

    await Promise.all([
      db.collection("accounts").createIndex(
        { provider: 1, providerAccountId: 1 },
        { unique: true }
      ),
      db.collection("accounts").createIndex({ userId: 1 }),
      db.collection("sessions").createIndex(
        { sessionToken: 1 },
        { unique: true }
      ),
      db.collection("sessions").createIndex(
        { expires: 1 },
        { expireAfterSeconds: 0 }
      ),
      db.collection("verification_tokens").createIndex(
        { identifier: 1, token: 1 },
        { unique: true }
      ),
      db.collection("verification_tokens").createIndex(
        { expires: 1 },
        { expireAfterSeconds: 0 }
      ),
      db.collection("email_verification_tokens").createIndex(
        { token: 1 },
        { unique: true }
      ),
      db.collection("email_verification_tokens").createIndex(
        { expires: 1 },
        { expireAfterSeconds: 0 }
      ),
    ]);

    console.log("Auth.js MongoDB migration completed.");
  } finally {
    await client.close();
  }
};

run().catch((error) => {
  console.error("Auth migration failed:", error.message);
  process.exit(1);
});
