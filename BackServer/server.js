const express = require("express");
const mongoose = require('mongoose')
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const UserModel = require('./models/User')
const ProductModel = require('./models/Product')
const OrderModel = require('./models/Orders')
const cors = require("cors")
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const randomSixDigit = () => Math.floor(100000 + Math.random() * 900000);

//setup
app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
mongoose.connect("mongodb://127.0.0.1:27017/FoodData")

// Create a transporter object using SMTP transport(email sender)
const transporter = nodemailer.createTransport({
    secure:true,
    host:'smtp.gmail.com',
    port:465,
    auth: {
      user: "email", 
      pass: "password", 
    },
  });

//api


///////////////////////////////////////////////
///////////authentication/////////////////////
///////////////////////////////////////////////
app.post('/Signup',(req,res)=>{
  console.log("Received Request:", req.body);
    const {name,email,phone,address,password} = req.body;
    const role = "user"
    const emailCheck = false
    const id = uuidv4(); 
    const emailcode = randomSixDigit();
    const fgpo = 0;
    const mailOptions = {
        to: `${email}`,
        subject: "Verify email",
        text: `your code for Verify is ${emailcode}`,
      };

      //send data to database
      UserModel.create({ name, email, password, role, id,phone,address,emailCheck,emailcode,fgpo})
    .then(UserModel =>res.json(UserModel))
    .catch(err => res.json(err))
    console.log("User Created Successfully:"); 

    //send mail 
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
      console.log("email sent"); 

 })


 app.post("/verify-email", async (req, res) => {
    const { email, emailcode } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      console.log(user)
      if (!user) {
        return res.status(404).json({ message: "Email not found!" });
      }
  
      if (user.emailCheck === 1) {
        return res.status(200).json({ message: "Email already verified!" });
      }
  
      if (user.emailcode == emailcode) {
        await UserModel.updateOne({ email }, { $set: { emailcode: null, emailCheck: true } });
  
        return res.status(200).json({ message: "Email verified successfully!" });
      } else {
        return res.status(400).json({ message: "Invalid verification code!" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error!", error });
    }
  });

  app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No record existed" });
        }

        if (user.emailCheck !== true) {
            return res.status(400).json({ message: "Email not verified" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "The password is incorrect" });
        }

        const token = user.id

        res.cookie("userId", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, 
            sameSite: "Strict",
            secure: "production", 
        });

        return res.status(200).json({ message: "Success", token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/send-reset-link", async (req, res) => {
    const { email } = req.body;

   // Email Content
    const mailOptions = {
        from: "notmoshnot@gmail.com",
        to: email,
        subject: "Password Reset Request",
        text: `Click this link to reset your password: http://localhost:3000/reset-password?email=${email}`,
      };

    try {
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "Email not found!" });
      }
  
      // Update fgpo = 1
      await UserModel.updateOne({ email }, { $set: { fgpo: 1 } });
  
      //For test only
      res.status(200).json({ message: "Reset link sent successfully!" });

  
    //   // Send Email
    //   transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //       return res.status(500).json({ message: "Error sending email", error });
    //     }
    //     res.status(200).json({ message: "Reset link sent successfully!" });
    //   });
    // } catch (error) {
    //   res.status(500).json({ message: "Server error!", error });
    // }
  } catch (error) {
    console.error("Server error:", error); // Debugging
    res.status(500).json({ message: "Server error!", error });
}
});




  app.get("/check-fgpo/:email", async (req, res) => {
    const { email } = req.params;
  
    try {
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "Email not found!" });
      }
  
      res.status(200).json({ fgpo: user.fgpo || 0 });
    } catch (error) {
      res.status(500).json({ message: "Server error!", error });
    }
  });

  app.get("/get-user-Id", (req, res) => {
    const userId = req.cookies.userId; 
    if (!userId) {
        return res.status(401).json({ message: "Not logged in" });
    }
    res.json({ userId });
});


  app.post("/change-password", async (req, res) => {
    const { email, newPassword } = req.body;
  
    try {
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "Email not found!" });
      }
  
    
      await UserModel.updateOne({ email }, { $set: { password: newPassword, fgpo: 0 } });
  
      res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Server error!", error });
    }
  });

app.post("/logout", (req, res) => {
    res.clearCookie("userId", {
        httpOnly: true,
        sameSite: "lax",
        secure: false 
    });
    res.json({ message: "User logged out and cookie deleted" });
});
//////////////////////////////////////////////////
/////////////////profile/////////////////////////
////////////////////////////////////////////////


app.get("/get-user/:id", async (req, res) => {
  try {
      const { id } = req.params; 
      const user = await UserModel.findOne({ id }).select("-password"); 

      if (!user) {
          return res.status(404).json({ message: "User not found!" });
      }

      res.status(200).json(user);
  } catch (error) {
      res.status(500).json({ message: "Server error!", error });
  }
});




app.put("/update-user/:id", async (req, res) => {
  try {
      const { id } = req.params; 
      const updateData = req.body; 

      if (updateData.password) {
          return res.status(400).json({ message: "Use change-password API to update password!" });
      }

      const updatedUser = await UserModel.findOneAndUpdate(
          { id },
          { $set: updateData },
          { new: true, projection: { password: 0 } } 
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found!" });
      }

      res.status(200).json({ message: "User updated successfully!", user: updatedUser });
  } catch (error) {
      res.status(500).json({ message: "Server error!", error });
  }
});



