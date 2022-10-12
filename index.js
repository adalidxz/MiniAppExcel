import app from "./app";

console.log("Server on port " + app.get("PORT"));
app.listen(app.get("PORT"));

