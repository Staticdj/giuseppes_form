import { z } from "zod";

const decimalString = z
  .string()
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v))
  .refine(
    (v) => v === undefined || !isNaN(parseFloat(v)),
    "Must be a valid number"
  );

export const reportInfoSchema = z.object({
  venueName: z.string().min(1, "Venue name is required"),
  reportDate: z.string().min(1, "Report date is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  enteredBy: z.string().min(1, "Entered by is required"),
});

export const financialTotalsSchema = z.object({
  cash: decimalString,
  eftpos: decimalString,
  vouchers: decimalString,
  hotelChargeback: decimalString,
});

export const salesChannelsSchema = z.object({
  online: decimalString,
  phone: decimalString,
  dineIn: decimalString,
  takeaway: decimalString,
  deliveries: decimalString,
});

export const staffingSchema = z.object({
  fohJuniors: z
    .string()
    .optional()
    .transform((v) =>
      v === "" || v === undefined ? undefined : parseInt(v, 10)
    ),
  fohRsa: z
    .string()
    .optional()
    .transform((v) =>
      v === "" || v === undefined ? undefined : parseInt(v, 10)
    ),
  voids: decimalString,
});

export const adjustmentsSchema = z.object({
  notes: z.string().optional(),
});

export const smartAdditionsSchema = z.object({
  busyLevel: z.enum(["QUIET", "MODERATE", "BUSY", "VERY_BUSY"]).optional().or(z.literal("")),
  eventRunning: z.boolean().optional().default(false),
  eventName: z.string().optional(),
  eventType: z.string().optional(),
  weatherCondition: z
    .enum(["FINE", "CLOUDY", "RAIN", "STORM", "HOT"])
    .optional()
    .or(z.literal("")),
  weatherImpactNote: z.string().optional(),
});

export const signOffSchema = z.object({
  signedOff: z.boolean().refine((v) => v === true, {
    message: "You must check the sign-off box",
  }),
  signedOffBy: z.string().min(1, "Full name is required for sign-off"),
});

// Full report schema combining all steps (for draft – sign-off not required)
export const draftReportSchema = reportInfoSchema
  .merge(financialTotalsSchema)
  .merge(salesChannelsSchema)
  .merge(staffingSchema)
  .merge(adjustmentsSchema)
  .merge(smartAdditionsSchema)
  .extend({
    signedOff: z.boolean().optional().default(false),
    signedOffBy: z.string().optional(),
  });

// Full report schema for finalisation – sign-off required
export const finaliseReportSchema = reportInfoSchema
  .merge(financialTotalsSchema)
  .merge(salesChannelsSchema)
  .merge(staffingSchema)
  .merge(adjustmentsSchema)
  .merge(smartAdditionsSchema)
  .merge(signOffSchema);

export type DraftReportInput = z.infer<typeof draftReportSchema>;
export type FinaliseReportInput = z.infer<typeof finaliseReportSchema>;
export type ReportInfoInput = z.infer<typeof reportInfoSchema>;
export type FinancialTotalsInput = z.infer<typeof financialTotalsSchema>;
export type SalesChannelsInput = z.infer<typeof salesChannelsSchema>;
export type StaffingInput = z.infer<typeof staffingSchema>;
export type AdjustmentsInput = z.infer<typeof adjustmentsSchema>;
export type SmartAdditionsInput = z.infer<typeof smartAdditionsSchema>;
export type SignOffInput = z.infer<typeof signOffSchema>;
