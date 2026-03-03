import { api } from "./api";

export const sendContactMessage = async (name, email, message) => {
  return api.post("/contact", {
    name,
    email,
    message,
  });
};