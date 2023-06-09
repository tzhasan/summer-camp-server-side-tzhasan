const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");


require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// console.log(process.env.PAYMENT_SECRET_KEY);
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

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
    const classCollection = client
      .db("summer-camp-project")
      .collection("classes");
    const cartCollection = client
      .db("summer-camp-project")
      .collection("StudentCarts");

    // isAdmin verify for client
    app.get("/users/admin/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    // isInstractor verify for client
    app.get("/users/instractor/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await usersCollection.findOne(query);
      const result = { instractor: user?.role === "instractor" };
      res.send(result);
    });
    // isStudent verify for client
    app.get("/users/student/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === "student" };
      res.send(result);
    });

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
    app.get("/usersFromAdmin/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get Class list from admin dashboard
    app.get("/classesFromAdmin/classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    // get Myclasses data from instructor dashboard
    app.get('/myclasses/:email', async (req, res) => { 
      const email = req.params.email
      const query = { email: email }
      const result = await classCollection.find(query).toArray();
      res.send(result);
    }) 

    // get all classes for Classes page
    app.get("/allclasses/classesPage", async (req, res) => {
      const filter = { status: "Approved" }
      const result = await classCollection.find(filter).toArray();
      res.send(result);
    });

    // get populer classes based on students number
    app.get('/popularClass', async (req, res) => { 
      const popularClasses = await classCollection
        .aggregate([
          { $sort: { enrolled: -1 } }, // Sort by enrolled number in descending order
          { $limit: 6 }, // Get the top 5 classes with the highest enrollment
        ])
        .toArray();
      res.send(popularClasses)
    })

    // get students selected classes
    app.get('/selectedClasses/:email', async (req, res) => { 
      const email = req.params.email
      const query = {
        studentEmail: email,
      };
      const result = await cartCollection.find(query).toArray()
      res.send(result);
    })

    // Delete classes from student cart
    app.delete("/deleteClassForStudent/:id", async (req, res) => {
      const id = req.params.id
      query = { courseId: id };
      const result = await cartCollection.deleteOne(query)
      res.send(result);
    });

    // Update pending class request from admin manage classes
    app.patch("/updatestatus/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await classCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // Update pending class request from admin manage classes
    app.patch("/addfeedback/admin/:id", async (req, res) => {
      const id = req.params.id;
      const { feedbackValue } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedbackValue,
        },
      };
      const result = await classCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // make Admin and instractors from admin dashboard
    app.patch("/changeUserRole/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // add classes by instructor
    app.post("/instructor/addaclass", async (req, res) => {
      const { newData } = req.body;
      const existingClass = await classCollection.findOne({
        coursename: newData.coursename,
      });
      if (existingClass) {
        return res.status(400).send({ error: "Class already exists" });
      }
      const result = await classCollection.insertOne(newData);
      res.send(result);
    });

    // add classes on cart by students
    app.post('/addtocart', async (req, res) => { 
      const course = req.body;
      const result = await cartCollection.insertOne(course);
      res.send(result);
    })

    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "aed",
        payment_method_types:['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    

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
