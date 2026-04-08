import { Role } from "@prisma/client";
import {
  canBackdate,
  canReopen,
  canFinalise,
  canCreateReport,
  canEditReport,
  assertRole,
} from "@/lib/roles";

describe("Role helpers", () => {
  describe("canBackdate", () => {
    it("returns false for STAFF", () => {
      expect(canBackdate(Role.STAFF)).toBe(false);
    });
    it("returns true for MANAGER", () => {
      expect(canBackdate(Role.MANAGER)).toBe(true);
    });
    it("returns true for ADMIN", () => {
      expect(canBackdate(Role.ADMIN)).toBe(true);
    });
  });

  describe("canReopen", () => {
    it("returns false for STAFF", () => {
      expect(canReopen(Role.STAFF)).toBe(false);
    });
    it("returns true for MANAGER", () => {
      expect(canReopen(Role.MANAGER)).toBe(true);
    });
    it("returns true for ADMIN", () => {
      expect(canReopen(Role.ADMIN)).toBe(true);
    });
  });

  describe("canFinalise", () => {
    it("returns true for all roles", () => {
      expect(canFinalise(Role.STAFF)).toBe(true);
      expect(canFinalise(Role.MANAGER)).toBe(true);
      expect(canFinalise(Role.ADMIN)).toBe(true);
    });
  });

  describe("canCreateReport", () => {
    it("returns true for all roles", () => {
      expect(canCreateReport(Role.STAFF)).toBe(true);
      expect(canCreateReport(Role.MANAGER)).toBe(true);
      expect(canCreateReport(Role.ADMIN)).toBe(true);
    });
  });

  describe("canEditReport", () => {
    it("allows editing DRAFT reports for all roles", () => {
      expect(canEditReport(Role.STAFF, "DRAFT")).toBe(true);
      expect(canEditReport(Role.MANAGER, "DRAFT")).toBe(true);
      expect(canEditReport(Role.ADMIN, "DRAFT")).toBe(true);
    });
    it("denies editing FINALIZED report for STAFF", () => {
      expect(canEditReport(Role.STAFF, "FINALIZED")).toBe(false);
    });
    it("allows editing FINALIZED report for MANAGER", () => {
      expect(canEditReport(Role.MANAGER, "FINALIZED")).toBe(true);
    });
    it("allows editing FINALIZED report for ADMIN", () => {
      expect(canEditReport(Role.ADMIN, "FINALIZED")).toBe(true);
    });
  });

  describe("assertRole", () => {
    it("does not throw when role is in required list", () => {
      expect(() => assertRole(Role.ADMIN, [Role.ADMIN, Role.MANAGER])).not.toThrow();
    });
    it("throws FORBIDDEN when role is not in required list", () => {
      expect(() => assertRole(Role.STAFF, [Role.ADMIN, Role.MANAGER])).toThrow(
        "FORBIDDEN"
      );
    });
  });
});
