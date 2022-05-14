var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
const res = require("express/lib/response");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
var app = express();
const path = require('path');
const blogService = require('./blog-service');
const authData = require('./auth-service');
const clientSessions = require("client-sessions");


app.use(express.urlencoded({ extended: false }));///////////////true?

app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});


app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: { 
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(context){
            return stripJs(context);
        },
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }        
    }
}));

app.set('view engine', '.hbs');

app.use(function(req,res,next){
    let route = req.path.substring(1); app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
}

cloudinary.config({
    cloud_name: 'dhnly9gcu',
    api_key: '839364344367154',
    api_secret: 'vB16835K07enAF9EgQXvyWavbp0',
    secure: true
});

const upload = multer(); 
 

app.use(express.static('public'));

app.get("/", function(req, res){
    res.redirect('/blog');
});

app.get("/about", function(request, res) {
    res.render('about', {
        //layout: false 
    });
})

app.get("/posts/add",ensureLogin,function(req,res){
    blogService.getCategories().then((data)=>{
        res.render("addPost", {categories: data});
    })
    .catch((error)=>{
        res.render("addPost", {categories: []}); 
    });
})

app.get("/categories/add",ensureLogin,function(req,res){
    res.render('addCategory', {
        //layout: false 
    });
})

app.post("/categories/add",ensureLogin,function(req,res){
    let categoryData = {
        //"id": req.body.id,
        "category": req.body.category
      }

      blogService.addCategory(categoryData).then((data=>{
        res.redirect('/categories');
    })).catch(err=>{
        res.json({message: err});
    });
})

///routes uses middleware
app.post("/posts/add",ensureLogin, upload.single("featureImage"),function(req,res){
    
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            (error, result) => {
                if (result) {
                resolve(result);
                } else {
                reject(error);
                }
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };
    async function upload(req) {
        let result = await streamUpload(req)
        .catch((err)=>{err.message});
        console.log(result);
        return result;
    }
    upload(req).then((uploaded)=>{

        try{
        req.body.featureImage = uploaded.url;
        }
        catch(ex){
            console.log(ex.message);
            req.body.featureImage = "[Images Not Uploaded in Demo]";
        }
        // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
        const FormData = req.body;
        blogService.addPost(FormData).then((data)=>{
            res.redirect('/posts');
        })
        .catch((err)=>{
            res.send("message: "+ err.message);
        });
        
    });
    
})



app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = { post: { }, posts: [ ] };

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    //console.log(viewData.post);
    res.render("blog", {data: viewData})

});


app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await blogService.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});


app.get("/posts",ensureLogin,function(req,res){

    if(req.query.category){
        blogService.getPostsByCategory(req.query.category).then((data)=>{
            if(data.length>0){
                res.render("posts", { posts: data });
            }
            else{
                res.render("posts",{ message: "no results" });
            }
            
        })
        .catch((err)=>{
            res.render("posts", {message: "no results"});
        });
    }
    else if(req.query.minDate){
        blogService.getPostsByMinDate(req.query.minDate).then((data)=>{
            if(data.length>0){
                res.render("posts", { posts: data });
            }
            else{
                res.render("posts",{ message: "no results" });
            }
        })
        .catch((err)=>{
            res.render("posts", {message: "no results"});
        });
    }
    else{
        blogService.getAllPosts().then((data)=>{
            if(data.length>0){
                res.render("posts", { posts: data });
            }
            else{
                res.render("posts",{ message: "no results" });
            }
        })
        .catch((err)=>{
            res.render("posts", {message: "no results"});
        });
    }
    
    
})

app.get("/post/:value",ensureLogin,function(req,res){

    blogService.getPostById(req.params.value).then((data)=>{
        data ? res.json(data): res.send("No post with id: " + req.params.value + " exists");
    })
    .catch((err)=>{
        res.send("message: "+ err);
    });
})


app.get("/categories",ensureLogin,function(req,res){
    blogService.getCategories().then((blog)=>{
        if(blog.length > 0){
            res.render("categories", {categories: blog});
        }
        else{
            res.render("categories", {message: "no results"});
        }
    })
    .catch((error)=>{
        res.render("categories", {message: "no results"});
    });
})

app.get("/categories/delete/:id",ensureLogin,function(req,res){

    blogService.deleteCategoryById(req.params.id).then(()=>{
        res.redirect('/categories'); 
    })
    .catch((err)=>{
        res.status(500).send("Unable to Remove Category / Category not found");
    });
})

app.get("/posts/delete/:id",ensureLogin,function(req,res){

    blogService.deletePostById(req.params.id).then(()=>{
        res.redirect('/posts'); 
    })
    .catch((err)=>{
        res.status(500).send("Unable to Remove Post / Post not found");
    });
})

app.get('/login',(req,res)=>{
    res.render("login");
})

app.get('/register',(req,res)=>{
    res.render("register"/*, { layout: false }*/);
})

app.post('/register',(req,res)=>{
    authData.registerUser(req.body)
    .then(()=>{
        res.render("register",{successMessage: "User created"})
    }).catch((err)=>{
        res.render("register",{errorMessage: err, userName: req.body.userName});
    }); 
})

app.post('/login',(req,res)=>{
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
    .then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        
    res.redirect('/posts');
    }).catch(err=>{
        res.render("login",{errorMessage: err, userName: req.body.userName});
    })
})

app.get('/logout',(req,res)=>{
    req.session.reset();
    res.redirect('/');
})

app.get('/userHistory', ensureLogin, (req,res)=>{
    res.render("userHistory");
})

app.use((req, res) => {
    res.status(404).render("404");
});

// setup http server to listen on HTTP_PORT
blogService.initialize()
.then(authData.initialize)
.then(()=>
{
    app.listen(HTTP_PORT, function () {
             console.log("app listening on: " + HTTP_PORT);
    });
})
    .catch((err)=>{
        console.log("unable to start server: " + err);
});
