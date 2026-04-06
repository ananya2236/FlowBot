import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "flowbot",
  isDev: process.env.NODE_ENV !== "production",
});
