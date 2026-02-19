import { Webhook } from "svix";
import { inngest } from "../inngest/index.js";

export const clerkWebhooks = async (req, res) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
        }

        // Get the headers and body
        const headers = req.headers;
        const payload = req.body;

        // Get the Svix headers for verification
        const svix_id = headers["svix-id"];
        const svix_timestamp = headers["svix-timestamp"];
        const svix_signature = headers["svix-signature"];

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return res.status(400).json({
                success: false,
                message: "Error occured -- no svix headers",
            });
        }

        // Create a new Svix instance with your secret.
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt;

        // Attempt to verify the incoming webhook
        // If successful, the payload will be available from 'evt'
        // If the verification fails, error out and return a 400
        try {
            evt = wh.verify(JSON.stringify(payload), {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (err) {
            console.log("Error verifying webhook:", err.message);
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }

        // Do something with the payload
        // For this guide, you simply log the payload to the console
        const { id } = evt.data;
        const eventType = evt.type;
        console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
        // console.log("Webhook body:", body);

        switch (eventType) {
            case 'user.created':
                await inngest.send({
                    name: 'clerk/user.created',
                    data: evt.data
                })
                break;
            case 'user.updated':
                await inngest.send({
                    name: 'clerk/user.updated',
                    data: evt.data
                })
                break;
            case 'user.deleted':
                await inngest.send({
                    name: 'clerk/user.deleted',
                    data: evt.data
                })
                break;

            default:
                break;
        }

        res.status(200).json({
            success: true,
            message: "Webhook received",
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
