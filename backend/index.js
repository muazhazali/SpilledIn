const express = require('express');
const app = express();

const port = 5050;

const userRoutes = require('./routes/userRoute');
const confessionRoutes = require('./routes/confessionRoutes');
const confessionFeedRoutes = require('./routes/confessionFeedRoutes');

app.get('/', (req, res) => {
  res.send("Hello world");
})

app.use('/api/users/', userRoutes);
app.use('/api/confession/', confessionRoutes);
app.use('/api/feed/', confessionFeedRoutes);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
