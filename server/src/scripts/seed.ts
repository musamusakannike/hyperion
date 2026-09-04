import { connectDB } from "../config/db.config";
import { env } from "../config/env.config";
import { User } from "../models/user.model";
import { hashSecret, randomToken } from "../utils/crypto";

const seed = async (): Promise<void> => {
  await connectDB();

  const admin = await User.findOne({ email: env.seedAdminEmail.toLowerCase() });
  if (!admin) {
    await User.create({
      role: "admin",
      email: env.seedAdminEmail,
      passwordHash: await hashSecret(env.seedAdminPassword),
      fullName: env.seedAdminName,
    });
    console.info(`Seeded admin ${env.seedAdminEmail}`);
  } else {
    console.info("Admin already exists");
  }

  const driverEmail = "driver@hyperion.swep";
  if (!(await User.findOne({ email: driverEmail }))) {
    await User.create({
      role: "driver",
      email: driverEmail,
      passwordHash: await hashSecret("DriverPass1!"),
      fullName: "Demo Driver",
    });
    console.info(`Seeded driver ${driverEmail} / DriverPass1!`);
  }

  const studentEmail = "student@hyperion.swep";
  if (!(await User.findOne({ email: studentEmail }))) {
    await User.create({
      role: "student",
      email: studentEmail,
      passwordHash: await hashSecret("StudentPass1!"),
      fullName: "Demo Student",
      matricNumber: "20/52HA001",
      pinHash: await hashSecret("1234"),
      qrToken: randomToken(),
      ridePoints: 5,
      leftoverKobo: 0,
    });
    console.info(`Seeded student ${studentEmail} / StudentPass1! PIN 1234 with 5 points`);
  }

  process.exit(0);
};

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
