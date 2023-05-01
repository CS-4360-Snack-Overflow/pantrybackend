/**
 * @fileoverview This file contains the definition of a controller that manages the data and behavior of "Pantry" a web application.
 *
 * 
 * This controller is responsible for handling any recipe user interactions with Pantry , such as CRUD operations and form submissions.
 * It also manages the data that is displayed in the application, making requests to the server for updates and responding to user input.
 * 
 * 
 * External dependencies:
 *  - Recipe - Food - Nutrition 
 *      (https://rapidapi.com/spoonacular/api/recipe-food-nutrition/details)
 *  - Tasty
 *      (https://rapidapi.com/apidojo/api/tasty/details)
 * 
 * 
 * @author Snack Overflow
 */

const Recipe = require('../models/recipe');
const User = require('../models/user')
const session = require('express-session');
const fs = require("fs");
const path = require('path');
const cloudinary = require('cloudinary')
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});
/**
 * Retrieves a list of recipes from the backend server.
 *
 * @function
 * @name recipe_index
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 *
 * @throws {Error} Throws an error if the server request fails or if the recipe list cannot be returned.
 *
 * This function does not have a return value, but it sends the recipe list back to the client in the response object.
 */
const recipe_index = (req, res) => {


/**
 * Tailor search results by filtering ingredients and selecting from a variety of display options.
 * 
 * @function
 * @name retrieveRecipes
 * 
 * @param {array, string} parameters - Used to create expressions and query the database.
 * @param {string} filter - The display option.
 * 
 * @returns {array} The list of recipes.
 */
    const retrieveRecipes = (parameters, filter) => {
        let recipes;
        if(!parameters){
            recipes = Recipe.find();
        }

        else if(typeof(parameters) === "string") {
            const param = RegExp(parameters, "i")
            console.log(param)
            recipes = Recipe.find({$or: [{ingredients:param}, {name:param}, {tags: param}]})
        }
        else {
            let regexp = [];
            for(let i = 0; i < parameters.length; i++) {
                const param = RegExp(parameters[i], "i")
                regexp.push({$or: [{name: param}, {tags: param}, {ingredients: param}]})
            }
            recipes = Recipe.find({$and : regexp});
        }
        switch(filter){
        case "Popular":
            recipes = recipes.sort({total_reviews: -1});
        case "Recent":
            recipes = recipes.sort({updatedAt: -1});
        case "Highly Rated":
            recipes = recipes.sort({review: -1});
        default:
            recipes = recipes.sort({name: 1});
        }
        return recipes
    }
    retrieveRecipes(req.query.parameter, req.query.filter).then((result) => {
        res.send(result);
    })
    .catch((err) => {
        console.log(err);
    });
};


/**
 * This function retrieves the details of a recipe with a specified ID from a database.
 * 
 * @function
 * @name recipe_details
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * @throws {Error} Throws an error if the server request fails or if the recipe details cannot be returned.
 * 
 * This function does not have a return value, but it sends the recipe details back to the client in the response object.
 */
const recipe_details = (req, res) => {
    const id = req.params.id;
    Recipe.findById(id)
    .then((result) => {
        res.send(result);
    }).catch((err) => {
        console.log(err);
    });
};


/**
 * This function creates a new recipe in a database based on data provided in an HTTP request.
 * 
 * @function
 * @name recipe_create_post
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * @throws {Error} Throws an error if the server request fails or if the new recipe cannot be saved in a database.
 * 
 * This function does not have a return value, but it redirects to index as a response back to the client indicating whether the recipe creation operation was successful.
 */
const recipe_create_post = (req, res) => {
    const recipe = new Recipe({
        name: req.body.name,
        video_url: req.body.video_url,
        alt_image_url: req.body.alt_image_url,
        num_servings: req.body.num_servings,
        prep_time: req.body.prep_time,
        credits: req.session.name,
        cook_time: req.body.cook_time,
        description: req.body.description,
        nutrition: req.body.nutrition,
        user_ratings: {
            count_positive: 0,
            count_negative: 0
        },
        review: 0,
        tags: req.body.tags,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions,
        user_num: req.session.userId
    })
    console.log(req.session.userId)
    recipe.save()
    .then((result) => {
        res.redirect('/');
    })
    .catch((err) => {console.log(err)})
};


/**
 * This function deletes a recipe with a specified ID from a database.
 * 
 * @function
 * @name recipe_delete
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * @throws {Error} Throws an error if the server request fails or if the recipe cannot be deleted.
 * 
 * This function does not have a return value, but it redirects back to index as a response back to the client indicating whether the recipe deletion operation was successful.
 */
const recipe_delete = (req, res) => {
    const id = req.params.id;
    Recipe.findByIdAndRemove({_id: id})
    .then((result) => {
        //ajax request from browser, js not web form, so no redirect
        //send back json to browser
        res.json({ redirect: '/recipes'});
    })
    .catch((err) => {
        console.log(err)
    });
};


/**
 * This function updates a recipe's information in the database based on data provided in an HTTP request.
 * 
 * @function
 * @name recipe_patch
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * @throws {Error} Throws an error if the server request fails or if the recipe cannot be updated.
 * 
 * This function does not have a return value, but it sends the recipe details back to the client in the response object.
 */
const recipe_patch = (req, res) => {
    let recipe = Recipe.findById({id: req.params.id})
    console.log(req.body)
    Recipe.findOneAndUpdate({_id: req.params.id}, req.body, {new: true})
    .then((result) => {
        res.send(result);
    })
    .catch((err) => {
        console.log(err)
    });
};


/**
 * This function handles the uploading of an image for a recipe by generating a file path 
 * based on the server's directory and initial path.
 * 
 * @function
 * @name recipe_upload_image
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * @throws {Error} Throws an error if the server path and new file path cannot be linked.
 * 
 * This function returns a JSON response containing the path of the uploaded image.
 */
const recipe_upload_image = (req, res) => {
    async function uploadToCloud(image_path){
    try {
        const result = await cloudinary.uploader.upload(image_path, (error) => {console.log(error)})
                    .catch((err) => {console.log(err)});
        fs.unlink(req.file.path, ()=>{})
        return result.secure_url
    } catch(error) {
        console.log(error)
    }
    }  
    const url = uploadToCloud(req.file.path)
    return res.json({"url": url})
}
 

/**
 * This function finds all the recipes in the database with the user number specified in the request session.
 * 
 * @function
 * @name recipe_get_created
 * 
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * 
 * This function does not have a return value, but it sends the recipe a list of recipes belonging to specific user back to the client in the response object.
 */
const recipe_get_created = (req, res) => {
    async function retrieveCreated(){
        let recipes = []
        await Recipe.find({user_num : req.session.userId})
        .then((result) => {
            recipes = result
        })
        return recipes
    } 
    retrieveCreated().then((results) => res.send(results))
}

const recipe_get_favorited = (req, res) => {
    async function retrieveFavorites(){
        let recipes = []
        await User.findById(req.session.userId)
        .then(async (user) => {
            console.log(user)
            if(user) {
                recipes = await Recipe.find({ _id: { $in: user.favoriteRecipes } })
            }
        }).catch((err) => {
            console.log(err)
        })
        return recipes
    }
    
    retrieveFavorites().then((results) => res.send(results))
} 

module.exports = {
    recipe_index,
    recipe_details,
    recipe_create_post,
    recipe_delete,
    recipe_patch, 
    recipe_upload_image,
    recipe_get_created, 
    recipe_get_favorited
};