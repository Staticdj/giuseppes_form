"use client";

import React, { createContext, useContext, useState } from "react";

export interface ReportFormData {
  // Step 1
  venueName: string;
  reportDate: string;
  dayOfWeek: string;
  enteredBy: string;
  // Step 2
  cash: string;
  eftpos: string;
  vouchers: string;
  hotelChargeback: string;
  // Step 3
  online: string;
  phone: string;
  dineIn: string;
  takeaway: string;
  deliveries: string;
  // Step 4
  fohJuniors: string;
  fohRsa: string;
  voids: string;
  // Step 5
  notes: string;
  // Step 6
  busyLevel: string;
  eventRunning: boolean;
  eventName: string;
  eventType: string;
  weatherCondition: string;
  weatherImpactNote: string;
  // Step 7
  signedOff: boolean;
  signedOffBy: string;
}

export const defaultFormData: ReportFormData = {
  venueName: "Giuseppe's Restaurant",
  reportDate: "",
  dayOfWeek: "",
  enteredBy: "",
  cash: "",
  eftpos: "",
  vouchers: "",
  hotelChargeback: "",
  online: "",
  phone: "",
  dineIn: "",
  takeaway: "",
  deliveries: "",
  fohJuniors: "",
  fohRsa: "",
  voids: "",
  notes: "",
  busyLevel: "",
  eventRunning: false,
  eventName: "",
  eventType: "",
  weatherCondition: "",
  weatherImpactNote: "",
  signedOff: false,
  signedOffBy: "",
};

interface FormContextValue {
  data: ReportFormData;
  update: (partial: Partial<ReportFormData>) => void;
  errors: Partial<Record<keyof ReportFormData, string>>;
  setErrors: (errors: Partial<Record<keyof ReportFormData, string>>) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: Partial<ReportFormData>;
}) {
  const [data, setData] = useState<ReportFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ReportFormData, string>>
  >({});

  const update = (partial: Partial<ReportFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  return (
    <FormContext.Provider value={{ data, update, errors, setErrors }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useFormContext must be used within FormProvider");
  return ctx;
}
