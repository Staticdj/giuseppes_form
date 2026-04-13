"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFormContext, ReportFormData } from "./FormContext";
import { ProgressIndicator, FORM_STEPS } from "@/components/layout/ProgressIndicator";
import { ReportHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FinaliseModal } from "./FinaliseModal";
import { Step1ReportInfo } from "./steps/Step1ReportInfo";
import { Step2FinancialTotals } from "./steps/Step2FinancialTotals";
import { Step3SalesChannels } from "./steps/Step3SalesChannels";
import { Step4Staffing } from "./steps/Step4Staffing";
import { Step5AdjustmentsNotes } from "./steps/Step5AdjustmentsNotes";
import { Step6SmartAdditions } from "./steps/Step6SmartAdditions";
import { Step7SignOff } from "./steps/Step7SignOff";
import { Step8Finalise } from "./steps/Step8Finalise";
import {
  createDraftReport,
  saveDraftReport,
  finaliseReport,
} from "@/actions/report";
import {
  reportInfoSchema,
  signOffSchema,
} from "@/lib/validations/report";

interface ReportFormWizardProps {
  reportId?: string;
  initialData?: Partial<ReportFormData>;
  canBackdate: boolean;
  isFinalised?: boolean;
}

function WizardInner({
  reportId,
  canBackdate,
  isFinalised = false,
}: Omit<ReportFormWizardProps, "initialData">) {
  const router = useRouter();
  const { data, setErrors } = useFormContext();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showFinaliseModal, setShowFinaliseModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalSteps = FORM_STEPS.length;

  function validateCurrentStep(): boolean {
    setErrors({});
    if (step === 1) {
      const result = reportInfoSchema.safeParse({
        venueName: data.venueName,
        reportDate: data.reportDate,
        dayOfWeek: data.dayOfWeek,
        enteredBy: data.enteredBy,
      });
      if (!result.success) {
        const errs: Partial<Record<keyof ReportFormData, string>> = {};
        result.error.issues.forEach((i) => {
          const key = i.path[0] as keyof ReportFormData;
          errs[key] = i.message;
        });
        setErrors(errs);
        return false;
      }
    }
    if (step === 7) {
      const result = signOffSchema.safeParse({
        signedOff: data.signedOff,
        signedOffBy: data.signedOffBy,
      });
      if (!result.success) {
        const errs: Partial<Record<keyof ReportFormData, string>> = {};
        result.error.issues.forEach((i) => {
          const key = i.path[0] as keyof ReportFormData;
          errs[key] = i.message;
        });
        setErrors(errs);
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    if (step < totalSteps) setStep(step + 1);
  }

  function handleBack() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  function handleStepClick(s: number) {
    if (s <= step) {
      setError(null);
      setStep(s);
    }
  }

  async function handleSaveDraft() {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const formData = data as unknown as Record<string, unknown>;
      let result;
      if (reportId) {
        result = await saveDraftReport(reportId, formData);
      } else {
        result = await createDraftReport(formData);
      }
      if (result.success) {
        setSuccessMsg("Draft saved.");
        if (!reportId) {
          router.replace(`/reports/${result.data.id}/edit`);
        }
      } else {
        setError(result.error);
      }
    });
  }

  async function handleFinalise() {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      if (!reportId) {
        // Create draft first, then finalise
        const draftResult = await createDraftReport(
          data as unknown as Record<string, unknown>
        );
        if (!draftResult.success) {
          setError(draftResult.error);
          setShowFinaliseModal(false);
          return;
        }
        const newId = draftResult.data.id;
        const finalResult = await finaliseReport(
          newId,
          data as unknown as Record<string, unknown>
        );
        if (finalResult.success) {
          if (finalResult.data.warnings.length > 0) {
            // Show warnings briefly before redirect
            setSuccessMsg(
              `Finalised. Note: ${finalResult.data.warnings.join(" ")}`
            );
            setTimeout(() => router.push(`/reports/${newId}`), 3000);
          } else {
            router.push(`/reports/${newId}`);
          }
        } else {
          setError(finalResult.error);
        }
      } else {
        const result = await finaliseReport(
          reportId,
          data as unknown as Record<string, unknown>
        );
        if (result.success) {
          if (result.data.warnings.length > 0) {
            setSuccessMsg(
              `Finalised. Note: ${result.data.warnings.join(" ")}`
            );
            setTimeout(() => router.push(`/reports/${reportId}`), 3000);
          } else {
            router.push(`/reports/${reportId}`);
          }
        } else {
          setError(result.error);
        }
      }
      setShowFinaliseModal(false);
    });
  }

  const currentStepLabel = FORM_STEPS[step - 1]?.label ?? "";

  return (
    <div className="min-h-screen bg-giuseppe-cream dark:bg-giuseppe-dark">
      <ReportHeader
        venueName={data.venueName}
        reportDate={data.reportDate}
        dayOfWeek={data.dayOfWeek}
        status={isFinalised ? "FINALIZED" : "DRAFT"}
      />

      {/* Progress */}
      <div className="bg-white dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border py-3 px-4">
        <ProgressIndicator
          currentStep={step}
          onStepClick={handleStepClick}
        />
      </div>

      <main className="max-w-xl mx-auto px-4 py-6 pb-32">
        {/* Step heading */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">
            Step {step} of {totalSteps}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-giuseppe-cream mt-0.5">
            {currentStepLabel}
          </h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} />
          </div>
        )}
        {successMsg && (
          <div className="mb-4">
            <Alert type="success" message={successMsg} />
          </div>
        )}
        {isFinalised && (
          <div className="mb-4">
            <Alert
              type="info"
              message="This report has been finalised. It is read-only."
            />
          </div>
        )}

        {/* Step content */}
        <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border p-5 shadow-sm">
          {step === 1 && <Step1ReportInfo canBackdate={canBackdate} />}
          {step === 2 && <Step2FinancialTotals />}
          {step === 3 && <Step3SalesChannels />}
          {step === 4 && <Step4Staffing />}
          {step === 5 && <Step5AdjustmentsNotes />}
          {step === 6 && <Step6SmartAdditions />}
          {step === 7 && <Step7SignOff />}
          {step === 8 && <Step8Finalise isFinalised={isFinalised} />}
        </div>
      </main>

      {/* Fixed bottom navigation */}
      {!isFinalised && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-giuseppe-darker border-t border-gray-200 dark:border-giuseppe-border shadow-lg px-4 py-3 z-30">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBack}
                disabled={isPending}
                className="flex-1"
              >
                ← Back
              </Button>
            )}

            <Button
              variant="ghost"
              size="lg"
              onClick={handleSaveDraft}
              loading={isPending}
              className="flex-shrink-0"
            >
              Save Draft
            </Button>

            {step < totalSteps ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={isPending}
                className="flex-1"
              >
                Next →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setError(null);
                  if (!data.signedOff || !data.signedOffBy.trim()) {
                    setError(
                      "Please complete Sign-Off (Step 7) before finalising."
                    );
                    return;
                  }
                  setShowFinaliseModal(true);
                }}
                disabled={isPending}
                className="flex-1"
              >
                Finalise Report
              </Button>
            )}
          </div>
        </div>
      )}

      <FinaliseModal
        open={showFinaliseModal}
        onClose={() => setShowFinaliseModal(false)}
        onConfirm={handleFinalise}
        signedOffBy={data.signedOffBy}
        venueName={data.venueName}
        reportDate={data.reportDate}
      />
    </div>
  );
}

export function ReportFormWizard({
  reportId,
  initialData,
  canBackdate,
  isFinalised = false,
}: ReportFormWizardProps) {
  return (
    <FormProvider initialData={initialData}>
      <WizardInner
        reportId={reportId}
        canBackdate={canBackdate}
        isFinalised={isFinalised}
      />
    </FormProvider>
  );
}
