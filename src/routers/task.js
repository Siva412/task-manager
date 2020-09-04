const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.get('',auth, async (req, res) => {
    const status = req.query.completed?true:false;
    try {
        const tasks = await Task.find({owner: req.user._id, completed: status}, null, {limit: 2, skip: 0, sort:{
            createdAt: -1
        }});
        // or await req.user.populate('tasks').execPopulate(); value in req.user.tasks
        /*
            req.user.populate({
                path: "tasks",
                match: {
                    completed: status
                },
                options: {
                    limit: 1,
                    skip: 1,
                    sort: {
                        createdAt: 1 //-1 for opposite
                    }
                }
            })
        */
        res.status(200).send(tasks);
    }
    catch (e) {
        res.status(500).send();
    }
})

router.post('', auth, async (req, res) => {
    const task = new Task({
        description: req.body.description,
        completed: req.body.completed,
        owner: req.user._id
    });
    try {
        await task.save()
        res.status(201).send(task)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.get('/:id', auth, async (req, res) => {
    const userId = req.params.id;
    if (userId) {
        try {
            const task = await Task.findOne({_id: userId, owner: req.user._id});
            //Get user of the task
            //const user = await task.populate('owner').execPopulate();

            if (!task) {
                res.status(404).send("Task not found");
                return;
            }
            res.status(200).send(task);
        }
        catch (e) {
            res.status(500).send();
        }
    }
    else {
        res.status(400).send("Invalid request");
    }
})

router.patch('/:id', auth, async (req, res) => {
    const taskId = req.params.id;
    if(!('completed' in  req.body)){
        res.status(404).send("Invalid request");
        return;
    }
    try{
        const task = await Task.findOne({_id: taskId, owner: req.user._id});
        console.log(task);
        // const task = await Task.findByIdAndUpdate(taskId, {
        //     completed: req.body.completed
        // }, {new: true, runValidators: true});
        if(!task){
            res.status(404).send("No Data found");
            return;
        }
        for(let key in req.body){
            task[key] = req.body[key]
        }
        await task.save();
        res.status(200).send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.delete('/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        if(!task){
            res.status(404).send("No Task found");
            return;
        }
        res.status(200).send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})

module.exports = router;