/////////////////////////////////////////////////////////////////////
///////////////////////////products/////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.get('/foods', async (req, res) => {
  try {
      let { page = 1, limit = 10, name, c_type, veg_non } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);
      const skip = (page - 1) * limit;

      let filter = {};
      if (name) filter.Name = new RegExp(name, 'i'); 
      if (c_type) filter.C_Type = c_type;
      if (veg_non) filter.Veg_Non = veg_non;

      const foods = await ProductModel.find(filter).skip(skip).limit(limit);
      const total = await ProductModel.countDocuments(filter);
      res.json({
          total,
          page,
          totalPages: Math.ceil(total / limit),
          data: foods
      });

  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findOne({ Food_ID: id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/////////////////////////////////////////////////////
////////////////////////cart////////////////////////
///////////////////////////////////////////////////

app.post("/orders", async (req, res) => {
  try {
    const { productId, customerId, quantity, paymentMethod } = req.body;
    const status= 'chief'
    if (!productId || !customerId || !quantity || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newOrder = new OrderModel({
      productId,
      status,
      customerId,
      quantity,
      paymentMethod
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully!", order: newOrder });
  } catch (error) {
    console.error("Order Error ❌", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


////////////////////////////////////////////////////////
////////////////dashboard//////////////////////////////
///////////////////////////////////////////////////////

app.get("/orders", async (req, res) => {
  try {
    const orders = await OrderModel.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

app.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await OrderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
});

app.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      { status: "Driver" },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

app.put("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get fields to update from request body

    const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure updates follow schema validation
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});
/*
* ✅ Fetch All Users 
*/
app.get("/users", async (req, res) => {
 try {
   const users = await UserModel.find();
   res.status(200).json(users);
 } catch (error) {
   res.status(500).json({ message: "Server Error", error });
 }
});

/** 
* ✏️ Edit (Update) a User 
*/
app.put("/users/:id", async (req, res) => {
 try {
   const { id } = req.params;
   const updateData = req.body; // New values from request body

   const updatedUser = await UserModel.findOneAndUpdate({ id }, updateData, {
     new: true, // Return the updated document
     runValidators: true, // Ensure updates follow schema validation
   });

   if (!updatedUser) {
     return res.status(404).json({ message: "User not found" });
   }

   res.status(200).json({ message: "User updated successfully", user: updatedUser });
 } catch (error) {
   res.status(500).json({ message: "Error updating user", error });
 }
});

/** 
* ❌ Delete a User 
*/
app.delete("/users/:id", async (req, res) => {
 try {
   const { id } = req.params;
   const deletedUser = await UserModel.findOneAndDelete({ id });

   if (!deletedUser) {
     return res.status(404).json({ message: "User not found" });
   }

   res.status(200).json({ message: "User deleted successfully" });
 } catch (error) {
   res.status(500).json({ message: "Error deleting user", error });
 }
});

/** 
 * ✅ Fetch All Products 
 */
app.get("/products", async (req, res) => {
  try {
    const products = await ProductModel.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

app.post("/add-product", async (req, res) => {
  try {
      const { Food_ID, Name, C_Type, Veg_Non, Describe } = req.body;

      // Validation: Check if required fields are present
      if (!Food_ID || !Name || !C_Type || !Veg_Non) {
          return res.status(400).json({ message: "All fields are required!" });
      }

      // Check if the product already exists
      const existingProduct = await ProductModel.findOne({ Food_ID });
      if (existingProduct) {
          return res.status(400).json({ message: "Product already exists!" });
      }

      // Create new product
      const newProduct = new ProductModel({ Food_ID, Name, C_Type, Veg_Non, Describe });
      await newProduct.save();

      res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
      res.status(500).json({ message: "Error adding product", error });
  }
});
/** 

/** 
 * ✏️ Edit (Update) a Product 
 */
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // New values from request body

    const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure updates follow schema validation
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
});

/** 
 * ❌ Delete a Product 
 */
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});



/////////////////////////////////////////////////////
/////////////for recommendation system//////////////
///////////////////////////////////////////////////

// ✅ Fetch User's Last Product (`Lprod`)
app.get("/user/:id/lprod", async (req, res) => {
  try {
      const { id } = req.params; 
      const user = await UserModel.findOne({ id }, "Lprod"); // Only fetch Lprod

      if (!user) {
          return res.status(404).json({ message: "User not found!" });
      }

      res.status(200).json({ Lprod: user.Lprod });
  } catch (error) {
      res.status(500).json({ message: "Server error!", error });
  }
});

// ✅ Update User's Last Product (`Lprod`)
app.put("/user/:id/lprod", async (req, res) => {
  try {
      const { id } = req.params;
      const { Lprod } = req.body;

      if (!Lprod) {
          return res.status(400).json({ message: "Lprod value is required!" });
      }

      const updatedUser = await UserModel.findOneAndUpdate(
          { id },
          { Lprod },
          { new: true } // Return updated document
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found!" });
      }

      res.status(200).json({ message: "Lprod updated successfully!", Lprod: updatedUser.Lprod });
  } catch (error) {
      res.status(500).json({ message: "Error updating Lprod", error });
  }
});
app.get("/api/product/:name", async (req, res) => {
  try {
      const productName = req.params.name;
      const product = await ProductModel.findOne({ Name: productName });

      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
  } catch (error) {
      res.status(500).json({ message: "Server error", error });
  }
});

//listen
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
