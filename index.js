const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt=require('jsonwebtoken')
const app = express();
require("dotenv").config();
const cookieParser=require('cookie-parser')
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:['http://localhost:5173','https://abashed-hydrant.surge.sh'],
    credentials:true
}))

const logger=async(req,res,next)=>{
    console.log('called',req.host,req.originalUrl)
next()
}

const verifyToken=async(req,res,next)=>{
const token=req.headers?.token;



if(!token){
    return res.status(401).send({message:'not authorized'})
}
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decode)=>{
    if(error){
        return res.status(403).send({message:'forbidden access'})
    }
    req.decode=decode;

    next()
})

}

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0x6rpk.mongodb.net/?retryWrites=true&w=majority`;


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
        // await client.connect();
        const database = client.db('foodDb');

        const foodItems = database.collection('foodItems');
        const addedItems = database.collection('addedItems');


        // auth related

        app.post('/jwt',async(req,res)=>{
            const user=req.body;
            const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
                expiresIn:'100d'
            })
            res.send({success:true,token})
        })







        // services related api

        app.post('/items', async (req, res) => {

            const newFood = req.body;
            newFood.sold=0;
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

        app.get('/items/topItems',async(req,res)=>{
            const items=await foodItems.find().sort({sold:-1}).limit(6).toArray()
            res.send(items)
        })



        app.get('/items/id/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodItems.findOne(query)
            res.send(result);
        })

        // cart items
        app.post('/carts', async (req, res) => {
            const cartProduct = req.body;

            const productDetails = await addedItems.findOne({ id: cartProduct.id, email: cartProduct.email })
            if (productDetails) {
                return res.send({ msg: 'Already Added' })
            }

            const updateFood=await foodItems.updateOne({_id:new ObjectId(cartProduct.id)},{$inc:{sold:1,quantity:-1}})
            const result = await addedItems.insertOne(cartProduct)

            res.send(result)
        })

        

        app.get('/carts',verifyToken,async(req,res)=>{
            const email=req.decode.email;
            const cursor=addedItems.find({email});
            
            const result=await cursor.toArray();
            res.send(result)
        })

        // app.get('/carts/:email',verifyToken, async (req, res) => {
            
        //     const email=req.params.email;
        //     const carts=await addedItems.find({email}).toArray()
        //     console.log(req.decode)
        //     if(!carts){
        //      return res.send([])
        //     }
        //     res.send(carts)
        //   })


          app.delete('/carts/:id/:email',async(req,res)=>{
            const id=req.params.id;
            const email=req.params.email;
            const query={id,email}
            const result=await addedItems.deleteOne(query)
            res.send(result)
          })




          // update product

    app.get('/items/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await foodItems.findOne(query)
        res.send(result)
      })
  
      app.put('/items/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const options = { upsert: true }
        const updateProduct = req.body;
        const product = {
          $set: {
            image: updateProduct.image,
            name: updateProduct.name,
            category: updateProduct.category,
            quantity: updateProduct.quantity,
            price: updateProduct.price,
            shortDescription: updateProduct.shortDescription,
            origin: updateProduct.origin,
          }
        }
  
        const result=await foodItems.updateOne(filter,product,options)
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