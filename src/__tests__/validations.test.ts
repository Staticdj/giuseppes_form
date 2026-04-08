import {
  reportInfoSchema,
  signOffSchema,
  draftReportSchema,
  finaliseReportSchema,
} from "@/lib/validations/report";

describe("reportInfoSchema", () => {
  const valid = {
    venueName: "Giuseppe's",
    reportDate: "2025-01-15",
    dayOfWeek: "Wednesday",
    enteredBy: "Jane Smith",
  };

  it("passes with valid data", () => {
    expect(reportInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when venueName is empty", () => {
    const result = reportInfoSchema.safeParse({ ...valid, venueName: "" });
    expect(result.success).toBe(false);
  });

  it("fails when reportDate is missing", () => {
    const result = reportInfoSchema.safeParse({ ...valid, reportDate: "" });
    expect(result.success).toBe(false);
  });

  it("fails when enteredBy is missing", () => {
    const result = reportInfoSchema.safeParse({ ...valid, enteredBy: "" });
    expect(result.success).toBe(false);
  });
});

describe("signOffSchema", () => {
  it("passes with valid sign-off data", () => {
    const result = signOffSchema.safeParse({
      signedOff: true,
      signedOffBy: "Jane Smith",
    });
    expect(result.success).toBe(true);
  });

  it("fails when signedOff is false", () => {
    const result = signOffSchema.safeParse({
      signedOff: false,
      signedOffBy: "Jane Smith",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("You must check the sign-off box");
    }
  });

  it("fails when signedOffBy is empty", () => {
    const result = signOffSchema.safeParse({
      signedOff: true,
      signedOffBy: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Full name is required for sign-off");
    }
  });
});

describe("draftReportSchema", () => {
  const validDraft = {
    venueName: "Giuseppe's",
    reportDate: "2025-01-15",
    dayOfWeek: "Wednesday",
    enteredBy: "Jane Smith",
    cash: "1200.00",
    eftpos: "800.50",
  };

  it("passes without sign-off fields", () => {
    expect(draftReportSchema.safeParse(validDraft).success).toBe(true);
  });

  it("passes with partial financial data", () => {
    const result = draftReportSchema.safeParse({
      ...validDraft,
      cash: "",
      eftpos: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("finaliseReportSchema", () => {
  const validFinalise = {
    venueName: "Giuseppe's",
    reportDate: "2025-01-15",
    dayOfWeek: "Wednesday",
    enteredBy: "Jane Smith",
    signedOff: true,
    signedOffBy: "Jane Smith",
  };

  it("passes with sign-off provided", () => {
    expect(finaliseReportSchema.safeParse(validFinalise).success).toBe(true);
  });

  it("fails without sign-off checkbox", () => {
    const result = finaliseReportSchema.safeParse({
      ...validFinalise,
      signedOff: false,
    });
    expect(result.success).toBe(false);
  });

  it("fails without signed-off name", () => {
    const result = finaliseReportSchema.safeParse({
      ...validFinalise,
      signedOffBy: "",
    });
    expect(result.success).toBe(false);
  });
});
