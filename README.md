# blog-posts-project

I have developed this project to majorly show the backend web development.

This is a major project which includes usage of node.js, express.js, routing, multer module(for file uploads), template engines, handlebars, postgres, mongoDB, sessions and many other concepts.


The blog page shows the most recent blog posts as well as all of the categories.
By default, the details of most recent post are going to show up on this page. When user clicks on a post, the details about that particular post will appear along with titles of posts and categories.

When a category's name is clicked, the details of most recent post and titles of other posts from that category will be shown.
A user first needs to register himself to the system in order to be able to have access to create blog posts as well as categories.
When the user is successfully registered, he has to proceed to login using the same username and password.
Without even having to log into the system, the user can view all blog posts  and categories or can even filter them by modifying the query string.

  Some of the examples are:
  1. To view blog post with id 26: `/blog/26?category=`
  2. To view blog posts with category 15: `/blog?category=15`
  3. To view blog post with id 43 from category 17 :  `/blog/43?category=17`


Or even better, use the blog page itself.
The logged user has access to view all posts as well as categories and also create or remove them. Options to do both will show up once the log in is verified.
I used postgres to stores posts and categories to database. To store the user's information including passwords, mongodb was used by me.
For passwords, I hashed them using bycryptjs 3rd party module as the sensitive information should never be stored directly.

## Notes:

1. I have implemented sessions in this project. So, if the page is inactive for more than 2 minutes, the user will be logged out and he has to log in again.
2. The routes in examples will show no data if the posts with that id/category does not exist or have been removed.
3. Only those posts which are published will show on blog page.
