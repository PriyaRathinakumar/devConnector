const express = require('express');
const connectDB = require('./config/db');

const app = express();
//connect to DB 
connectDB();

//Init middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('API running')
});

app.post('/', (req, res) => {
    res.send('POST running')
});

app.use('/api/users', require('./Routes/api/users'));
app.use('/api/auth', require('./Routes/api/auth'));
app.use('/api/profile', require('./Routes/api/profile'));
app.use('/api/posts', require('./Routes/api/posts'));

app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
})