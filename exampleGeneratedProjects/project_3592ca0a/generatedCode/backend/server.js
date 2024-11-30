const express = require('express');
const app = express();
const sequelize = require('./src/config/database');
const routes = require('./src/routes/index');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});