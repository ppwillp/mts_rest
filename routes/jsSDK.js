const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("js_sdk/index", {
    title: "JS SDK",
    endpoint: "new integration path"
  });
});

module.exports = router;
