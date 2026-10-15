// A document upload: `number` and `expiry_date` ride along with the file. axios would send FormData as JSON under the
// instance's default Content-Type, so multipart has to be named. Shared by the applicant's and the staff upload.
export const documentForm = (file, { number, expiry_date } = {}) => {
  const form = new FormData();
  if (number) form.append("number", number);
  if (expiry_date) form.append("expiry_date", expiry_date);
  form.append("file", file);
  return form;
};

export const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };
