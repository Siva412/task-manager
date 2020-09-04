const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value == 0 || (value && value < 20)) {
                throw new Error('Cannot be less than 20 yrs')
            }
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase().indexOf('password') !== -1) {
                throw new Error("Cannot contain password");
            }
        }
    },
    tokens: [
        {
            token: {
                type: String
            }
        }
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.generateJwt = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString(), email: user.email }, process.env.JWT_TOKEN);
    user.tokens = user.tokens.concat({token});
    await user.save()
    return token;
}

userSchema.methods.toJSON = function(){
    const user = this;
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;
    return userObj;
}

userSchema.statics.findUserCredentials = async (userCreds) => {
    const user = await User.findOne({ email: userCreds.email });
    if (!user) {
        throw new Error("Authentication failed");
    }
    const isAuth = await bcrypt.compare(userCreds.password, user.password);

    if (!isAuth) {
        throw new Error("Authentication failed");
    }
    return user;
}

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;