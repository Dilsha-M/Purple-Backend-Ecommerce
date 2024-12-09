const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
const path = require('path')
const dotenv = require("dotenv")
dotenv.config() 
const port = process.env.PORT;
const Chart = require('chart.js');



const connectDb = require('./db/db.js');
const userRoutes = require('./routes/userRoutes.js');
const adminRoutes=require('./routes/adminRoutes.js')

connectDb()

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs')
app.use(express.static('views'))
app.use(express.static(path.join(__dirname, 'public')))


app.use('/user', userRoutes);
app.use('/admin', adminRoutes);


app.get('/', (req, res) => {
    res.send('API is running...');
});


app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`);

})