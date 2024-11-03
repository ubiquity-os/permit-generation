import { describe, expect, it } from "@jest/globals";
import { getPublicKey, decrypt, parseDecryptedPrivateKey } from "../../src/utils";

// dummy value for testing purposes
const X25519_PRIVATE_KEY = "wrQ9wTI1bwdAHbxk2dfsvoK1yRwDc0CEenmMXFvGYgY";

describe("keys", () => {
  describe("decrypt()", () => {
    it("Should decrypt encrypted text", async () => {
      // encrypted "test"
      const encryptedText = "RZcKYqzwb6zeRHCJcV5QxGKrNPEll-xyRW_bNNa2rw3bddnjX2Kd-ycPvGq1NocSAHJR2w";
      const decryptedText = await decrypt(encryptedText, X25519_PRIVATE_KEY);
      expect(decryptedText.privateKey).toEqual("test");
    });
  });

  describe("getPublicKey()", () => {
    it("Should return public key from private key", async () => {
      const publicKey = await getPublicKey(X25519_PRIVATE_KEY);
      expect(publicKey).toEqual("iHYr7Zy077eoAvunTB_-DQIq5Nz73H_nIYaS_buiQjo");
    });
  });

  describe("parseDecryptedPrivateKey()", () => {
    it("Should return parsed private key for format PRIVATE_KEY", async () => {
      // encrypted "test"
      const encryptedText = "RZcKYqzwb6zeRHCJcV5QxGKrNPEll-xyRW_bNNa2rw3bddnjX2Kd-ycPvGq1NocSAHJR2w";
      const decryptedText = await decrypt(encryptedText, X25519_PRIVATE_KEY);
      const parsedPrivateKey = parseDecryptedPrivateKey(decryptedText.privateKey);
      expect(parsedPrivateKey).toEqual({
        privateKey: "test",
        allowedOrganizationId: null,
        allowedRepositoryId: null,
      });
    });

    it("Should return parsed private key for format PRIVATE_KEY:GITHUB_ORGANIZATION_ID", async () => {
      // encrypted "test:1"
      const encryptedText = "6VWlePw3pf7XED3OXl2C8SBxdZ5i-yj214OI43TaChXhWxNHSQL2wHOyqNXqjcuedKVOW8HC";
      const decryptedText = await decrypt(encryptedText, X25519_PRIVATE_KEY);
      const parsedPrivateKey = parseDecryptedPrivateKey(decryptedText.privateKey);
      expect(parsedPrivateKey).toEqual({
        privateKey: "test",
        allowedOrganizationId: 1,
        allowedRepositoryId: null,
      });
    });

    it("Should return parsed private key for format PRIVATE_KEY:GITHUB_ORGANIZATION_ID:GITHUB_REPOSITORY_ID", async () => {
      // encrypted "test:1:2"
      const encryptedText = "q1yDNgeKQTiztJH8gfKH2cX77eC6BfvaSMjCxl7Q-Fj79LICsNBQOtjOBUXJoUdBqtbvI3OCvuw";
      const decryptedText = await decrypt(encryptedText, X25519_PRIVATE_KEY);
      const parsedPrivateKey = parseDecryptedPrivateKey(decryptedText.privateKey);
      expect(parsedPrivateKey).toEqual({
        privateKey: "test",
        allowedOrganizationId: 1,
        allowedRepositoryId: 2,
      });
    });
  });
});
