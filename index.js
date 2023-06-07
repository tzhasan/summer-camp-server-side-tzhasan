const express = require("express");
const cors = require("cors");
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
 const usersCollection = client
   .db("summer-camp-project")
      .collection("usersCollection");
    
    // Post user data from ragistration page
    app.post('/users', async (req, res) => {
      
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "successfully connected to MongoDB!"
    );
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