const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
require('dotenv').config();

app.use(cors());


app.get('/',(req,res) => {
    res.send('server is running');
})

app.listen(port,() => {
    console.log('server is running on',port);
})