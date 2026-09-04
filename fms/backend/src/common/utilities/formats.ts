export const dateFormatRegex =
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/; // format: DD/MM/YYYY
export const monthFormatRegex = /^(0[1-9]|1[0-2])\/([0-9]{4})$/; // format: MM/YYYY
export const phoneNumberFormatRegex =
  /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/; // +00111111111
export const dateTimeFormatRegex =
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4} ([01][0-9]|2[0-3]):[0-5][0-9]$/; // format: DD/MM/YYYY HH:mm

export const dateResMomentFormat = 'MMM D, YYYY';
export const dateTimeResMomentFormat = 'MMM D, YYYY h:mm a';
