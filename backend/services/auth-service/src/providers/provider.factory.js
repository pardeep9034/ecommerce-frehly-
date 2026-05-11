import TwilioProvider from "./twilio.provider.js";

export const GetProvider=(name)=>{
    switch(name){
        case "SMS":
            return new TwilioProvider();
        default:
            throw new Error("Invalid provider name");
    }
}


