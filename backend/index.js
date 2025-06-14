const express = require('express');
const app = express();

const port = 5050;

const userRoutes = require('./routes/userRoute');

app.get('/', (req, res) => {
  res.send("Hello world");
})

app.use('/api/users/', userRoutes);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
