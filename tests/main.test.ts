import { drop } from "@mswjs/data";
import { db } from "./__mocks__/db";
import { server } from "./__mocks__/node";
import usersGet from "./__mocks__/users-get.json";
import { expect, describe, beforeAll, beforeEach, afterAll, afterEach, it } from "@jest/globals";
import manifest from "../manifest.json";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("User tests", () => {
  beforeEach(() => {
    drop(db);
    for (const item of usersGet) {
      db.users.create(item);
    }
  });

  it("Should fetch all the users", async () => {
    const res = await fetch("https://api.ubiquity.com/users");
    const data = await res.json();
    expect(data).toMatchObject(usersGet);
  });

  it("Should serve the manifest file", async () => {
    const worker = (await import("../src/worker")).default;
    const response = await worker.fetch(new Request("http://localhost/manifest.json"), { SUPABASE_KEY: "", SUPABASE_URL: "" });
    const content = await response.json();
    expect(content).toEqual(manifest);
  });
});
