import z from "zod"
import { FR_PHONE_REGEX, POSTAL_CODE_REGEX } from "@/src/lib/validators"

const passwordField = z
  .string()
  .min(12, "Minimum 12 caractères")
  .max(128, "Maximum 128 caractères")
  .refine((v) => /[a-z]/.test(v), "1 lettre minuscule requise")
  .refine((v) => /[A-Z]/.test(v), "1 lettre majuscule requise")
  .refine((v) => /\d/.test(v), "1 chiffre requis")
  .refine((v) => /[^a-zA-Z0-9]/.test(v), "1 caractère spécial requis")

const optionalFrPhone = z
  .string()
  .refine((v) => v === "" || FR_PHONE_REGEX.test(v.replace(/\s/g, "")), "Format invalide (ex. 0612345678)")
  .optional()

export const LoginSchema = z.object({
  email: z.email("Email invalide"),
})

export const SiginMemberSchema = z.object({
  codeAssociation: z.string().min(1, "Code association requis"),
  invitationCode:  z.string().min(1, "Code d'invitation requis"),
  firstName: z.string().min(2, "Prénom requis (2+ caractères)"),
  lastName:  z.string().min(2, "Nom requis (2+ caractères)"),
  phone:     z.e164("Numéro de téléphone invalide (format international)"),
  email:     z.email("Email invalide"),
  password:         passwordField,
  confirmPassword:  z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const SiginAssociationSchema = z.object({})

//! Par défaut, tous les formulaires d'inscription (sauf membres) utilisent ces champs de base.
export const SiginGenericSchema = z.object({
  firstname:  z.string().min(2, "Prénom requis (2+ caractères)"),
  lastname:   z.string().min(2, "Nom requis (2+ caractères)"),
  email:      z.email("Email invalide"),
  city_code:  z.string().regex(POSTAL_CODE_REGEX, "Code postal invalide (5 chiffres)"),
  city:       z.string().optional(),
  dateOfBirth:z.string().optional(),
  sexe:       z.enum(["Homme", "Femme"]).optional(),
  phone:      optionalFrPhone,
  password:         passwordField,
  passwordConfirmation: z.string(),
}).refine((d) => d.password === d.passwordConfirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["passwordConfirmation"],
})

export const SiginCadetSchema = z.object({
  firstname:   z.string().min(2, "Prénom requis (2+ caractères)"),
  lastname:    z.string().min(2, "Nom requis (2+ caractères)"),
  dateOfBirth: z.string().min(1, "Date de naissance requise"),
  sexe:        z.enum(["Homme", "Femme"], { error: "Genre requis" }),
  email:       z.email("Email invalide"),
  city_code:   z.string().regex(POSTAL_CODE_REGEX, "Code postal invalide (5 chiffres)"),
  city:        z.string().optional(),
  phone:       optionalFrPhone,
  password:         passwordField,
  passwordConfirmation: z.string(),
}).refine((d) => d.password === d.passwordConfirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["passwordConfirmation"],
})
