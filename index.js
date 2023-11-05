const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())




const uri = "mongodb+srv://food:A85W7cPqaOK7rZUd@cluster0.d0x6rpk.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db('foodDb');

        const foodItems = database.collection('foodItems');
        const addedItems = database.collection('addedItems');



        app.post('/items', async (req, res) => {

            const newFood = req.body;

            const result = await foodItems.insertOne(newFood);
            res.send(result)
        })




        app.get('/itemsCount', async (req, res) => {

            const count = await foodItems.estimatedDocumentCount()
            res.send({ count })
        })




        app.get('/items', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size)

            const result = await foodItems.find()
                .skip(page * size)
                .limit(size)
                .toArray()
            res.send(result)

        })



        app.get('/items/id/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodItems.findOne(query)
            res.send(result)
        })

        // cart items
        app.post('/carts', async (req, res) => {
            const cartProduct = req.body;
            const productDetails = await addedItems.findOne({ id: cartProduct.id, email: cartProduct.email })
            if (productDetails) {
                return res.send({ msg: 'Already Added' })
            }

            const result = await addedItems.insertOne(cartProduct)
            res.send(result)
        })

        app.get('/carts',async(req,res)=>{
            const cursor=addedItems.find();
            const result=await cursor.toArray();
            res.send(result)
        })

        app.get('/carts/:email', async (req, res) => {
            // const cursor =await addCartCollection.find();
            const email=req.params.email;
            const carts=await addedItems.find({email}).toArray()
            // const result = await cursor.toArray();
            if(!carts){
             return res.send([])
            }
            res.send(carts)
          })


          app.delete('/carts/:id/:email',async(req,res)=>{
            const id=req.params.id;
            const email=req.params.email;
            const query={id,email}
            const result=await addedItems.deleteOne(query)
            res.send(result)
          })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})