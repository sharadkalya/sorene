import mongoose from 'mongoose';
import { getMongoUri } from '@/common/env';

/**
 * Shared Mongoose connection manager.
 *
 * A single connection (and its in-flight promise) is cached on `globalThis` so
 * that concurrent requests, Next.js dev hot reloads, and serverless warm
 * instances reuse the same pool instead of opening one per request.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var sorveneMongoose: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.sorveneMongoose ?? { conn: null, promise: null };

if (globalThis.sorveneMongoose === undefined) {
  globalThis.sorveneMongoose = cache;
}

export async function getMongoConnection(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(getMongoUri(), {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        maxPoolSize: 10,
      })
      .then((instance) => instance);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Clear the rejected promise so a later request can retry cleanly.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
