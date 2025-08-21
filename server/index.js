const express = require('express');
const cors = require('cors');
const logoUpload = require('./logoUpload');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', logoUpload);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
