const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
require('dotenv').config();

app.use(cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
  }));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lzevybe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const booksCollection = client.db("booksDB").collection("allbooks");
    const categoryCollection = client.db("BookCategoriesDB").collection("books");
    const borrowedCollection = client.db("borrowedDB").collection("books");

    app.post('/allbooks', async(req,res) => {
        const books = req.body;
        const result = await booksCollection.insertOne(books);
        res.send(result);
    })

    app.get('/allbooks',async(req,res) => {
        const books = booksCollection.find();
        const result = await books.toArray();
        res.send(result);
    })

    app.get('/allbooks/:id', async(req,res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await booksCollection.findOne(query);
      res.send(result); 
    })

    app.patch('/allbooks/:id',async (req,res) => {
      const id = req.params.id;
      const info = req.body;
      const filter = {_id : new ObjectId(id)};
      console.log(info,filter);
      const options = { upsert: true };
      const update = {
        $set: {
          name : info.bookname,
          image : info.image,
          author : info.authorname,
          category : info.category,
          rating : info.rating
        }
      }    
      const result = await booksCollection.updateOne(filter,update,options);
      res.send(result);
    })

    // categories

    app.get('/categories',async(req,res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result); 
    })

    app.get('/books/:category',async(req,res) => {
      const category = req.params.category;
      const query = {category : category};
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // borrow reqs

    app.post('/borrowed-books', async (req,res) => {
      const info = req.body;
      console.log(req.body);
      const query = {
        _id : info._id,
        email : info.email
      }
      // console.log(query);
      const alreadyBorrowed = await borrowedCollection.findOne(query);
      if(alreadyBorrowed){
        return res.status(400).send({message : 'You have already borrowed this book'});
      }

      const filter = {
        _id : new ObjectId(info._id)
      }
      const updateQuantity = {
        $inc: { quantity: -1}
      }
      await booksCollection.updateOne(filter,updateQuantity);
      const result = await borrowedCollection.insertOne(info);
      res.send(result);
    })

    app.get('/borrowed-books',async(req,res) => {
      let query = {};
      if(req.query?.email){
        query = {email : req.query.email}
      }
      const result = await borrowedCollection.find().toArray();
      return  res.send(result);
    })

    app.delete('/borrowed-books/:id',async(req,res) => {
      const id = req.params.id;
      const query = { _id : id};
      const filter = {
        _id : new ObjectId(id)
      }
      const update = {
        $inc : {quantity : 1}
      }
      booksCollection.updateOne(filter,update);
      const result = await borrowedCollection.deleteOne(query);
      res.send(result);
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

app.get('/',(req,res) => {
    res.send('server is running');
})


app.listen(port,() => {
    console.log('server is running on',port);
})