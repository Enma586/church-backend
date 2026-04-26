/**
 * @file tests/setup.js
 * @description Global test setup and teardown hooks.
 * Utilizes MongoMemoryServer to spin up an isolated MongoDB instance in RAM.
 * Ensures the actual development/production database is never touched during testing.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongoServer;

/**
 * @hook beforeAll
 * @description Runs once before all test suites. Starts the in-memory database
 * and establishes a Mongoose connection to its temporary URI.
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

/**
 * @hook afterEach
 * @description Runs after every single test case ('it' block).
 * Iterates through all Mongoose collections and deletes their documents.
 * This guarantees a pristine, empty database state for the next test.
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

/**
 * @hook afterAll
 * @description Runs once after all test suites have finished executing.
 * Drops the temporary database, closes the Mongoose connection, and shuts down the server.
 */
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});