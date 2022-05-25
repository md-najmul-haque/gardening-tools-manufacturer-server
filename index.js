const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const query = require('express/lib/middleware/query');
const { ObjectId } = require('bson')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwupg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("gardening_tools").collection("tools");
        const bookingCollection = client.db("gardening_tools").collection("bookings");
        const reviewCollection = client.db("gardening_tools").collection("reviews");
        const userCollection = client.db("gardening_tools").collection("users");

        // API to load all data
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        //API for find single tool
        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolsCollection.findOne(query);
            res.send(result);

        })
        // API to load all booking against each user
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (decodedEmail === email) {
                const query = { email: email }
                const bookings = await bookingCollection.find(query).toArray();
                res.send(bookings);
            } else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        })


        // API to load all booking against all user
        app.get('/booking', async (req, res) => {
            const query = {}
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        // To load all reviews
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // To load all users
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // API to load specific user
        app.get('/user', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const result = await userCollection.findOne(query)
            res.send(result);
        })

        // API for insert a booking
        app.post('/booking', async (req, res) => {
            const booking = req.body
            const result = await bookingCollection.insertOne(booking)
            res.send(result);
        })

        // API for add a review
        app.post('/reviews', async (req, res) => {
            const review = req.body
            const result = await reviewCollection.insertOne(review)
            res.send(result);
        })

        // API to update or insert user profile
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const userProfile = req.body
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: userProfile,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET)
            res.send({ result, token });
        })

    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Gardening Tools Manufacturer is running')
})

app.listen(port, console.log('port is listening to', port))