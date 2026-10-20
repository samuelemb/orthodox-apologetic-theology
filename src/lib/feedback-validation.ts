export type FeedbackValues = { name: string; email: string; message: string };
export type FeedbackErrors = Partial<Record<keyof FeedbackValues, "nameTooLong" | "emailInvalid" | "messageRequired" | "messageTooLong">>;
export function normalizeFeedback(values:FeedbackValues):FeedbackValues {
  return {name:values.name.trim(),email:values.email.trim(),message:values.message.replace(/\r\n?/g,'\n').trim()};
}

export function validateFeedback(values: FeedbackValues): FeedbackErrors {
  const errors: FeedbackErrors = {};
  if (values.name.length > 100) errors.name = "nameTooLong";
  if (values.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "emailInvalid";
  if (!values.message.trim()) errors.message = "messageRequired";
  else if (values.message.length > 5000) errors.message = "messageTooLong";
  return errors;
}
