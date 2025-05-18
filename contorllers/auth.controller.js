import { PrismaClient } from "@prisma/client";
 import bcrypt from "bcryptjs";
 import crypto from "crypto";
const prisma = new PrismaClient();
import JWT from "jsonwebtoken";
export const registerUser = async (req, res) => {
    const {name , email , password} = req.body;

    if(!name || !email || !password) {
        console.log("data is missing");
        return res.status(400).json({ 
            status: "fail",
            message: "data is missing" 
        });
    }
    try {
        prisma.error.findUnique({
            where:{email}
        })
        if(existingUser) {
            return res.status(400).json({
                status: "fail",
                message: "user already exists",
            });
        }   
        // hooks bcrypt as we dont have any hook like mongoose  using bcrypt.js

        // hashing the pass 
        const hashpassword  = await bcrypt.hash(password, 10);
        const verificationtoken = crypto.randomBytes(32).toString("hex");

        prisma.user.create({
            data: {
                name,
                email,
                password: hashpassword,
                verificationtoken,
            }
        })

        // send the verification email
        const verifyUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify/${verificationtoken}`;
        const message = `Hello ${name},\n\nPlease verify your email by clicking the link: \n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;
        await sendEmail({
            email,
            subject: "Verify your email",
            message,
        });

    }
    catch (error) {

    }
    
};

export const loginUser = async (req, res) => {
    const {email , password} = req.body;

    if(!email || !password) {
        console.log("data is missing");
        return res.status(400).json({ 
            status: "fail",
            message: "data is missing" 
        });
    }
    try {
        const user = await prisma.user.findUnique({
            where:{email}
        })
        if(!User) {
            return res.status(400).json({
                status: "fail",
                message: "invalid email or password",
            });
        }   
        // hooks bcrypt as we dont have any hook like mongoose  using bcrypt.js

        // hashing the pass 
        const isMatch  = await bcrypt.compare(password, User.password);
        bcrypt.compare(password, existingUser.password)
        if(!isMatch) {
            return res.status(400).json({
                status: "fail",
                message: "invalid email or password",
            });
        }
        const token = JWT.sign(
            {id : user.id , role: user.role } ,
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        )
        const CookieOptions = {
            httpOnly : true
        }
        res.cookie('token', token, CookieOptions)
        return res.status(201).json({
            status: "success",
            message: "login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            } 
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "fail",
            message: "Login failed",    
        }); 

    }   
}
