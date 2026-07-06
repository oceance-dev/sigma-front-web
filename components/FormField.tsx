import type { FieldConfig as FormFieldType } from "@/src/types/form";
import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { PasswordInput } from "./PasswordInput";
import { pwStrength } from "@/src/lib/password-validation";

interface FormFieldProps {
  field: FormFieldType;
  onChange: (name: string, value: string | number) => void;
  error?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  onChange,
  error,
  disabled,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const value =
      field.type === "number" ? parseFloat(e.target.value) || "" : e.target.value;
    onChange(field.name, value);
  };

  const inputClass = `w-full p-2 border rounded ${error ? "border-red-500" : "border-gray-300"}`;
  const currentValue = String(field.value ?? "");

  return (
    <div className="mb-4">
      {field.label && field.type !== "checkbox" && (
        <Label
          htmlFor={field.name}
          className="block text-sm font-medium mb-1"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}

      {field.type === "textarea" ? (
        <textarea
          id={field.name}
          name={field.name}
          value={currentValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          className={inputClass}
          required={field.required}
          disabled={disabled}
          rows={3}
        />
      ) : field.type === "select" ? (
        <select
          id={field.name}
          name={field.name}
          value={currentValue}
          onChange={handleChange}
          className={inputClass}
          required={field.required}
          disabled={disabled}
        >
          <option value="">— Sélectionner —</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={currentValue === "true"}
            onChange={(e) => onChange(field.name, e.target.checked ? "true" : "")}
            required={field.required}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-sm text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5"> *</span>}
          </span>
        </label>
      ) : field.type === "password" ? (
        <>
          <PasswordInput
            id={field.name}
            name={field.name}
            value={currentValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            className={inputClass}
            required={field.required}
            disabled={disabled}
            autoComplete="new-password"
          />
          {field.showStrengthCheck && currentValue.length > 0 && (() => {
            const checks = pwStrength(currentValue);
            return (
              <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                {([
                  [checks.length, "12–128 caractères"],
                  [checks.lower, "1 minuscule"],
                  [checks.upper, "1 majuscule"],
                  [checks.digit, "1 chiffre"],
                  [checks.special, "1 caractère spécial"],
                ] as [boolean, string][]).map(([ok, label]) => (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <span className="text-[10px] font-bold">{ok ? "✓" : "○"}</span>
                    {label}
                  </li>
                ))}
              </ul>
            );
          })()}
        </>
      ) : (
        <Input
          id={field.name}
          name={field.name}
          type={field.type === "phone" ? "tel" : field.type}
          value={currentValue}
          onChange={handleChange}
          placeholder={field.placeholder}
          className={inputClass}
          required={field.required}
          disabled={disabled}
        />
      )}

      {field.hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
