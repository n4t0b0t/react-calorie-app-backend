const app = require("../app");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const request = require("supertest");

// DON'T FORGET TO TEST ERROR HANDLERS AND VALIDATIONS!

describe("main CRUD tests", () => {
  let connection;
  let db;

  beforeAll(async () => {
    const mongoURI = global.__MONGO_URI__;
    console.log(mongoURI);
    connection = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true
    });
    const uriArray = mongoURI.split("/");
    const dbName = uriArray[uriArray.length - 1];
    db = await connection.db(dbName); // dbName is jest!
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await connection.close();
  });

  beforeEach(async () => {
    await db.dropDatabase();
  });

  // TESTING USER PROFILE CRUD API CALLS
  describe("routes/users", () => {
    const userTestData = [
      {
        username: "fakeUser1",
        password: "password1",
        email: "fakeUser1@gmail.com"
      },
      {
        username: "fakeUser2",
        password: "password2",
        email: "fakeUser2@gmail.com"
      }
    ];

    const fieldToUpdate = {
      email: "myNewEmail@gmail.com"
    };

    it("GET /users should return list of users", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(userTestData);
      const response = await request(app).get("/users");
      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toEqual(true);
      expect(response.body.length).toEqual(2);
    });

    it("POST /users should create a new user", async () => {
      const response = await request(app)
        .post("/users")
        .send(userTestData[0]);
      const userDbInstance = db.collection("users");
      const newUser = await userDbInstance.findOne({
        username: userTestData[0].username
      });
      expect(response.status).toEqual(201);
      expect(response.body.username).toEqual(newUser.username);
      expect(response.body.email).toEqual(newUser.email);
    });

    it("POST /users with incomplete body should fail", async () => {
      const incompleteData = {
        username: "BogusUsername"
      };
      const response = await request(app)
        .post("/users")
        .send(incompleteData);
      const userDbInstance = db.collection("users");
      const newUser = await userDbInstance.findOne({
        username: "BogusUsername"
      });
      expect(response.status).toEqual(500);
      expect(newUser).toBeFalsy();
    });

    it("POST /user with non-unique username should fail", () => {});

    it("DELETE /users/:username should delete a user", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(userTestData);
      const response = await request(app).delete(
        `/users/${userTestData[0].username}`
      );
      const deletedUser = await userDbInstance.findOne({
        username: userTestData[0].username
      });
      expect(response.status).toEqual(200);
      expect(response.body.username).toEqual(userTestData[0].username);
      expect(deletedUser).toBeFalsy();
    });

    it("DELETE /users/:username for a non-existent user should return 400 bad request", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(userTestData);
      const username = "mumbojumbo";
      const response = await request(app).delete(`/users/${username}`);
      expect(response.status).toEqual(400);
    });

    it("PUT /users/:username should update the user", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(userTestData);
      const response = await request(app)
        .put(`/users/${userTestData[0].username}`)
        .send(fieldToUpdate);
      const updatedUser = await userDbInstance.findOne({
        username: userTestData[0].username
      });
      expect(response.status).toEqual(200);
      expect(response.body.email).toEqual(fieldToUpdate.email);
      expect(response.body.email).toEqual(updatedUser.email);
    });

    it("PUT /users/:username for a non-existent user should return 400 bad request", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(userTestData);
      const username = "mumbojumbo";
      const response = await request(app)
        .put(`/users/${username}`)
        .send(fieldToUpdate);
      expect(response.status).toEqual(400);
    });
  });

  // TESTING INDIVIDUAL USER FOODLOG CRUD API CALLS
  describe("routes/users/:username/foodlog", () => {
    const mealTestData = [
      {
        username: "fakeUser1",
        password: "password1",
        email: "fakeUser1@gmail.com",
        foodLog: [
          {
            date: new Date("2019-06-30").getTime(),
            meals: [
              {
                _id: "41224d776a326fb40f000001",
                meal: "breakfast",
                item: "oatmeal",
                calories: 50
              },
              { meal: "breakfast", item: "apple", calories: 25 },
              { meal: "lunch", item: "ban mian", calories: 500 }
            ]
          },
          {
            date: new Date("2019-07-01").getTime(),
            meals: [
              { meal: "breakfast", item: "banana", calories: 50 },
              { meal: "lunch", item: "ban mian", calories: 500 }
            ]
          }
        ]
      },
      {
        username: "fakeUser2",
        password: "password2",
        email: "fakeUser2@gmail.com",
        foodLog: [
          {
            date: new Date("2019-07-02").getTime(),
            meals: [
              { meal: "breakfast", item: "apple", calories: 25 },
              { meal: "breakfast", item: "cereal", calories: 120 }
            ]
          }
        ]
      }
    ];

    it("GET /users/:username/foodlog should return the entire user foodlog", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const response = await request(app).get(
        `/users/${mealTestData[0].username}/foodlog`
      );
      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(mealTestData[0].foodLog.length);
    });

    it("GET /users/:username/foodlog/:date should return the specific date from the foodlog", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-06-30";
      const response = await request(app).get(
        `/users/${mealTestData[0].username}/foodlog/${queryDate}`
      );
      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(
        mealTestData[0].foodLog[0].meals.length // need to improve test logic
      );
    });

    it("GET /users/:username/foodlog/:date should return error for non-existent date", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-05-30";
      const response = await request(app).get(
        `/users/${mealTestData[0].username}/foodlog/${queryDate}`
      );
      expect(response.status).toEqual(400);
    });

    it("GET /users/:username/foodlog/:date?meal=breakfast should return all breakfast meals from the date's daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-06-30";
      const response = await request(app).get(
        `/users/${mealTestData[0].username}/foodlog/${queryDate}?meal=breakfast`
      );
      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(2); // hard-coded - need to improve test logic!
    });

    it("GET /users/:username/foodlog/:date?meal=breakfast&item=apple should return all breakfast meals containing apple from the date's daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-06-30";
      const response = await request(app).get(
        `/users/${
          mealTestData[0].username
        }/foodlog/${queryDate}?meal=breakfast&item=apple`
      );
      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(1); // hard-coded - need to improve test logic!
    });

    it("POST /users/:username/foodlog/:date should add a meal to an existing daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-07-02";
      const queryTime = new Date(queryDate).getTime();
      const mealToAdd = { meal: "dinner", item: "ramen", calories: 450 };
      const response = await request(app)
        .post(`/users/${mealTestData[1].username}/foodlog/${queryDate}`)
        .send(mealToAdd);
      const filteredResponse = response.body.foodLog.find(
        element => element.date === queryTime
      );
      const foundDate = await userDbInstance.findOne({
        username: mealTestData[1].username,
        "foodLog.date": queryTime
      });
      const dailyLog = foundDate.foodLog.find(
        element => element.date === queryTime
      );
      expect(response.status).toEqual(201);
      expect(filteredResponse.meals.length).toEqual(dailyLog.meals.length);
    });

    it("POST /users/:username/foodlog/:date should add a meal to a created daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertMany(mealTestData);
      const queryDate = "2019-05-30";
      const mealToAdd = { meal: "dinner", item: "soba", calories: 550 };
      const response = await request(app)
        .post(`/users/${mealTestData[1].username}/foodlog/${queryDate}`)
        .send(mealToAdd);
      const foundUser = await userDbInstance.findOne({
        username: mealTestData[1].username
      });
      const foundDate = foundUser.foodLog.find(
        element => element.date === new Date(queryDate).getTime()
      );
      expect(response.status).toEqual(201);
      expect(foundDate.meals.length).toEqual(1);
      expect(foundDate.meals[0].item).toEqual(mealToAdd.item);
    });

    it.only("DELETE /users/:username/foodlog/:id should delete a meal from daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertOne(mealTestData[0]);
      // .then(result => console.log(result.ops[0].foodLog[0].meals[0]));
      const queryDate = "2019-06-30";
      const queryId = "41224d776a326fb40f000001";
      const response = await request(app).delete(
        `/users/${mealTestData[0].username}/foodlog/${queryDate}/${queryId}`
      );
      expect(response.status).toEqual(200);
      expect(
        response.body.foodLog.find(
          element => element.date === new Date(queryDate).getTime()
        ).meals.length
      ).toEqual(2); // hard-coded - need to improve test logic!
    });

    it("PUT /users/:username/foodlog/:id should update a meal from daily log", async () => {
      const userDbInstance = db.collection("users");
      await userDbInstance.insertOne(mealTestData[0]);
      const queryDate = "2019-06-30";
      const queryId = "41224d776a326fb40f000001";
      const updatedItem = {
        meal: "breakfast",
        item: "wonton mee",
        calories: 200
      };
      const response = await request(app)
        .put(
          `/users/${mealTestData[0].username}/foodlog/${queryDate}/${queryId}`
        )
        .send(updatedItem);
      console.log(response.body.foodLog[0]);
      expect(response.status).toEqual(200);
      expect(
        response.body.foodLog.find(
          element => element.date === new Date(queryDate).getTime()
        ).meals.length
      ).toEqual(3); // hard-coded - need to improve test logic!
    });
  });
});
