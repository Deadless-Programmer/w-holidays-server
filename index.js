const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxymr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // const intPackageCollection = client
    //   .db("worldholidaysDB")
    //   .collection("International_packages");

    // const domPackageCollection = client
    //   .db("worldholidaysDB")
    //   .collection("DomesticPackage");

    const popularPackageCollection = client
      .db("worldholidaysDB")
      .collection("PopularPackages");

    const NextTour = client.db("worldholidaysDB").collection("NextTour");

    const Popular_Destination = client
      .db("worldholidaysDB")
      .collection("PopularDestination");

    const DomesticeTickets = client
      .db("worldholidaysDB")
      .collection("DomesticTicket");

    const InternationalTicket = client
      .db("worldholidaysDB")
      .collection("Int_Ticket");

    const interNationalCartCollection = client
      .db("worldholidaysDB")
      .collection("interNationalPackCart");

    const domCartCollection = client
      .db("worldholidaysDB")
      .collection("domPackCart");

    const nextTourCartCollection = client
      .db("worldholidaysDB")
      .collection("nextTourkCart");

    const popularDesCartCollection = client
      .db("worldholidaysDB")
      .collection("popularDesCart");

    const ticketCartCollection = client
      .db("worldholidaysDB")
      .collection("ticketCart");

    const otherServicesCartCollection = client
      .db("worldholidaysDB")
      .collection("otherServicesCart");

    const visaProcessingFeeCollection = client
      .db("worldholidaysDB")
      .collection("VisaProcessingFee");

    const visaProcessingFeeCartCollection = client
      .db("worldholidaysDB")
      .collection("VisaProcessingFeeCart");

    const ourTeamMembers = client.db("worldholidaysDB").collection("OurTeam");
    
    const ourTravelersReview = client
      .db("worldholidaysDB")
      .collection("travelersReview");

      const travelUpdatesCollection = client.db("worldholidaysDB").collection("travelUpdates");

    const userCollection = client.db("worldholidaysDB").collection("users");

    // jwt related token

    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleware
    const verifyToken = (req, res, next) => {
      // console.log("inside verifyed token", req.headers.authorization);

      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized  access" });
        }
        req.decoded = decoded;
        next();
      });

      // next();
    };

    // const verifyAdmin = async (req, res, next) => {
    //   // console.log(req.decoded);
    //   const email = req.decoded.email;

    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   const isAdmin = user?.role === "admin";
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: " forbidden access" });
    //   }
    //   next();
    // };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    const verifyModerator = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "moderator") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    const verifyAdminOrModerator = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      if (user?.role === "admin" || user?.role === "moderator") {
        return next();
      }

      return res
        .status(403)
        .send({ error: true, message: "forbidden message" });
    };

    // const verifyModerator = async (req, res, next) => {
    //   const user = await userCollection.findOne({ email: req.decoded.email });
    //   if (!user || user.role !== 'moderator') {
    //     return res.status(403).send({ error: true, message: 'forbidden message' });
    //   }
    //   next();
    // }

    //  user related api

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      // Remove verifyAdmin
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const user = await userCollection.findOne({ email });
      res.send({ admin: user?.role === "admin" });
    });

    app.get("/users/moderator/:email", verifyToken, async (req, res) => {
      // Remove verifyAdmin
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const user = await userCollection.findOne({ email });
      res.send({ moderator: user?.role === "moderator" });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };

        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.patch(
      "/users/moderator/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "moderator",
          },
        };

        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // all international api

    app.get("/interNational_packages", async (req, res) => {
      const result = await intPackageCollection.find().toArray();
      res.send(result);
    });
    app.get(
      "/show-all-international-packages",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await intPackageCollection.find().toArray();
        res.send(result);
      }
    );

    app.get("/show-all-international-packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await intPackageCollection.findOne(query);
      res.send(result);
    });

    app.patch("/show-all-international-packages/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        const updatedDoc = {
          $set: {
            destination: data.destination,
            price: {
              amount: Number(data.price?.amount || 0), // Ensure amount is a number
              currency: data.price?.currency || "BDT", // Provide a default if undefined
              per: data.price?.per || "adult", // Provide a default if undefined
            },
            rating: parseFloat(data.rating) || 0,
            date_range: data.date_range || "",
            duration: data.duration || "",
            location: data.location || "",
            image: data.image || "",
            included_services: Array.isArray(data.included_services)
              ? data.included_services
              : (data.included_services || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            overview: data.overview || "",
            included: Array.isArray(data.included)
              ? data.included
              : (data.included || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            excluded: Array.isArray(data.excluded)
              ? data.excluded
              : (data.excluded || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            tour_location_images: Array.isArray(data.tour_location_images)
              ? data.tour_location_images
              : (data.tour_location_images || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
          },
        };

        const result = await intPackageCollection.updateOne(filter, updatedDoc);

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Package not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating package:", error);
        res
          .status(500)
          .send({ message: "Failed to update package", error: error.message });
      }
    });

    app.delete(
      "/show-all-international-packages/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await intPackageCollection.deleteOne(query);
        res.send(result);
      }
    );
    app.get("/interNational_packages/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await intPackageCollection.findOne(query);
      // console.log(result)
      res.send(result);
    });

    // all domestice api

    app.get("/popular_packages", async (req, res) => {
      const result = await popularPackageCollection.find().toArray();
      res.send(result);
    });
    app.get(
      "/show-all-popular-packages",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await popularPackageCollection.find().toArray();
        res.send(result);
      }
    );

    // update er jonno data ta k id diye fetch kora
    app.get("/show-all-popular-packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await popularPackageCollection.findOne(query);
      res.send(result);
    });
    app.patch("/show-all-popular-packages/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        const updatedDoc = {
          $set: {
            destination: data.destination,
            price: {
              amount: Number(data.price?.amount || 0), // Ensure amount is a number
              currency: data.price?.currency || "BDT", // Provide a default if undefined
              per: data.price?.per || "adult", // Provide a default if undefined
            },
            rating: parseFloat(data.rating) || 0,
            date_range: data.date_range || "",
            duration: data.duration || "",
            location: data.location || "",
            image: data.image || "",
            // included_services: Array.isArray(data.included_services)
            //   ? data.included_services
            //   : (data.included_services || "")
            //       .split(",")
            //       .map((item) => item.trim())
            //       .filter(Boolean),
            overview: data.overview || "",
            included: Array.isArray(data.included)
              ? data.included
              : (data.included || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            excluded: Array.isArray(data.excluded)
              ? data.excluded
              : (data.excluded || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            tour_location_images: Array.isArray(data.tour_location_images)
              ? data.tour_location_images
              : (data.tour_location_images || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
          },
        };

        const result = await popularPackageCollection.updateOne(filter, updatedDoc);

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Package not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating package:", error);
        res
          .status(500)
          .send({ message: "Failed to update package", error: error.message });
      }
    });

    app.delete(
      "/show-all-popular-packages/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await popularPackageCollection.deleteOne(query);
        res.send(result);
      }
    );

    app.post(
      "/popular_packages",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const item = req.body;
        console.log(item);
        const result = await popularPackageCollection.insertOne(item);
        res.send(result);
      }
    );

    app.get("/popular_packages/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await popularPackageCollection.findOne(query);
      res.send(result);
    });

    // next tour api

    app.get("/next_tour", async (req, res) => {
      const result = await NextTour.find().toArray();
      res.send(result);
    });

    app.get("/next_tour/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await NextTour.findOne(query);
      res.send(result);
    });

    app.get(
      "/show-all-next_tour",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await NextTour.find().toArray();
        res.send(result);
      }
    );

    app.delete(
      "/show-all-next_tour/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await NextTour.deleteOne(query);
        res.send(result);
      }
    );

    app.post(
      "/next_tour",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const item = req.body;
        console.log(item);
        const result = await NextTour.insertOne(item);
        res.send(result);
      }
    );

    app.get("/show-all-next_tour/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await NextTour.findOne(query);
      res.send(result);
    });

    app.patch("/show-all-next_tour/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        // Construct the update document
        const updatedDoc = {
          $set: {
            destination: data.destination,
            price: {
              amount: parseFloat(data.price.amount),
              currency: data.price.currency,
              per: data.price.per,
            },
            rating: parseFloat(data.rating),
            category: data.category,
            date_range: data.date_range,
            duration: data.duration,
            location: data.location,
            image: data.image,
            CoverImage: data.CoverImage,
            // included_services: data.included_services,
            overview: data.overview,
            included: data.included,
            excluded: data.excluded,
            tour_location_images: data.tour_location_images,
          },
        };

        const result = await NextTour.updateOne(filter, updatedDoc);

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Data not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res
          .status(500)
          .send({ message: "Failed to update data", error: error.message });
      }
    });

    app.get("/popular_destination", async (req, res) => {
      const result = await Popular_Destination.find().toArray();
      res.send(result);
    });

    app.post(
      "/popular_destination",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const item = req.body;
        console.log(item);
        const result = await Popular_Destination.insertOne(item);
        res.send(result);
      }
    );

    app.get("/popular_destination/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Popular_Destination.findOne(query);
      res.send(result);
    });

    app.get(
      "/show-popular_destination",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await Popular_Destination.find().toArray();
        res.send(result);
      }
    );

    app.delete(
      "/show-popular_destination/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await Popular_Destination.deleteOne(query);
        res.send(result);
      }
    );

    app.get("/show-popular_destination/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Popular_Destination.findOne(query);
      res.send(result);
    });

    app.patch("/show-popular_destination/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        // Construct the update document
        const updatedDoc = {
          $set: {
            name: data.name,
            country: data.country,

            image: data.image,

            overview: data.overview,
          },
        };

        const result = await Popular_Destination.updateOne(filter, updatedDoc);

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Data not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res
          .status(500)
          .send({ message: "Failed to update data", error: error.message });
      }
    });

    app.get("/domestice_ticket", async (req, res) => {
      const result = await DomesticeTickets.find().toArray();
      res.send(result);
    });

    app.get("/international_ticket", async (req, res) => {
      const result = await InternationalTicket.find().toArray();
      res.send(result);
    });

    // carts collections

    app.get(
      "/int_packages_cart_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await interNationalCartCollection.find().toArray();
        res.send(result);
      }
    );

    app.get("/int_packages_carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await interNationalCartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/int_packages_carts", async (req, res) => {
      const cartItems = req.body;
      const result = await interNationalCartCollection.insertOne(cartItems);
      res.send(result);
    });

    app.delete("/int_packages_carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await interNationalCartCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/dom_packages_cart_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await domCartCollection.find().toArray();
        res.send(result);
      }
    );
    app.get("/dom_packages_carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await domCartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/dom_packages_carts", async (req, res) => {
      const cartItems = req.body;
      const result = await domCartCollection.insertOne(cartItems);
      res.send(result);
    });

    app.delete("/dom_packages_carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await domCartCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/next_tour_carts_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await nextTourCartCollection.find().toArray();
        res.send(result);
      }
    );

    app.get("/next_tour_carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await nextTourCartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/next_tour_carts", async (req, res) => {
      const cartItems = req.body;
      const result = await nextTourCartCollection.insertOne(cartItems);
      res.send(result);
    });

    app.delete("/next_tour_carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await nextTourCartCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/popular_des_carts_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await popularDesCartCollection.find().toArray();
        res.send(result);
      }
    );
    app.get("/popular_des_cart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await popularDesCartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/popular_des_cart", async (req, res) => {
      const cartItems = req.body;
      const result = await popularDesCartCollection.insertOne(cartItems);
      res.send(result);
    });

    app.delete("/popular_des_cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await popularDesCartCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/ticket_carts_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await ticketCartCollection.find().toArray();
        res.send(result);
      }
    );

    app.post("/ticket_cart", async (req, res) => {
      const cartItems = req.body;
      const result = await ticketCartCollection.insertOne(cartItems);
      res.send(result);
    });

    app.delete("/ticket_cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ticketCartCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/ticket_cart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await ticketCartCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/other_services_cart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await otherServicesCartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/other_services_cart", async (req, res) => {
      const cartItems = req.body;
      const result = await otherServicesCartCollection.insertOne(cartItems);
      res.send(result);
    });

    // visa processing fee

    app.get("/visa-processing-fee", async (req, res) => {
      const result = await visaProcessingFeeCollection.find().toArray();
      res.send(result);
    });

    app.get("/visa-processing-fee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaProcessingFeeCollection.findOne(query);
      res.send(result);
    });

    app.get(
      "/visa-processing-fee-carts_orders",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await visaProcessingFeeCartCollection.find().toArray();
        res.send(result);
      }
    );
    app.post("/visa-processing-fee-cart", async (req, res) => {
      const cartItems = req.body;
      const result = await visaProcessingFeeCartCollection.insertOne(cartItems);
      res.send(result);
    });
    app.get("/visa_cart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await visaProcessingFeeCartCollection
        .find(query)
        .toArray();
      res.send(result);
    });

    app.delete("/visa_carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaProcessingFeeCartCollection.deleteOne(query);
      res.send(result);
    });

    app.post(
      "/visa-processing-fee",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const item = req.body;
        console.log(item);
        const result = await visaProcessingFeeCollection.insertOne(item);
        res.send(result);
      }
    );

    app.get(
      "/show-visa-processing-fee",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await visaProcessingFeeCollection.find().toArray();
        res.send(result);
      }
    );

    app.delete(
      "/show-visa-processing-fee/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await visaProcessingFeeCollection.deleteOne(query);
        res.send(result);
      }
    );

    app.get("/show-visa-processing-fee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaProcessingFeeCollection.findOne(query);
      res.send(result);
    });

    app.patch("/show-visa-processing-fee/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        // Construct the update document
        const updatedDoc = {
          $set: {
            name: data.name,
            visaFee: Number(data.visaFee),
            Requirment: data.Requirment,
            country_location_images: data.country_location_images,
            src: data.src,
            overview: data.overview,
          },
        };

        const result = await visaProcessingFeeCollection.updateOne(
          filter,
          updatedDoc
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Data not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res
          .status(500)
          .send({ message: "Failed to update data", error: error.message });
      }
    });

    // our team members api

    app.get("/ourTeamMembers", async (req, res) => {
      const result = await ourTeamMembers.find().toArray();
      res.send(result);
    });

    app.post(
      "/ourTeamMembers",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const cartItems = req.body;
        const result = await ourTeamMembers.insertOne(cartItems);
        res.send(result);
      }
    );

    app.get(
      "/show-ourTeamMembers",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await ourTeamMembers.find().toArray();
        res.send(result);
      }
    );

    app.delete(
      "/show-ourTeamMembers/:id",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await ourTeamMembers.deleteOne(query);
        res.send(result);
      }
    );

    app.get("/show-ourTeamMembers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ourTeamMembers.findOne(query);
      res.send(result);
    });

    app.patch("/show-ourTeamMembers/:id", async (req, res) => {
      try {
        const data = req.body;
        const id = req.params.id;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID" });
        }

        const filter = { _id: new ObjectId(id) };

        // Ensure the data object is not empty
        if (!data || typeof data !== "object") {
          return res.status(400).send({ message: "Invalid data format" });
        }

        // Construct the update document
        const updatedDoc = {
          $set: {
            name: data.name,
            designation: data.designation,
            img: data.img,
          },
        };

        const result = await ourTeamMembers.updateOne(filter, updatedDoc);

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Data not found or no changes made" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res
          .status(500)
          .send({ message: "Failed to update data", error: error.message });
      }
    });

    // travelers review api

    app.get("/travelersReview", async (req, res) => {
      const result = await ourTravelersReview
        .find({ status: "approved" })
        .toArray();
      res.send(result);
    });

    app.get(
      "/show-travelersReview",
      verifyToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await ourTravelersReview.find().toArray();
        res.send(result);
      }
    );

    app.post("/travelersReview", verifyToken, async (req, res) => {
      const cartItems = req.body;
      const result = await ourTravelersReview.insertOne(cartItems);
      res.send(result);
    });

    app.patch("/show-travelersReview/approved/:id", async (req, res) => {
      const id = req.params.id;
      // const classCart = req.body.classCart;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: "approved",
        },
      };

      const result = await ourTravelersReview.updateOne(filter, updateStatus);

      res.send(result);
    });
    app.patch("/show-travelersReview/denied/:id", async (req, res) => {
      const id = req.params.id;
      // const classCart = req.body.classCart;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: "denied",
        },
      };

      const result = await ourTravelersReview.updateOne(filter, updateStatus);

      res.send(result);
    });


    // ── Travel Updates ────────────────────────────────────────────────

