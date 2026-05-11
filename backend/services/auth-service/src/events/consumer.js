import KafkaManager from "../config/kafka.js";
import { sendOtp } from "../modules/sms/sms.service.js";
import { TOPICS } from "./topics.js";

export const startOtpConsumer = async () => {
    const consumer = await KafkaManager.connectConsumer();
    await consumer.subscribe({ topic: TOPICS.OTP_REQUESTED, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const data = JSON.parse(message.value.toString());
                await sendOtp(data.payload);
            } catch (error) {
                console.error("Failed to send OTP:", error);
            }
        },
    });
};

