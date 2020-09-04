const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');

const auth = require('../middleware/auth');

const router = new express.Router();

router.get('', auth, async (req, res) => {
    try {
        const users = await User.find({})
        res.status(200).send(users)
    }
    catch (e) {
        res.status(500).send();
    }
})

router.post('', async (req, res) => {
    const user = new User({
        name: req.body.name,
        age: req.body.age,
        email: req.body.email,
        password: req.body.password
    });
    try {
        await user.save()
        const token = await user.generateJwt();
        res.status(201).send({user, token})
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    if (userId) {
        try {
            const userData = await User.findById(userId);
            if (!userData) {
                res.status(404).send("User not found");
                return;
            }
            res.status(200).send(userData);
        }
        catch (e) {
            res.status(500).send(e);
        }
    }
    else {
        res.status(400).send("Invalid request")
    }
})

router.patch('/:id', async (req, res) => {
    const userId = req.params.id;
    try{
        const user = await User.findById(userId);
        console.log(user);
        //const user = await User.findByIdAndUpdate(userId, req.body, {new: true, runValidators: true})
        if(!user){
            res.status(404).send("No Data found");
            return;
        }
        for(var key in req.body){
            user[key] = req.body[key]
        }
        await user.save();
        res.status(200).send(user);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
            res.status(404).send("No User found");
            return;
        }
        res.status(200).send(user);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.post('/login', async (req, res) => {
    try{
        const user = await User.findUserCredentials(req.body);
        const token = await user.generateJwt();
        res.status(200).send({user, token})
    }
    catch(e){       
        res.status(400).send(e.toString())
    }
})

router.post('/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter(tokenObj => tokenObj.token !== req.token);
        await req.user.save()
        res.status(200).send('Logged out')
    }
    catch(e){
        res.status(500).send(e.toString())
    }
})

router.post('/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = [];
        await req.user.save()
        res.status(200).send('Logged out of all devices')
    }
    catch(e){
        res.status(500).send(e.toString())
    }
})

const profileUpload = multer({
    limits: {
        fileSize: 1000000 //1MB
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(png|jpeg|jpg)$/i)){
            return cb(new Error('Files other than PNG, JPG and JPEG are not supported'))
        }
        cb(undefined, true)
    }
});

router.post('/avatar', auth, profileUpload.single('profPic'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send("Successfully added")
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.post('/avatar/delete', auth, async (req, res) => {
    req.user.avatar = undefined;
    try{
        await req.user.save();
        res.status(200).send("Successfully deleted")
    }
    catch(e){
        res.status(400).send("Error")
    }
})

router.get('/:id/avatar', async (req, res) => {
    const userId = req.params.id;
    try{
        const user = await User.findById(userId);
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }
    catch(e){
        res.status(400).send()
    }
})

module.exports = router;