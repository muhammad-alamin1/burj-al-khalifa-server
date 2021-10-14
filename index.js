const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

// console.log(process.env.DB_PASS)
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.msfnz.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// add firebase admin
var serviceAccount = require("./burj-al-khalifa-21526-firebase-adminsdk-qjj5a-b2afae4b9c.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


client.connect(err => {
    const collection = client.db(`${process.env.DATABASE_NAME}`).collection(`${process.env.DATABASE_COLLECTION_NAME}`);
    console.log('Database connected successfully');

    // Create 
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then((result) => {
                // console.log(result);
                res.send(result.insertedCount > 0);
            })
        // console.log(newBooking);
    })

    // Read data to show UI
    app.get('/bookings', (req, res) => {
        // console.log(req.query.email);
        console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log(idToken);

            // idToken comes from the client app
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    console.log(tokenEmail, queryEmail);
                    if (tokenEmail == req.query.email) {
                        collection.find({ email: req.query.email })
                            .toArray((error, documents) => {
                                res.status(200).send(documents);
                                console.log(documents)
                            })
                    }
                    else {
                        res.status(401).send('Un-authorization access');
                    }
                })
                .catch((error) => {
                    res.status(401).send('Un-authorization access');
                });
        }
        else {
            res.status(401).send('Un-authorization access');
        }
    })

});


app.get('/', (req, res) => {
    res.send('Hello');
})

app.listen(port, () => {
    console.log(`app listen at http://localhost:${port}`)
})
