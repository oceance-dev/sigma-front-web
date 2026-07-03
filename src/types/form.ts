export interface FormField {
  name: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "phone"
    | "textarea"
    | "select"
    | "date"
    | "checkbox";
  label?: string;
  placeholder?: string;
  required?: boolean;
  value: string | number;
  options?: { value: string; label: string }[];
  hint?: string;
  showStrengthCheck?: boolean;
  matchField?: string;
}

export type FieldConfig = FormField;
export type FormData = Record<string, string | number>;
