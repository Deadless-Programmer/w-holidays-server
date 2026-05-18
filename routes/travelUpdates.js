const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// travelUpdatesCollection টা parameter হিসেবে নেবো
module.exports = (travelUpdatesCollection, verifyToken, verifyAdminOrModerator) => {

  // Public: সব active updates
  router.get("/", async (req, res) => {
    const result = await travelUpdatesCollection
      .find({ isActive: true })
      .sort({ date: -1 })
      .toArray();
    res.send(result);
  });

  // Admin: সব updates
  router.get("/all", verifyToken, verifyAdminOrModerator, async (req, res) => {
    const result = await travelUpdatesCollection
      .find()
      .sort({ date: -1 })
      .toArray();
    res.send(result);
  });

  // Admin: নতুন update add
  router.post("/", verifyToken, verifyAdminOrModerator, async (req, res) => {
    const item = req.body;
    item.date = item.date || new Date().toISOString().split("T")[0];
    item.isActive = true;
    const result = await travelUpdatesCollection.insertOne(item);
    res.send(result);
  });

  // Admin: update edit
  router.patch("/:id", verifyToken, verifyAdminOrModerator, async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID" });
      }

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title:       data.title,
          description: data.description,
          category:    data.category,
          date:        data.date,
          image:       data.image || "",
          tags:        Array.isArray(data.tags)
                         ? data.tags
                         : (data.tags || "").split(",").map(t => t.trim()).filter(Boolean),
          featured:    data.featured || false,
          isActive:    data.isActive !== undefined ? data.isActive : true,
        },
      };

      const result = await travelUpdatesCollection.updateOne(filter, updatedDoc);
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: "Not found or no changes made" });
      }
      res.send(result);
    } catch (error) {
      res.status(500).send({ message: "Failed to update", error: error.message });
    }
  });

  // Admin: delete
  router.delete("/:id", verifyToken, verifyAdminOrModerator, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await travelUpdatesCollection.deleteOne(query);
    res.send(result);
  });

  return router;
};