"use client";

import { Textarea } from "@/components/ui/textarea";
import { FieldError, FieldLabel, fieldClass } from "@/components/shared/ToolBits";
import { cn } from "@/lib/utils";

/**
 * Manual job details shared by cover letter, cold email and the scanner.
 * One required field (the job text); company and role are optional and only sharpen the result.
 */
export default function JobDetailsFields({ idPrefix, values, onChange, errors = {}, placeholder = "paste the job description here" }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel htmlFor={`${idPrefix}-jd`}>job description</FieldLabel>
        <Textarea
          id={`${idPrefix}-jd`}
          rows={7}
          value={values.jobDescription}
          onChange={(e) => onChange("jobDescription", e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!errors.jobDescription}
          aria-describedby={errors.jobDescription ? `${idPrefix}-jd-err` : undefined}
          className={cn(fieldClass, "mt-1.5 min-h-40 py-3")}
        />
        <div id={`${idPrefix}-jd-err`}>
          <FieldError>{errors.jobDescription}</FieldError>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${idPrefix}-company`}>company (optional)</FieldLabel>
          <input
            id={`${idPrefix}-company`}
            value={values.companyName}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="stripe"
            autoComplete="off"
            className={cn(fieldClass, "mt-1.5 h-11")}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${idPrefix}-role`}>role (optional)</FieldLabel>
          <input
            id={`${idPrefix}-role`}
            value={values.jobTitle}
            onChange={(e) => onChange("jobTitle", e.target.value)}
            placeholder="software engineer"
            autoComplete="off"
            className={cn(fieldClass, "mt-1.5 h-11")}
          />
        </div>
      </div>
    </div>
  );
}
