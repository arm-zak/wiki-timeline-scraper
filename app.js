import axios from "axios";
import mongoose from "mongoose";
import axiosRetry from "axios-retry";
import { EventQuestionSchema } from "common/dist/models/EventQuestion.js";

const lang = "ar";
const mongodbUser = process.env.mongo_user;
const mongodbPass = process.env.mongo_pass;
const mongodbUrl = process.env.mongo_url;
const wikipediaToken = process.env.wikipedia_token;
const start = new Date("2012-01-01");
const end = new Date("2012-12-31");
await mongoose.connect(
  `mongodb+srv://${mongodbUser}:${mongodbPass}@${mongodbUrl}/event-questions?retryWrites=true&w=majority`
);
const EventQuestionModel = mongoose.model(
  "EventQuestionModel",
  EventQuestionSchema,
  lang
);
const config = {
  headers: {
    Authorization: "Bearer " + wikipediaToken,
    "Api-User-Agent": "wiki-timeline (armin.zakeri@gmail.com)",
  },
};

axiosRetry(axios, { retries: 3 });
let loop = new Date(start);
while (loop <= end) {
  const day = loop.getDate();
  const month = loop.getMonth() + 1;
  const response = await axios.get(
    `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/all/${month}/${day}`,
    config
  );
  const selectedEvents = response.data.selected;
  selectedEvents.forEach((event) => {
    let newEntry = new EventQuestionModel({
      text: event.text,
      year: event.year,
      wikipediaSchema: "selected",
    });
    newEntry.save();
  });
  const regularEvents = response.data.events;
  regularEvents.forEach((event) => {
    let newEntry = new EventQuestionModel({
      text: event.text,
      year: event.year,
      wikipediaSchema: "events",
    });
    newEntry.save();
  });
  console.log(
    loop +
      ": " +
      selectedEvents.length +
      " selected, " +
      regularEvents.length +
      " regular"
  );
  const newDate = loop.setDate(loop.getDate() + 1);
  loop = new Date(newDate);
}
process.exit();
