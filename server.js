const express = require("express");
const bodyParser = require("body-parser");
const marklogic = require("marklogic");
const app = express();
app.use(bodyParser.json());

const db = marklogic.createDatabaseClient({
  host: "localhost",
  port: 8000,
  user: "admin",
  password: "password",
  authType: "digest",
});

app.post("/documents", async (req, res) => {
  const { uri, content } = req.body;
  try {
    const document = await db.documents.write({
      uri,
      content: {
        ...content,
        createdDate: new Date().toISOString(),
        createdDateNumeric: Date.now(),
      },
      contentType: "application/json",
    });
    res.status(200).json(document);
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

// get in date range
app.get("/documents/date-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .send(
          "Please provide both 'startDate' and 'endDate' as numeric timestamps."
        );
    }

    const startDateNumeric = Number(startDate);
    const endDateNumeric = Number(endDate);

    const qb = marklogic.queryBuilder;

    const documents = await db.documents
      .query(
        qb.where(
          qb.range(
            qb.pathIndex("/createdDateNumeric", "long"),
            ">=",
            startDateNumeric
          ),
          qb.range(
            qb.pathIndex("/createdDateNumeric", "long"),
            "<=",
            endDateNumeric
          )
        )
      )
      .result();

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

//get one
app.get("/documents/:uri", async (req, res) => {
  try {
    const { uri } = req.params;
    console.log("getting uri: ", uri);
    const document = await db.documents.read(uri).result();
    res.status(200).json(document);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// get all
app.get("/documents", async (req, res) => {
  try {
    const documents = await db.documents
      .query(marklogic.queryBuilder.where(marklogic.queryBuilder.trueQuery()))
      .result();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.post("/documents/:uri", async (req, res) => {
  const { uri, content } = req.body;
  try {
    const document = await db.documents.write({
      uri,
      content,
      contentType: "application/json",
    });
    res.status(200).json(document);
  } catch (e) {
    res.status(500).send(res);
  }
});

app.put("/documents/:uri", async (req, res) => {
  try {
    const { uri } = req.params;
    const { content } = req.body;
    await db.documents
      .write({ uri, content, contentType: "application/json" })
      .result();
    res.status(200).send(`Document updated with URI: ${uri}`);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.delete("/documents/:uri", async (req, res) => {
  try {
    const { uri } = req.params;
    await db.documents.remove(uri).result();
    res.status(200).send(`Document deleted with URI: ${uri}`);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
