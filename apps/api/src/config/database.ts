import mongoose from "mongoose";

export async function connectDatabase(uri: string) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5_000,
    autoIndex: false,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
