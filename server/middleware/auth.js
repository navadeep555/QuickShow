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

    console.log("PUBLIC METADATA:", user.publicMetadata);
    console.log("PRIVATE METADATA:", user.privateMetadata);

    // Check both publicMetadata and privateMetadata for role
    const role = user.publicMetadata?.role || user.privateMetadata?.role;

    if (role !== "admin") {
      console.log("ROLE FOUND:", role);
      return res.status(403).json({
        success: false,
        message: "not authorized - not admin"
      });
    }

    console.log("ADMIN VERIFIED ✅");
    next();
  } catch (error) {
    console.log("ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "not authorized"
    });
  }
};
