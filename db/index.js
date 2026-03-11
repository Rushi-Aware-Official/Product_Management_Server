import mongoose from "mongoose";

export const connectDB = () => {
    return mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log("Database Connected Successfully");
    }).catch((err) => {
        console.log(err);
        throw err
    })
}