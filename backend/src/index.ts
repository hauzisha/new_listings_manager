import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import app from "./app";

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
