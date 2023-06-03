import express from "express";
import path from "path"
import mongoose, { mongo } from "mongoose";
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

//connecting database
mongoose.connect("mongodb://localhost:27017", {dbName: "backend"})
.then(()=> console.log("databse connected"))
.catch((e)=> console.log(e))


//creating schema for database
const userSchema = new mongoose.Schema({
    name:String, 
    email: String,
    password: String,
})

//creating model for database
const User = mongoose.model("users", userSchema)

//creating express server/app
const app = express()



//Using Middlewares
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({extended: true}))       //to view the form data in console we'll need to use this middleware
app.use(cookieParser())




//function for checking if user is logged in or not
const isAuthenticated = async(req, res, next)=>{
    //console.log(req.cookies)

    const {token} = req.cookies     //i.e. const token = req.cookies.token  //gives value of given keyname(ie.token)
    
    if(token){                      //that means already logged in
        
        //decoding idToken
        const decoded = jwt.verify(token, "sfbdsfjbsfjsn")              //here token (ie. key) will give the idToken(ie. jwt) as value
        //console.log(decoded)

        req.user = await User.findById(decoded._id)         //can access information of loggedIn user by req.user in this & all the handlers called after it in get."/"
        console.log(req.user)

        next()                       //program execution moves to next handler
    }
    else{
        res.redirect("/login")
    }
}




app.get("/", isAuthenticated, (req, res)=> {
    // res.redirect("/")   
    res.render("logout.ejs", {name: req.user.name})
})

//Login routing
app.get("/login", (req, res)=> {
    // res.redirect("/")   
    res.render("login.ejs")
})

//Register routing
app.get("/register", (req, res)=> {
    // res.redirect("/")   
    res.render("register.ejs")
})

//register and cookie creation when /register
app.post("/register", async(req, res)=> {

    //console.log(req.body)            //consoles data filled in form

    let user = await User.findOne({email: req.body.email})
    if(user){
        return res.redirect("/login")
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    //Creating document i.e. user is saved in database
    user = await User.create({   
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    })
    console.log(user._id)  //consoles user id of user saved in database


    //encoding user id
    const idToken = jwt.sign({_id: user._id}, "sfbdsfjbsfjsn")
    

    //creating & sending cookie as a response
    res.cookie("token", idToken, {
        httpOnly: true,
        expires: new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})


app.post("/login", async(req, res)=> {
    const { email, password} =  req.body

    let user = await User.findOne({email})
    
    if(!user){
        return res.redirect("/register")
    }

    // const isMatch = user.password === password

    //if hashed password
    const isMatch = await bcrypt.compare(password, user.password)


    if(!isMatch) return res.render("login.ejs", {email, passwordError: "Incorrect password"})

    const idToken = jwt.sign({_id: user._id}, "sfbdsfjbsfjsn")

    res.cookie("token", idToken, {
        httpOnly: true,
        expires: new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})


//logout and cookie expires when /logout
app.get("/logout", (req, res)=> {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/")
})




/*View users json data saved in array on /users page
app.get("/users", (req, res)=> {  
    // res.send("<h1>users data</h1>")
    res.json({users})
    
})*/


/*M2 step 2
app.get("/success", (req, res)=> {res.render("success.ejs")})
*/

//adding data to database - sample
// app.get("/add", (req, res)=> {
//     Msg.create({name: "Abhi", email: "singh@gmail.com"})                   //creates a document in database
//     .then(res.render("success.ejs", {name: "your data has been added to database"}))       //renders success page after data is saved in database
// })

//Adding user given form data to database
// app.post('/submit', async(req, res)=> {
//     await Msg.create({name: req.body.name, email: req.body.email})
//     res.redirect("/")      //M2 step 1
//     // alert("Form submitted")
// })


/* const users = []    //array
app.post("/submit", (req, res)=> {
    console.log(req.body)
    //saving it to array
    users.push({username: req.body.name, email: req.body.email})  
    // res.render("success.ejs")   // M1        /submit url mai hi render hojayega success component/module
    res.redirect("/success")    // M2 step 1    submit hone ke baad redirect to new url i.e. /success --> if you want new /url after form submitting then use this 
    // res.redirect('https://google.com')
    
})
*/


app.listen(5000, ()=>{
    console.log("server is running")
})