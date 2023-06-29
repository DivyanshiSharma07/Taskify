require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})
const List = mongoose.model("List", listSchema);


const defaultItems = [
  { name: "Welcome to your Diary" },
  { name: "Click + to create new entry" },
  { name: "Hit this to delete an item" }
];

async function main() {
  try {
    await mongoose.connect("mongodb+srv://divyanshijha2002:eMsiXyO4m9KfVV5f@todo-vercel.3swcrgn.mongodb.net/?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

main().then(() => {
  app.get("/", async function (req, res) {
    try {
      const foundItems = await Item.find({});
      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems);
        console.log("Default items inserted successfully.");
        res.redirect("/"); 
      } else {
        res.render("list", {
          listTitle: "Today",
          newlistItems: foundItems
        });
      }
    } catch (error) {
      console.error("Error inserting default items:", error);
    }
  });

  app.post("/", async function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item  = new Item({
      name : itemName
    })
    
  try {
    if (listName === "Today") {
      // Add the item to the default list
      await item.save();
      res.redirect("/");
    } else {
      // Find the custom list and add the item to it
      const foundList = await List.findOne({ name: listName });
      
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("Custom list not found");
        res.redirect("/");
      }
    }
  } catch (error) {
    console.error("Error adding new item:", error);
    res.status(500).send("Internal Server Error");
  }
});
   


app.post("/delete", async function(req, res) {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      // Remove the item from the default list
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Item removed successfully.");
      res.redirect("/");
    } else {
      // Remove the item from the custom list
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      console.log("Item removed successfully from the custom list.");
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    // Find or create the custom list based on the list name
    const foundList = await List.findOne({ name: customListName });

    if (foundList) {
      // If the list already exists, render the list view
      res.render("list", {
        listTitle: foundList.name,
        newlistItems: foundList.items
      });
    } else {
      // If the list doesn't exist, create a new list and save it
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();

      console.log("Custom list created successfully.");
      res.redirect("/" + customListName); // Redirect to the newly created list
    }
  } catch (error) {
    console.error("Error creating or finding custom list:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
}).catch((err) => console.log(err))