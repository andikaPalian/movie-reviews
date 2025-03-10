import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.DB_URL);
        console.log(`Database connected: ${connect.connection.host} ${connect.connection.name}`);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}

export default connectDB;