// Public: frontend এ দেখাবে
app.get("/travel-updates", async (req, res) => {
  const result = await travelUpdatesCollection
    .find({ isActive: true })
    .sort({ date: -1 })
    .toArray();
  res.send(result);
});

// Admin: সব updates (active + inactive)
app.get("/show-all-travel-updates", verifyToken, verifyAdminOrModerator, async (req, res) => {
  const result = await travelUpdatesCollection
    .find()
    .sort({ date: -1 })
    .toArray();
  res.send(result);
});

// Admin: নতুন update add
app.post("/travel-updates", verifyToken, verifyAdminOrModerator, async (req, res) => {
  const item = req.body;
  item.date = item.date || new Date().toISOString().split("T")[0];
  item.isActive = true;
  const result = await travelUpdatesCollection.insertOne(item);
  res.send(result);
});

// Admin: update edit
app.patch("/travel-updates/:id", verifyToken, verifyAdminOrModerator, async (req, res) => {
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
    image:       data.image || "",   // ← add
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
app.delete("/travel-updates/:id", verifyToken, verifyAdminOrModerator, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await travelUpdatesCollection.deleteOne(query);
  res.send(result);
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("world holidays is traveling");
});

app.listen(port, () => {
  console.log(`World holidays is sitting on port ${port}`);
});