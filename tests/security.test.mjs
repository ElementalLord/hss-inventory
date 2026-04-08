import test from "node:test";
import assert from "node:assert/strict";
import {
  DEVELOPER_USERNAME,
  normalizeEmail,
  isPrivilegedRole,
  isDeveloperUser,
  canDeleteUser,
  canAssignRole,
} from "../src/security.js";

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  DevEloper  "), "developer");
  assert.equal(normalizeEmail(" User@Example.COM "), "user@example.com");
});

test("privileged roles include admin and developer only", () => {
  assert.equal(isPrivilegedRole("admin"), true);
  assert.equal(isPrivilegedRole("developer"), true);
  assert.equal(isPrivilegedRole("user"), false);
  assert.equal(isPrivilegedRole(""), false);
});

test("developer account is identified correctly", () => {
  assert.equal(DEVELOPER_USERNAME, "developer");
  assert.equal(isDeveloperUser({ role: "developer" }), true);
  assert.equal(isDeveloperUser({ role: "admin" }), false);
});

test("developer accounts cannot be deleted", () => {
  assert.equal(canDeleteUser("admin", { role: "developer" }), false);
  assert.equal(canDeleteUser("developer", { role: "developer" }), false);
  assert.equal(canDeleteUser("admin", { role: "user" }), true);
});

test("only developers can assign developer role", () => {
  assert.equal(canAssignRole("admin", { role: "user" }, "admin"), true);
  assert.equal(canAssignRole("admin", { role: "user" }, "developer"), false);
  assert.equal(canAssignRole("developer", { role: "user" }, "developer"), true);
});
