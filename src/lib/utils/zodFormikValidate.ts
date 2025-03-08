// lib/utils/zodFormikValidate.ts
import { ZodSchema } from "zod";

export function validateZodSchema<T>(schema: ZodSchema<T>) {
  return function (values: T) {
    const result = schema.safeParse(values);
    if (result.success) {
      return {}; // No validation errors
    }
    // Transform Zod errors to Formik field errors
    const formikErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      if (issue.path.length) {
        const fieldName = issue.path[0];
        formikErrors[fieldName] = issue.message;
      }
    }
    return formikErrors;
  };
}
