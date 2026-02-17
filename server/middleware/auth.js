import { clerkClient, getAuth } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    console.log("USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "not authorized - no user"
      });
    }

    const user = await clerkClient.users.getUser(userId);



    // Check publicMetadata, privateMetadata, and unsafeMetadata for role
    const role = user.publicMetadata?.role ||
      user.privateMetadata?.role ||
      user.unsafeMetadata?.role;

    // Check if user has the admin email (fallback)
    const adminEmail = process.env.ADMIN_EMAIL;
    const isEmailAdmin = adminEmail && user.emailAddresses.some(e => e.emailAddress === adminEmail);

    if (role !== "admin" && !isEmailAdmin) {
      console.log("❌ AUTHORIZATION FAILED");
      console.log("Role found:", role);
      console.log("Is Email Admin:", isEmailAdmin);

      return res.status(403).json({
        success: false,
        message: "not authorized - not admin"
      });
    }


    next();
  } catch (error) {
    console.log("ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "not authorized"
    });
  }
};
