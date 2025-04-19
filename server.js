const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let reminders = [];

app.get('/reminders', (req, res) => res.json(reminders));

app.post('/reminders', (req, res) => {
  const reminder = { ...req.body, _id: Date.now().toString() };
  reminders.push(reminder);
  res.status(201).json(reminder);
});

app.listen(3000, () => console.log('Server running on port 3000'));
