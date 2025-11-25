const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const reviewRoutes = require("./routes/review.routes");
const searchRoutes = require("./routes/search.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.use("/reviews", reviewRoutes);
app.use("/search", searchRoutes);
app.use("/notifications", notificationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

module.exports = app;