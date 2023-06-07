const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
// middleware
app.use(express.json());
app.use(cors(corsOptions));

console.log(process.env.MONGO_USER);


// mongoDB Function
// mongoDB Function

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.USER_KEY}@cluster0.ex2dsg0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// verify jwt
const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      error: true,
      message: "unauthorized access/ need bearer authorization code",
    });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        error: true,
        message: "unauthorized access failed to decoded",
      });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    const usersCollection = client
      .db("summer-camp-project")
      .collection("usersCollection");

    // Post user data from ragistration page
    app.post("/users", async (req, res) => {
      const data = req.body;
      const existingUser = await usersCollection.findOne({
        email: data.email,
      });
      if (existingUser) {
        return res.status(400).send({ error: "User already exists" });
      }
      const result = await usersCollection.insertOne(data);
      res.send(result);
    });
    // get user list from admin dashboard
    app.get('/usersFromAdmin/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

  // make Admin and instractors from admin dashboard
    app.patch('/changeUserRole/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// mongoDB Function
// mongoDB Function







app.get("/", (req, res) => {
  res.send("server running!");
});
app.listen(port, () => {
  console.log("running", port);
});