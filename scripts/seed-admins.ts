import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;

async function seedAdmins() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const admins = [
    {
      name: "Paul",
      email: "paul@doceoconsulting.co.uk",
      password: "sPT1Y!bEcQCrc#dRw&t2",
    },
    {
      name: "Darrell",
      email: "darrell@doceoconsulting.co.uk",
      password: "7feK9LF!a@H$jCWdK2d*",
    },
  ];

  const collection = mongoose.connection.db!.collection("admins");

  for (const admin of admins) {
    const existing = await collection.findOne({ email: admin.email.toLowerCase() });
    if (existing) {
      console.log(`Admin already exists: ${admin.email} — skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);
    await collection.insertOne({
      name: admin.name,
      email: admin.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Admin created: ${admin.email}`);
  }

  console.log("Done!");
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmins().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
