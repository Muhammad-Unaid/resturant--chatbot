const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

app.use(bodyParser.json());

let cart = [];

const priceList = {
  "Classic Chicken Burger": 550,
  "Classic Beef Burger": 600,
  "Crispy Zinger Burger": 650,
  "BBQ Chicken Burger": 700,
  "Club Sandwich": 300,
  "American Grilled Sandwich": 350,
  "Malai Club Sandwich": 400,
  "Fries": 200,
  "Cheese Fries": 250,
  "Coke": 100,
  "Pepsi": 100,
  "Sprite": 100,
};

// ✅ Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "unaidsaab@gmail.com", // <-- apna Gmail
    pass: "#", // <-- Gmail App Password (not Gmail password!)
  },
});

// Define the email addresses for the restaurant manager and delivery boy
const restaurantManagerEmail = "softcodix1@gmail.com"; // Replace with manager's email
const deliveryBoyEmail = "1aryankhan1100@gmail.com"; // Replace with delivery boy's email

app.post("/webhook", (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const parameters = req.body.queryResult.parameters;
  const userInput = req.body.queryResult.queryText.toLowerCase();

  let responsePayload = {};
  let responseText = "";

  // 1. Jab user item choose kare
  if (intent.includes("Intent") && parameters["menu_items"]) {
    const selectedItem = parameters["menu_items"].toLowerCase(); // Normalize to lowercase
    const formattedItem =
      selectedItem.charAt(0).toUpperCase() + selectedItem.slice(1);
    // Capitalize the first letter
    const price = priceList[formattedItem] || 0; // Get price or default to 0 if not found

    // Add item to cart (for later total calculation)
    cart.push(formattedItem);

    responseText = `✅ ${formattedItem} added to your cart. Price: Rs. ${price}. Would you like anything else?`;

    responsePayload = {
      fulfillmentMessages: [
        {
          text: {
            text: [responseText],
          },
        },
        {
          payload: {
            richContent: [
              [
                {
                  type: "chips",
                  options: [
                    {
                      text: " ✔️ Yes",
                    },
                    {
                      text: "No",
                    },
                  ],
                },
              ],
            ],
          },
        },
      ],
    };
  } 
    

  // 2. When the user says "No" (end of selection)
    else if (intent === "NoIntent") {
    if (cart.length === 0) {
      responseText = "🛒 Your cart is empty.";
      responsePayload = {
        fulfillmentText: responseText,
      };
    } else {
      let totalAmount = 0;

      let itemList = cart.map((item) => {
        const price = priceList[item] || 0;
        totalAmount += price;

        const lowerItem = item.toLowerCase();  // ✅ sirf ek baar

        // Add emoji based on item type
        let emoji = "🍽️";
        if (item.toLowerCase().includes("Classic Chicken Burger")) emoji = "🍔";
        else if (item.toLowerCase().includes("fries")) emoji = "🍟";
        else if (
          item.toLowerCase().includes("Cold Drink") ||
          item.toLowerCase().includes("coke") ||
          item.toLowerCase().includes("pepsi") ||
          item.toLowerCase().includes("sprite")
        ) emoji = "🥤";

        return `${emoji} ${item} (Rs. ${price})`;
      }).join("\n- ");

      responseText = `🧺 Here's what you've selected:\n- ${itemList}\n\n💰 Total: Rs. ${totalAmount}\n\nWould you like to confirm your order?`;

      responsePayload = {
        fulfillmentMessages: [
          {
            text: {
              text: [responseText],
            },
          },
          {
            payload: {
              richContent: [
                [
                  {
                    type: "chips",
                    options: [
                      {
                        text: "✅ Confirm Order",
                      },
                      {
                        text: "🔁 Start Again",
                      },
                    ],
                  },
                ],
              ],
            },
          },
        ],
      };
    }
  }


  // 3. Order confirmation intent (triggers next dialog to collect info)
  else if (intent === "OrderConfirmationIntent") {
    responseText = "📋 Please provide your Full Name to confirm your order.";
    responsePayload = {
      fulfillmentText: responseText,
    };
  }

  // 4. Collect customer info and send email
  else if (intent === "CollectOrderDetailsIntent") {
    const name = parameters.name;
    const phone = parameters.phone;
    const email = parameters.email;
    const address = parameters.address;

    let totalAmount = 0;
    let pricedItems = [];

    for (let item of cart) {
      const price = priceList[item] || 0;
      totalAmount += price;
      pricedItems.push(`${item} (Rs. ${price})`);
    }

    const items = pricedItems.join(", ");


const mailOptions = {
  from: "unaidsaab@gmail.com", // Sender email (your email)
  to: `${restaurantManagerEmail}, ${deliveryBoyEmail},${email}`, // Send email to both
  subject: "New Order Received", // Subject for both
  html: `
    <html>
      <body style="font-family: 'Arial', sans-serif; background-color: #fce4e4; padding: 30px 20px; text-align: center;">
        <div style="background-color:rgba(0, 0, 0, 0); border-radius: 20px; box-shadow: 0 12px 30px rgba(250, 250, 250, 0.62); padding: 40px; width: 80%; margin: 0 auto; text-align: center;">
          <!-- Logo Section -->
          <img src="https://foodsinn.co/_next/image?url=https%3A%2F%2Fconsole.indolj.io%2Fupload%2F1728388057-Foods-Inn-Original-Logo.png%3Fq%3D10&w=256&q=75" alt="FoodsInn Logo" style="max-width: 150px; margin-bottom: 20px; border-radius: 10px;">
          
          <!-- Title Section -->
          <h1 style="color: #f76c6c; font-size: 32px; font-family: 'Helvetica', sans-serif; margin-bottom: 20px; font-weight: bold;">New Order Received!</h1>
          
          <!-- Customer Information Section -->
          <p style="color: #333; font-size: 20px; margin: 5px 0;"><strong style="color: #f76c6c;">Customer Name:</strong> ${name}</p>
          <p style="color: #333; font-size: 20px; margin: 5px 0;"><strong style="color: #f76c6c;">Phone Number:</strong> ${phone}</p>
          <p style="color: #333; font-size: 20px; margin: 5px 0;"><strong style="color: #f76c6c;">Email:</strong> ${email}</p>
          <p style="color: #333; font-size: 20px; margin: 5px 0;"><strong style="color: #f76c6c;">Delivery Address:</strong> ${address}</p>
          
          <!-- Ordered Items Section -->
          <div style="text-align: left; margin-top: 20px; padding-left: 30px;">
            <p style="color: #333; font-size: 20px; margin: 5px 0; font-weight: bold;"><strong style="color: #f76c6c;">Ordered Items:</strong></p>
            <ul style="list-style-type: none; padding: 0; font-size: 18px; color: #555;">
              ${items
                .split(", ")
                .map(item => `<li style="padding: 5px 0; color: #333; font-weight: normal;"> * ${item}</li>`)
                .join("")}
            </ul>
          </div>
          
          <!-- Total Section -->
          <div style="margin-top: 30px; font-size: 24px; font-weight: bold; color: #333; background-color: #f76c6c; padding: 15px; border-radius: 10px; color: #fff;">
            <p>Total Amount: Rs. ${totalAmount}</p>
          </div>
          
          <!-- Footer Section -->
          <div style="font-size: 14px; color: #777; margin-top: 20px;">
            <p>Thank you for your order! Please prepare and deliver the order as soon as possible.</p>
          </div>
          
          <!-- Order Confirmation Footer -->
          <div style="font-size: 12px; color: #aaa; margin-top: 30px;">
            <p>Powered by <strong style="color: #f76c6c;">FoodsInn</strong> - Your Food Lover's!</p>
          </div>
        </div>
      </body>
    </html>
  `,
};




    // Send the email to both recipients
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(
          "Email sent to restaurant manager and delivery boy: " + info.response
        );
      }
    });

    cart = [];

    responsePayload = {
      fulfillmentText: `📩 Thank you ${name}, your order has been confirmed and a confirmation email has been sent to ${email}.Our rider will contact you at: ${phone} and deliver your order to: ${address}.`,
    };
  }

  // 5. Reset cart
  else if (userInput.includes("start again")) {
    cart = [];
    responseText =
      "🔄 Your cart has been cleared. You can start again by selecting items.";
    responsePayload = {
      fulfillmentText: responseText,
    };
  }

  // 6. Kuch samajh na aaye
  else {
    responseText =
      " I didn't understand❓. Please choose a menu item or say 'no'.";
    responsePayload = {
      fulfillmentText: responseText,
    };
  }

  res.json(responsePayload);
});

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Webhook server running on port ${port}`);
});

//install command
//npm init -y
//npm install express body-parser nodemailer

// first terminal >>> node index.js
//Second terminal >>> npx localtunnel --port 3000
// https://<your-url>/webhook
