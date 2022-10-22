const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running.... ^_^");
    });
  } catch (e) {
    console(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API-1
//GET LIST OF ALL STATES

//Convert To Object
const convertStatesDBObject = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesListQuery = `
  SELECT * 
    FROM state;`;

  const getStatesListResponse = await db.all(getStatesListQuery);
  response.send(
    getStatesListResponse.map((eachState) => convertStatesDBObject(eachState))
  );
});

//API 2
//GET STATE BASED ON ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesByIdQuery = `
  SELECT * 
    FROM state 
  WHERE state_id=${stateId};`;
  const getStatesListByIdResponse = await db.get(getStatesByIdQuery);
  response.send(convertStatesDBObject(getStatesListByIdResponse));
});

//API 3
//POST CREATE A DISTRICT IN DISTRICT TABLE

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
  INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

//CONVERT DISTRICT TO OBJECT
const convertDistrictDBObject = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//GET DISTRICT BASED ON ID'S
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `
  SELECT * 
    FROM district 
  WHERE 
    district_id=${districtId};`;

  const getDistrictByIdResponse = await db.get(getDistrictByIdQuery);
  response.send(convertDistrictDBObject(getDistrictByIdResponse));
});

//API-5
//DELETE DISTRICT BY ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictByIdQuery = `
    DELETE FROM 
        district
    WHERE district_id=${districtId}`;
  await db.run(deleteDistrictByIdQuery);
  response.send("District Removed");
});

//API-6
//PUT UPDATE DISTRICT IN DB BASED PROVIDED ID

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictByIdQuery = `
    UPDATE 
        district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE 
        district_id=${districtId};`;
  await db.run(updateDistrictByIdQuery);
  response.send("District Details Updated");
});

//API-7
//Returns the statistics of total cases, cured, active,
//deaths of a specific state based on state ID
//GET
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCovidStatisticsQuery = `
    SELECT sum(cases) as totalCases,
        sum(cured) as totalCured,
        sum(active) as totalActive,
        sum(deaths) as totalDeaths
    FROM 
        district
    WHERE 
        state_id=${stateId};`;

  const getCovidStatisticsResponse = await db.get(getCovidStatisticsQuery);
  response.send(getCovidStatisticsResponse);
});

//API-8
//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateByDistrictIdQuery = `
    SELECT state_id 
        FROM district
    WHERE district_id=${districtId};`;
  const getStateByDistrictIdResponse = await db.get(getStateByDistrictIdQuery);
  const getStateNameQuery = `
    SELECT state_name as stateName
        FROM state
    WHERE state_id=${getStateByDistrictIdResponse.state_id};`;
  const getStateNameResponse = await db.get(getStateNameQuery);
  response.send(getStateNameResponse);
});

module.exports = app;
