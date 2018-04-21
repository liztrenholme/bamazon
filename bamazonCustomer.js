var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "root",
    database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
});

// lets ypu leave or stay in app
function done() {
    inquirer.prompt([{
        type: "confirm",
        message: "Are you done shopping, yes or no?",
        name: "yes"
    }]).then(function(answer) {
        if (answer.yes) {
            connection.end();
        } else {
            showProducts();
        }
    })
}
function showProducts() { // displays items
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        for (var i = 0; i < response.length; i++) {
            console.log("Product Id: " + response[i].item_id + " Product Name: " +
                response[i].product_name + " Price: " + response[i].price);
        }
        inquirer.prompt([{
                type: "input",
                message: "Please enter the ID number of the item you would like to buy.",
                name: "id",
                validate: function(value) { // only lets you choose valid item numbers
                    if (isNaN(value) === false && parseInt(value) >= 2 && parseInt(value) <= 14) {
                        return true;
                    }
                    return false;
                }
            },
            {
                type: "input",
                message: "How many would you like to buy?",
                name: "quantity",
                validate: function(value) { // stops user from entering 0 or non numbers
                    if (isNaN(value) === false && parseInt(value) >= 1) {
                        return true;
                    }
                    return false;
                }
            }
        ]).then(function(answer) { // checks to see if items are available
            var query = "SELECT * FROM products WHERE ?";
            connection.query(query, { item_id: answer.id }, function(error, response) {
                if (error) throw error;
                if (response[0].stock_quantity >= answer.quantity) {
                    console.log("In stock!" + "\n");

                    // if items are available, then app updates database to reflect items purchased
                    var updateQuery = "UPDATE products SET stock_quantity = " + (response[0].stock_quantity - answer.quantity) + " WHERE item_id = " + answer.id;
                    connection.query(updateQuery, function(error, response) {
                        if (error) throw error;
                        console.log("Your order has been placed!" + "\n");
                        var selectUpdated = "SELECT * FROM products WHERE ?";
                        connection.query(selectUpdated, { item_id: answer.id }, function(error, response) {
                            if (error) throw error;
                            console.log("Your total is $" + response[0].price * answer.quantity + "\n");
                            done();
                        })
                    })
                } else { // when items are not available
                    console.log("Sorry, we only have " + response[0].stock_quantity + " available." + "\n");
                 	done();
                }
            })
        });
    })
}

showProducts();