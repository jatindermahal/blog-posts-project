const Sequelize = require('sequelize');
var sequelize = new Sequelize('dfr74svhg3ds3u', 'ipogspsykhgohr', 'b3dc6930c45cda65f791e6d5d27a2f4d4f0222d70e5a8c6ccaa840799c2b6b2c', {
    host: 'ec2-34-192-83-52.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.TEXT,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = function(){
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(function () {
            resolve("success!");
        }).catch(function (error) {
            reject("unable to sync the database");
        });
    });
};

module.exports.getAllPosts = function(){
    return new Promise((resolve, reject) => {
        Post.findAll()
        .then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.getPublishedPosts = function(){
    return new Promise((resolve, reject) => {
        Post.findAll({ 
            where: { published: true }  // SQL: WHERE CLAUSE
        }).then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.getCategories = function(){
    return new Promise((resolve, reject) => {
        Category.findAll()
        .then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.addPost = function(postData){
    return new Promise((resolve, reject) => {
        for(var p in postData){
            if(postData[p] == ""){
                postData[p] = null;
            }
        }
        postData.published = (postData.published) ? true : false;
        postData.postDate = new Date();
        Post.create(postData)
        .then(function (data) {
            resolve(data); /////////////
        }).catch(function (error) {
            reject("unable to create post");
        });
    });
}

module.exports.getPostsByCategory = function(cat){
    return new Promise((resolve, reject) => {
        Post.findAll({ 
            where: { category: cat }  // SQL: WHERE CLAUSE
        }).then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.getPostsByMinDate = function(minDateStr){
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.getPostById = function(i){
    return new Promise((resolve, reject) => {
        Post.findAll({ 
            where: { id: i }  // SQL: WHERE CLAUSE
        }).then(function(data){
            resolve(data[0]);
        }).catch(function (error) {
            reject("no results returned");
        });
    });

}

module.exports.getPublishedPostsByCategory = function(categ){
    return new Promise((resolve, reject) => {
        Post.findAll({ 
            where: { 
                published: true,
                category: categ
             }
        }).then(function(data){
            resolve(data);
        }).catch(function (error) {
            reject("no results returned");
        });
    });
}

module.exports.addCategory = function(categoryData){
    return new Promise((resolve, reject) => {
        
        for(var c in categoryData){
            if(categoryData[c] == ""){
                categoryData[c] = null;
            }
        }
        
        Category.create(categoryData)
        .then(function (data) {
            resolve("success!"); 
        }).catch(function (error) {
            reject("unable to create category");
        });
    });
}


module.exports.deleteCategoryById = function(id){
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        }).then(() => {
            console.log("successsfully removed category: ", id);
            resolve(); 
        }).catch((err) => {
            reject("unable to delete category"); 
        });
    });
}

module.exports.deletePostById = function(id){
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: { id: id }
        }).then(() => {
            console.log("successsfully removed post: ", id);
            resolve(); 
        }).catch((err) => {
            reject("unable to delete post"); 
        });
    });
}