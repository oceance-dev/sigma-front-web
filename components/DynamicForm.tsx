import { FormField, FormData } from "@/src/types/form";
import { FormField as FormFieldComponent } from "./FormField";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { pwValid } from "@/src/lib/password-validation";
import { EMAIL_REGEX } from "@/src/lib/validators";

type FormSchema = {
  safeParse(data: unknown): {
    success: boolean;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  };
};

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: FormData) => void | Promise<void>;
  submitText?: string;
  externalErrors?: Record<string, string>;
  disabled?: boolean;
  schema?: FormSchema;
  children?: React.ReactNode;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  submitText = "Envoyer",
  externalErrors,
  disabled: disabledProp,
  schema,
  children,
}) => {
  const [formData, setFormData] = useState<FormData>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.value }), {}),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    let newErrors: Record<string, string> = {};

    if (schema) {
      const result = schema.safeParse(formData);
      if (!result.success) {
        result.error?.issues.forEach((issue) => {
          const field = issue.path[0];
          if (field !== undefined && typeof field !== "symbol" && !newErrors[String(field)]) {
            newErrors[String(field)] = issue.message;
          }
        });
      }
    } else {
      fields.forEach((field) => {
        const value = formData[field.name];
        const strVal = String(value ?? "");

        if (field.required && (!strVal || strVal === "")) {
          newErrors[field.name] = `${field.label || field.name} est requis`;
          return;
        }

        if (field.type === "email" && strVal && !EMAIL_REGEX.test(strVal)) {
          newErrors[field.name] = "Email invalide";
        }

        if (field.type === "password" && field.showStrengthCheck && strVal && !pwValid(strVal)) {
          newErrors[field.name] = "Le mot de passe ne respecte pas les critères";
        }

        if (field.matchField && strVal !== String(formData[field.matchField] ?? "")) {
          newErrors[field.name] = `${field.label || field.name} ne correspond pas`;
        }
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstId = Object.keys(newErrors)[0];
      document.getElementById(firstId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setIsPending(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsPending(false);
    }
  };

  const allErrors = { ...errors, ...externalErrors };
  const isDisabled = isPending || !!disabledProp;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {fields.map((field) => (
        <FormFieldComponent
          key={field.name}
          field={{ ...field, value: formData[field.name] ?? field.value }}
          onChange={handleChange}
          error={allErrors[field.name]}
          disabled={isDisabled}
        />
      ))}
      {children}
      <Button type="submit" className="w-full" disabled={isDisabled}>
        {isPending ? "Envoi en cours…" : submitText}
      </Button>
    </form>
  );
};
